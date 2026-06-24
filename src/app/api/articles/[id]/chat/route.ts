/**
 * POST /api/articles/[id]/chat
 * AI chatbot for answering questions about an article.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getZAI, isAIConfigured } from '@/lib/zai'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { question } = body

  if (!question || question.length < 3) {
    return NextResponse.json({ ok: false, error: 'السؤال قصير جداً' }, { status: 400 })
  }

  const article = await db.article.findUnique({
    where: { id },
    select: { titleAr: true, bodyAr: true, leadAr: true },
  })
  if (!article) return NextResponse.json({ ok: false, error: 'غير موجود' }, { status: 404 })

  if (!isAIConfigured()) {
    return NextResponse.json({
      ok: false,
      error: 'AI غير متاح حالياً. حاول لاحقاً.',
    })
  }

  const zai = getZAI()

  try {
    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful news assistant. Answer the user's question based ONLY on this article. If the answer is not in the article, say "لا توجد معلومات عن هذا في المقال".

ARTICLE:
Title: ${article.titleAr}
Content: ${article.leadAr || ''} ${article.bodyAr.slice(0, 3000)}

Rules:
- Answer in Arabic (MSA)
- Be concise (2-3 sentences max)
- Only use information from the article
- If unsure, say "لا توجد معلومات عن هذا في المقال"`,
        },
        { role: 'user', content: question },
      ],
      temperature: 0.3,
      max_tokens: 300,
    })

    const answer = response?.choices?.[0]?.message?.content || 'عذراً، لم أتمكن من الإجابة.'

    return NextResponse.json({ ok: true, answer })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
