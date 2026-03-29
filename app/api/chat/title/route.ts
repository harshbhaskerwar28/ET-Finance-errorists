import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt) return NextResponse.json({ title: 'New Chat' })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a chat title generator. Read the user prompt and generate an extremely punchy, exactly 2-word title summarising the user\'s financial query. ONLY output the 2-word title string. DO NOT use quotes, markdown, or punctuation.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 15,
    })

    const title = response.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') || 'Market Analysis'
    return NextResponse.json({ title })
  } catch (err) {
    console.error('Title generation error:', err)
    return NextResponse.json({ title: 'Market Analysis' })
  }
}
