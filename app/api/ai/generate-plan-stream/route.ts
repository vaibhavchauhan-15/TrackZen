import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Streaming AI Plan Generation API
 *
 * POST: Generate study plan using AI with SSE streaming
 *
 * Professional patterns:
 * - Model fallback chain (fast → faster)
 * - Request timeout via AbortController (30s)
 * - JSON extraction with regex fallback
 * - Streaming with backpressure-safe ReadableStream
 * - Sanitised topic output with validation
 */

export const dynamic = 'force-dynamic'

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
] as const

const AI_TIMEOUT_MS = 30_000

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await request.json()
    const { prompt } = body

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`))
        }

        try {
          sendEvent('status', { message: 'Connecting to AI...', progress: 5 })

          let result: { topics: any[] } | null = null

          // Model fallback chain
          for (let i = 0; i < MODELS.length; i++) {
            const model = MODELS[i]
            try {
              sendEvent('status', { message: 'Analyzing your request...', progress: 10 + i * 5 })

              // Abort controller for timeout
              const ac = new AbortController()
              const timeout = setTimeout(() => ac.abort(), AI_TIMEOUT_MS)

              try {
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                  method: 'POST',
                  signal: ac.signal,
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                  },
                  body: JSON.stringify({
                    model,
                    messages: [
                      {
                        role: 'system',
                        content: 'You are an expert study planner. Generate comprehensive, realistic study plans. Be concise but thorough.',
                      },
                      {
                        role: 'user',
                        content: `Create a study plan for: "${prompt}"

Return ONLY valid JSON with this structure:
{
  "topics": [
    {
      "title": "Topic Name",
      "priority": 1,
      "weightage": 10,
      "subtopics": [
        { "title": "Subtopic Name", "estimated_hours": 5, "priority": 1 }
      ]
    }
  ]
}

Rules:
- Priority: 1 (highest) to 4 (low)
- Each topic must have 1+ subtopics with hours > 0
- Be realistic with time estimates
- Include all relevant topics for the subject

JSON only, no markdown.`,
                      },
                    ],
                    temperature: 0.6,
                    max_tokens: 3500,
                  }),
                })

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}))
                  throw new Error((errorData as any).error?.message || `HTTP ${response.status}`)
                }

                sendEvent('status', { message: 'Processing AI response...', progress: 40 })

                const data = await response.json()
                const content = (data as any).choices[0]?.message?.content

                if (!content) throw new Error('No content in response')

                // Parse JSON with fallback regex extraction
                result = parseJsonSafe(content)
              } finally {
                clearTimeout(timeout)
              }

              break // Success
            } catch (error) {
              console.error(`Model ${model} failed:`, error)
              if (i === MODELS.length - 1) throw error
            }
          }

          if (!result?.topics || !Array.isArray(result.topics)) {
            throw new Error('Invalid response format')
          }

          sendEvent('status', { message: 'Building your study plan...', progress: 50 })

          // Stream topics one-by-one
          const topicsList = result.topics
          const totalTopics = topicsList.length
          let totalSubtopics = 0
          let totalHours = 0

          for (let i = 0; i < topicsList.length; i++) {
            const topic = topicsList[i]
            const subtopics = (topic.subtopics || []).map((st: any, idx: number) => ({
              title: st.title || `Subtopic ${idx + 1}`,
              estimatedHours: Math.max(0.5, Number(st.estimated_hours || st.estimatedHours) || 1),
              priority: clamp(Number(st.priority) || 3, 1, 4),
            }))

            // Ensure at least one subtopic
            if (subtopics.length === 0) {
              subtopics.push({
                title: topic.title || `Topic ${i + 1}`,
                estimatedHours: Math.max(1, Number(topic.estimated_hours) || 2),
                priority: 3,
              })
            }

            const topicHours = subtopics.reduce((sum: number, st: any) => sum + st.estimatedHours, 0)
            totalHours += topicHours
            totalSubtopics += subtopics.length

            sendEvent('topic', {
              topic: {
                title: topic.title || `Topic ${i + 1}`,
                estimatedHours: topicHours,
                priority: clamp(Number(topic.priority) || 3, 1, 4),
                weightage: Number(topic.weightage) || 0,
                subtopics,
              },
              index: i,
              total: totalTopics,
              progress: 50 + Math.round(((i + 1) / totalTopics) * 45),
            })

            // Small delay for animation
            await new Promise(r => setTimeout(r, 50))
          }

          sendEvent('complete', {
            totalTopics,
            totalSubtopics,
            totalHours: Math.round(totalHours * 10) / 10,
            progress: 100,
          })
        } catch (error: any) {
          console.error('Streaming AI error:', error)
          sendEvent('error', { message: error.message || 'Failed to generate plan' })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('AI generation error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// ── Helpers ──────────────────────────────────────────────────────

/** Parse JSON with regex fallback for markdown-wrapped responses. */
function parseJsonSafe(content: string): any {
  try {
    return JSON.parse(content)
  } catch {
    const match = content.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Failed to parse JSON')
  }
}

/** Clamp a number between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
