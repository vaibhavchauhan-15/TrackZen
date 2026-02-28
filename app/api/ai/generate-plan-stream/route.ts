import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Streaming AI Plan Generation API
 * 
 * POST: Generate study plan using AI with streaming response
 * Topics and subtopics are sent one by one for smooth UI updates
 */

export const dynamic = 'force-dynamic'

// Optimized models for faster response
const MODELS = [
  'llama-3.3-70b-versatile',   // Fast and powerful
  'llama-3.1-8b-instant'       // Fallback: Very fast
]

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    const { prompt } = body

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create a readable stream for SSE
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: any) => {
          const message = `data: ${JSON.stringify({ type, ...data })}\n\n`
          controller.enqueue(encoder.encode(message))
        }

        try {
          // Send initial status
          sendEvent('status', { message: 'Connecting to AI...', progress: 5 })
          
          let lastError: Error | null = null
          let result: any = null

          // Try each model
          for (let i = 0; i < MODELS.length; i++) {
            const model = MODELS[i]
            try {
              sendEvent('status', { 
                message: `Analyzing your request...`, 
                progress: 10 + (i * 5)
              })

              const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                  model,
                  messages: [
                    {
                      role: 'system',
                      content: `You are an expert study planner. Generate comprehensive, realistic study plans. Be concise but thorough.`
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

JSON only, no markdown.`
                    }
                  ],
                  temperature: 0.6,
                  max_tokens: 3500,
                }),
              })

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error?.message || `HTTP ${response.status}`)
              }

              sendEvent('status', { message: 'Processing AI response...', progress: 40 })

              const data = await response.json()
              const content = data.choices[0]?.message?.content

              if (!content) {
                throw new Error('No content in response')
              }

              // Parse JSON
              try {
                result = JSON.parse(content)
              } catch {
                const jsonMatch = content.match(/\{[\s\S]*\}/)
                if (jsonMatch) {
                  result = JSON.parse(jsonMatch[0])
                } else {
                  throw new Error('Failed to parse JSON')
                }
              }

              break // Success, exit loop
            } catch (error) {
              lastError = error as Error
              console.error(`Model ${model} failed:`, error)
              if (i === MODELS.length - 1) throw lastError
            }
          }

          if (!result?.topics || !Array.isArray(result.topics)) {
            throw new Error('Invalid response format')
          }

          sendEvent('status', { message: 'Building your study plan...', progress: 50 })

          // Stream topics one by one with delays for smooth animation
          const topics = result.topics
          let totalTopics = topics.length
          let totalSubtopics = 0
          let totalHours = 0

          for (let i = 0; i < topics.length; i++) {
            const topic = topics[i]
            const subtopics = (topic.subtopics || []).map((st: any, idx: number) => ({
              title: st.title || `Subtopic ${idx + 1}`,
              estimatedHours: Math.max(0.5, Number(st.estimated_hours || st.estimatedHours) || 1),
              priority: Math.min(4, Math.max(1, Number(st.priority) || 3)),
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

            const sanitizedTopic = {
              title: topic.title || `Topic ${i + 1}`,
              estimatedHours: topicHours,
              priority: Math.min(4, Math.max(1, Number(topic.priority) || 3)),
              weightage: Number(topic.weightage) || 0,
              subtopics,
            }

            // Send topic event
            sendEvent('topic', {
              topic: sanitizedTopic,
              index: i,
              total: totalTopics,
              progress: 50 + Math.round((i + 1) / totalTopics * 45)
            })

            // Small delay between topics for animation effect (50ms)
            await new Promise(resolve => setTimeout(resolve, 50))
          }

          // Send completion event
          sendEvent('complete', {
            totalTopics,
            totalSubtopics,
            totalHours: Math.round(totalHours * 10) / 10,
            progress: 100
          })

        } catch (error: any) {
          console.error('Streaming AI error:', error)
          sendEvent('error', { 
            message: error.message || 'Failed to generate plan' 
          })
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('AI generation error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
