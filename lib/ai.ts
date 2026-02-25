export async function generateAIPlan(prompt: string): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error('No AI API key configured. Please set GROQ_API_KEY in your environment.')
  }

  return generateWithGroq(prompt)
}

async function generateWithGroq(prompt: string) {
  // Models in priority order: default -> fallback1 -> fallback2
  const models = [
    'openai/gpt-oss-120b',       // Default: Most comprehensive
    'llama-3.3-70b-versatile',   // Fallback 1: Versatile and powerful
    'llama-3.1-8b-instant'       // Fallback 2: Fast and lightweight
  ]

  let lastError: Error | null = null

  // Try each model in sequence
  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    try {
      console.log(`Attempting to generate plan with model: ${model}`)
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: `You are an expert study planner and educational consultant. You have deep knowledge about various exams, courses, and learning paths. Generate comprehensive, realistic, and well-structured study plans.`
            },
            {
              role: 'user',
              content: `Create a detailed study plan for: "${prompt}"

Generate a comprehensive plan with topics, subtopics, realistic time estimates, and priorities.

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks, no extra text.

Use this exact structure:
{
  "topics": [
    {
      "title": "Topic Name",
      "estimated_hours": 0,
      "priority": 1,
      "weightage": 10,
      "subtopics": [
        {
          "title": "Subtopic Name",
          "estimated_hours": 5,
          "priority": 1
        }
      ]
    }
  ]
}

Guidelines:
- Priority levels: 1 (highest), 2 (high), 3 (medium), 4 (low)
- Estimated hours: Be realistic based on topic complexity
- Weightage: Percentage importance in overall syllabus (optional, 0 if unknown)
- Each topic MUST have at least one subtopic with hours > 0
- Topic hours will be auto-calculated from subtopics
- For exams like GATE, JEE, UPSC, etc., include ALL relevant topics from the syllabus
- For courses, break down into logical modules and lessons
- Consider standard exam patterns and weightage

Return ONLY the JSON object, nothing else.`
            }
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error?.message || `HTTP ${response.status}`
        throw new Error(`Model ${model} failed: ${errorMsg}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error(`Model ${model}: No content in response`)
      }

      // Try to parse JSON directly
      try {
        const result = JSON.parse(content)
        console.log(`✅ Successfully generated plan with model: ${model}`)
        return result
      } catch (e) {
        // If direct parse fails, try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0])
          console.log(`✅ Successfully generated plan with model: ${model}`)
          return result
        }
        throw new Error(`Model ${model}: Failed to parse response as JSON`)
      }
    } catch (error) {
      lastError = error as Error
      console.error(`❌ Model ${model} failed:`, error)
      
      // If this is not the last model, try the next one
      if (i < models.length - 1) {
        console.log(`Trying fallback model...`)
        continue
      }
    }
  }

  // All models failed
  throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown error'}`)
}

export async function parseSyllabusPDF(file: File): Promise<string> {
  // In a real implementation, you would use a library like pdf-parse
  // For now, we'll return a placeholder
  return 'Parsed syllabus text would go here'
}
