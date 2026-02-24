export async function generateAIPlan(prompt: string): Promise<any> {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('No AI API key configured')
  }

  // Check which API to use
  if (process.env.CLAUDE_API_KEY) {
    return generateWithClaude(prompt)
  } else {
    return generateWithOpenAI(prompt)
  }
}

async function generateWithClaude(prompt: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are an expert study planner. Generate a structured study plan based on this request: "${prompt}".

Return a JSON object with this structure:
{
  "topics": [
    {
      "title": "Topic name",
      "estimated_hours": 10,
      "priority": 1,
      "weightage": 15,
      "subtopics": [
        {
          "title": "Subtopic name",
          "estimated_hours": 3,
          "priority": 1
        }
      ]
    }
  ]
}

Priority: 1 (highest) to 5 (lowest)
Estimated hours: realistic time needed
Weightage: optional percentage for exam importance

Return only valid JSON, no markdown or explanation.`,
        },
      ],
    }),
  })

  const data = await response.json()
  const content = data.content[0].text

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  throw new Error('Failed to parse AI response')
}

async function generateWithOpenAI(prompt: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert study planner. Generate structured study plans in JSON format.',
        },
        {
          role: 'user',
          content: `Generate a study plan for: "${prompt}".

Return JSON:
{
  "topics": [
    {
      "title": "Topic name",
      "estimated_hours": 10,
      "priority": 1,
      "weightage": 15,
      "subtopics": [{"title": "Sub", "estimated_hours": 3, "priority": 1}]
    }
  ]
}`,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content)
}

export async function parseSyllabusPDF(file: File): Promise<string> {
  // In a real implementation, you would use a library like pdf-parse
  // For now, we'll return a placeholder
  return 'Parsed syllabus text would go here'
}
