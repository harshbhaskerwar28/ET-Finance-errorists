// app/api/chat/market/route.ts
// Streaming Market AI Chat with Tool Calling — Feature 3

import OpenAI from 'openai'
import { auth } from '@clerk/nextjs/server'
import { CHAT_TOOLS, runChatTool } from '@/lib/ai/chat-tools'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// ── Master System Prompt ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are ET AI — an expert Indian stock market analyst, portfolio advisor, and financial co-pilot built into the Economic Times platform.

## Your Identity & Capabilities
- You have live access to real-time NSE/BSE market data, stock prices, historical charts, and corporate filings
- You know the user's exact portfolio holdings, allocation, and performance in real-time
- You are deeply knowledgeable about Indian markets: NSE, BSE, SEBI, NIFTY, SENSEX, RBI, IRDAI regulations
- You use Indian financial instruments: SIP, ELSS, PPF, FD, NPS, ULIP, SGBs, REITs, InvITs

## Tool Usage Rules (CRITICAL)
- ALWAYS use tools for ANY factual data — NEVER guess or hallucinate numbers
- For portfolio questions → use get_user_portfolio FIRST, then analyze the real data
- For stock prices → ALWAYS call get_stock_price, never estimate
- For charts/trends → use get_stock_history to get real OHLCV data
- For sector analysis → use sector_analysis tool
- For market overview → use get_market_overview for real indices
- For ANY news, current events, dates, or missing market data → you MUST use \`web_search\` to verify reality. NEVER guess.
- Multiple tools in sequence is expected and encouraged for complex queries
- Wait for tool results before answering — never fabricate data

## Chart Rendering
- ⚠️ DO NOT OVERUSE CHARTS. Only generate a chart if the user explicitly asks for a visual/chart, or if you are comparing 3+ stocks, or doing a deep portfolio analysis. 
- Do NOT generate a chart for a simple stock price check or simple query.
- When you have chart data from a tool, present numbers naturally in your text
- The chart will be automatically rendered from tool result's "chart" field
- ⚠️ DO NOT describe the chart visually or say "here is the chart below". Just provide the analysis naturally.
- ⚠️ NEVER output markdown image links (e.g. ![Chart](url)), HTML tags (like <chart>), or any other chart placeholders! The UI natively drops a beautiful, fully interactive chart widget directly below your text block automatically via backend payload. Do not try to "embed" it yourself.

## Response Format
- You MUST use beautiful Markdown extensively in your responses.
- Use **bold**, *italics*, \`inline code\`, and > blockquotes to make the text scannable and premium.
- Use Markdown tables (wrapped with |) whenever you list multiple stocks, comparisons, or structured data (this will render as a beautiful glass table in the UI).
- Keep responses concise: under 200 words for simple queries, 400 for complex analysis
- Use Indian number system: ₹1.5 Crore, not $150,000
- Use **bold** for key metrics, stock symbols, and important numbers
- After EVERY response, you MUST provide 3 follow-up chat suggestions.
- Output them EXACTLY like this at the very end of your message:
<suggestions>
["Question 1", "Question 2", "Question 3"]
</suggestions>
- Suggestions must be relevant to the current conversation context

## Personality & Tone
- Warm, expert, like a trusted SEBI-registered investment advisor friend
- Direct and actionable — no unnecessary padding
- Acknowledge risk always; end buy/sell suggestions with: "This is for informational purposes only, not SEBI-registered financial advice."
- Use the user's first name when available
- If asked something unclear, ask ONE clarifying question before proceeding

## Indian Context Priority
- Prefer NSE over BSE; mention both when relevant
- Reference Nifty 50/Nifty Next 50/Nifty Midcap indices appropriately
- Tax calculations use Indian FY and LTCG/STCG rules (LTCG 12.5% above ₹1.25L, STCG 20%)
- Mention SEBI circulars/RBI policies when relevant to queries`

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { messages, sessionId } = await req.json() as {
    messages: OpenAI.Chat.ChatCompletionMessageParam[]
    sessionId?: string
  }

  // Fetch user profile for personalisation context
  let profileContext = ''
  try {
    const { createServerClient } = await import('@/lib/supabase')
    const supabase = await createServerClient()
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, persona, risk_score, primary_goal, goal_horizon_years')
      .eq('clerk_user_id', userId)
      .single()

    if (profile) {
      profileContext = `\n\nUser Profile: Name=${profile.first_name ?? 'User'}, Persona=${profile.persona ?? 'unknown'}, Risk Score=${profile.risk_score ?? 5}/10, Goal=${profile.primary_goal ?? 'wealth creation'}, Horizon=${profile.goal_horizon_years ?? 10} years`
    }
  } catch { /* use generic context */ }

  const currentDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long' })
  const dateContext = `\n\nCURRENT DATE & TIME (IST): ${currentDate}\nAbsolute rule: Do NOT contradict this current date. Treat it as the present moment.`
  
  const systemContent = SYSTEM_PROMPT + dateContext + profileContext
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
        } catch { /* stream closed */ }
      }

      try {
        let allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemContent },
          ...messages,
        ]

        let finalText = ''
        const toolsUsed: string[] = []
        const allCharts: any[] = []

        // Tool-calling loop (max 6 rounds)
        for (let round = 0; round < 6; round++) {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: allMessages,
            tools: CHAT_TOOLS as any,
            tool_choice: 'auto',
            stream: true,
            temperature: 0.3,
            max_tokens: 1200,
          })

          let assistantText = ''
          const toolCallAcc: Record<number, { id: string; name: string; args: string }> = {}
          let hasToolCalls = false

          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta
            if (!delta) continue

            // Stream text tokens word by word
            if (delta.content) {
              assistantText += delta.content
              finalText += delta.content
              send({ type: 'text', content: delta.content })
            }

            // Accumulate tool call chunks
            if (delta.tool_calls) {
              hasToolCalls = true
              for (const tc of delta.tool_calls) {
                if (!toolCallAcc[tc.index]) {
                  toolCallAcc[tc.index] = { id: '', name: '', args: '' }
                }
                if (tc.id) toolCallAcc[tc.index].id = tc.id
                if (tc.function?.name) toolCallAcc[tc.index].name += tc.function.name
                if (tc.function?.arguments) toolCallAcc[tc.index].args += tc.function.arguments
              }
            }
          }

          // No tool calls = final answer
          if (!hasToolCalls || Object.keys(toolCallAcc).length === 0) break

          // Push assistant message with tool_calls
          const toolCallsArr = Object.values(toolCallAcc)
          allMessages.push({
            role: 'assistant',
            content: assistantText || null,
            tool_calls: toolCallsArr.map(tc => ({
              id: tc.id,
              type: 'function' as const,
              function: { name: tc.name, arguments: tc.args },
            })),
          })

          // Execute tools
          for (const tc of toolCallsArr) {
            if (!tc.name) continue
            send({ type: 'tool_start', tool: tc.name })
            if (!toolsUsed.includes(tc.name)) toolsUsed.push(tc.name)

            let parsedArgs: Record<string, string> = {}
            try { parsedArgs = JSON.parse(tc.args || '{}') } catch { /* empty args */ }

            const result = await runChatTool(tc.name, parsedArgs, userId)

            // Extract chart and references from tool result
            try {
              const parsed = JSON.parse(result)
              if (parsed.chart) {
                allCharts.push(parsed.chart)
                send({ type: 'chart', chart: parsed.chart })
              }
              if (parsed.references) {
                send({ type: 'references', references: parsed.references })
              }
            } catch { /* no chart or references */ }

            allMessages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: result,
            })

            send({ type: 'tool_end', tool: tc.name })
          }
        }

        // Persist chat to DB (best-effort)
        try {
          const { createServerClient } = await import('@/lib/supabase')
          const supabase = await createServerClient()
          const lastUserMsg = messages.at(-1)
          if (lastUserMsg && sessionId) {
            await supabase.from('chat_messages').insert([
              {
                session_id: sessionId,
                clerk_user_id: userId,
                role: 'user',
                content: typeof lastUserMsg.content === 'string' ? lastUserMsg.content : JSON.stringify(lastUserMsg.content),
              },
              {
                session_id: sessionId,
                clerk_user_id: userId,
                role: 'assistant',
                content: finalText,
                tools_used: toolsUsed,
              },
            ])
          }
        } catch { /* non-critical */ }

        send({ type: 'done', toolsUsed, chartsCount: allCharts.length })
      } catch (err) {
        console.error('Chat route error:', err)
        send({ type: 'error', message: String(err) })
      } finally {
        try { controller.close() } catch { /* already closed */ }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
