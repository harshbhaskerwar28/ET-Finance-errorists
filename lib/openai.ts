// Shared OpenAI client for all API routes
import OpenAI from "openai"

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠ OPENAI_API_KEY is not set in .env.local")
}

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" })

// Central model configuration
// Updated to gpt-5.4-mini as requested. 
export const AI_MODEL = "gpt-5.4-mini" 

// Chat with optional web search (for market-related queries)
export async function aiChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  useWebSearch = false
): Promise<string> {
  try {
    if (useWebSearch) {
      const res = await openai.responses.create({
        model: AI_MODEL,
        input: messages,
        tools: [{ type: "web_search_preview" }],
      })
      return res.output_text ?? ""
    }
    const res = await openai.chat.completions.create({
      model: AI_MODEL,
      messages,
      temperature: 0.6,
      max_tokens: 900,
    })
    return res.choices[0]?.message?.content ?? ""
  } catch (error: any) {
    console.error("AI Chat Error:", error)
    return `Error: ${error.message}. Please check if ${AI_MODEL} is available in your OpenAI account.`
  }
}
