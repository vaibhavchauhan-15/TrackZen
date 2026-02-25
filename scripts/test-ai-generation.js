// Test AI Plan Generation for English Exam
require('dotenv').config()

async function testAIGeneration() {
  const prompt = "IELTS English Exam 2026 preparation"
  
  console.log('\n🎯 Testing AI Study Plan Generation')
  console.log('=====================================')
  console.log(`Prompt: "${prompt}"`)
  console.log('API Key:', process.env.GROQ_API_KEY ? '✓ Configured' : '✗ Missing')
  console.log('\n')

  const models = [
    'openai/gpt-oss-120b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant'
  ]

  for (const model of models) {
    try {
      console.log(`\n📡 Attempting model: ${model}`)
      console.log('⏳ Generating plan...')
      
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
              content: 'You are an expert study planner and educational consultant. Generate comprehensive, realistic, and well-structured study plans.'
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
- For exams like IELTS, include ALL relevant sections (Reading, Writing, Listening, Speaking)
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
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content in response')
      }

      // Parse JSON
      let result
      try {
        result = JSON.parse(content)
      } catch (e) {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Failed to parse JSON')
        }
      }

      console.log(`\n✅ SUCCESS with ${model}!`)
      console.log('\n📊 Generated Study Plan:')
      console.log('========================\n')
      
      result.topics.forEach((topic, i) => {
        console.log(`${i + 1}. ${topic.title}`)
        console.log(`   Priority: ${topic.priority} | Hours: ${topic.estimated_hours} | Weightage: ${topic.weightage || 'N/A'}%`)
        console.log(`   Subtopics (${topic.subtopics.length}):`)
        topic.subtopics.forEach((sub, j) => {
          console.log(`      ${j + 1}. ${sub.title} - ${sub.estimatedHours || sub.estimated_hours}h (Priority: ${sub.priority})`)
        })
        console.log('')
      })

      const totalHours = result.topics.reduce((sum, t) => {
        const subtopicHours = t.subtopics.reduce((s, st) => s + (st.estimatedHours || st.estimated_hours || 0), 0)
        return sum + subtopicHours
      }, 0)

      console.log(`\n📈 Summary:`)
      console.log(`   Total Topics: ${result.topics.length}`)
      console.log(`   Total Hours: ${totalHours.toFixed(1)}h`)
      console.log(`   Model Used: ${model}`)
      console.log('\n✨ Test completed successfully!\n')
      
      return result

    } catch (error) {
      console.log(`\n❌ FAILED with ${model}`)
      console.log(`   Error: ${error.message}`)
      
      // Try next model
      if (model !== models[models.length - 1]) {
        console.log(`   → Trying next model...`)
      }
    }
  }

  console.log('\n❌ All models failed!\n')
}

testAIGeneration()
