import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateAIPlan } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Generate AI plan
    const result = await generateAIPlan(prompt)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating AI plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate plan. Please try again.' },
      { status: 500 }
    )
  }
}
