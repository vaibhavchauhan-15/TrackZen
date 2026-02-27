import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateAIPlan } from '@/lib/ai'

/**
 * AI Plan Generation API
 * 
 * POST: Generate study plan using AI
 * 
 * Features:
 * 1. Uses Groq AI with fallback models
 * 2. Validates and sanitizes AI output
 * 3. Returns structured topic data
 */

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prompt } = body

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Generate plan using AI
    const result = await generateAIPlan(prompt.trim())

    // Validate the result
    if (!result || !result.topics || !Array.isArray(result.topics)) {
      return NextResponse.json({ 
        error: 'AI generated invalid response. Please try again.' 
      }, { status: 500 })
    }

    // Sanitize and validate topics
    const sanitizedTopics = result.topics.map((topic: any, index: number) => {
      const subtopics = (topic.subtopics || []).map((st: any, stIndex: number) => ({
        title: st.title || `Subtopic ${stIndex + 1}`,
        estimatedHours: Math.max(0.5, Number(st.estimated_hours || st.estimatedHours) || 1),
        priority: Math.min(4, Math.max(1, Number(st.priority) || 3)),
      }))

      // If no subtopics, create one from the topic
      if (subtopics.length === 0) {
        subtopics.push({
          title: topic.title || `Topic ${index + 1}`,
          estimatedHours: Math.max(1, Number(topic.estimated_hours || topic.estimatedHours) || 2),
          priority: Math.min(4, Math.max(1, Number(topic.priority) || 3)),
        })
      }

      return {
        title: topic.title || `Topic ${index + 1}`,
        estimatedHours: subtopics.reduce((sum: number, st: any) => sum + st.estimatedHours, 0),
        priority: Math.min(4, Math.max(1, Number(topic.priority) || 3)),
        weightage: Number(topic.weightage) || 0,
        subtopics,
      }
    })

    // Calculate total hours
    const totalHours = sanitizedTopics.reduce((sum: number, t: any) => sum + t.estimatedHours, 0)

    return NextResponse.json({
      topics: sanitizedTopics,
      totalHours: Math.round(totalHours * 10) / 10,
      topicCount: sanitizedTopics.length,
      subtopicCount: sanitizedTopics.reduce((sum: number, t: any) => sum + t.subtopics.length, 0),
    })
  } catch (error: any) {
    console.error('AI generation error:', error)
    
    // Handle specific errors
    if (error.message?.includes('API key')) {
      return NextResponse.json({ 
        error: 'AI service not configured. Please contact support.' 
      }, { status: 503 })
    }
    
    if (error.message?.includes('rate limit')) {
      return NextResponse.json({ 
        error: 'AI service is busy. Please try again in a moment.' 
      }, { status: 429 })
    }

    return NextResponse.json({ 
      error: error.message || 'Failed to generate plan. Please try again.' 
    }, { status: 500 })
  }
}
