'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Calendar, Plus, Trash2, ChevronRight, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

interface Subtopic {
  title: string
  estimatedHours: number
  priority: number
}

interface Topic {
  title: string
  estimatedHours: number
  priority: number
  weightage: number
  subtopics: Subtopic[]
}

export default function NewPlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [planData, setPlanData] = useState({
    title: '',
    type: 'exam',
    startDate: '',
    endDate: '',
    dailyHours: '',
    color: '#7C3AED',
  })
  const [topics, setTopics] = useState<Topic[]>([])

  const handleAIGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      const data = await res.json()
      if (data.topics) {
        setTopics(data.topics.map((t: any) => ({
          ...t,
          priority: t.priority || 3,
          weightage: t.weightage || 0,
          subtopics: t.subtopics || []
        })))
      }
      if (data.error) {
        setError(data.error)
      }
    } catch (error) {
      console.error('AI generation failed:', error)
      setError('Failed to generate plan. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!planData.title.trim()) {
      setError('Plan title is required')
      return
    }
    if (!planData.startDate) {
      setError('Start date is required')
      return
    }
    if (topics.length === 0) {
      setError('Add at least one topic to create a plan')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...planData,
          topics,
          isAiGenerated: false,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else if (data.plan) {
        router.push(`/planner`)
      }
    } catch (error) {
      console.error('Failed to create plan:', error)
      setError('Failed to create plan. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addTopic = () => {
    setTopics([
      ...topics,
      {
        title: '',
        estimatedHours: 0,
        priority: 3,
        weightage: 0,
        subtopics: [],
      },
    ])
  }

  const addSubtopic = (topicIndex: number) => {
    const newTopics = [...topics]
    newTopics[topicIndex].subtopics.push({
      title: '',
      estimatedHours: 0,
      priority: 3,
    })
    setTopics(newTopics)
  }

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index))
  }

  const removeSubtopic = (topicIndex: number, subtopicIndex: number) => {
    const newTopics = [...topics]
    newTopics[topicIndex].subtopics = newTopics[topicIndex].subtopics.filter((_, i) => i !== subtopicIndex)
    setTopics(newTopics)
  }

  const updateTopic = (index: number, field: keyof Topic, value: any) => {
    const newTopics = [...topics]
    newTopics[index] = { ...newTopics[index], [field]: value }
    setTopics(newTopics)
  }

  const updateSubtopic = (topicIndex: number, subtopicIndex: number, field: keyof Subtopic, value: any) => {
    const newTopics = [...topics]
    newTopics[topicIndex].subtopics[subtopicIndex] = {
      ...newTopics[topicIndex].subtopics[subtopicIndex],
      [field]: value
    }
    setTopics(newTopics)
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Highest'
      case 2: return 'High'
      case 3: return 'Medium'
      case 4: return 'Low'
      case 5: return 'Lowest'
      default: return 'Medium'
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-500'
      case 2: return 'text-orange-500'
      case 3: return 'text-yellow-500'
      case 4: return 'text-blue-500'
      case 5: return 'text-gray-500'
      default: return 'text-yellow-500'
    }
  }

  // Calculate total hours - subtopics are parts of topic hours
  const calculateTotalHours = () => {
    return topics.reduce((sum, topic) => {
      // Always count topic hours - subtopics are just breakdowns, not additional
      return sum + (topic.estimatedHours || 0)
    }, 0)
  }

  // Calculate subtopic total for a specific topic
  const getSubtopicTotal = (topicIndex: number) => {
    const topic = topics[topicIndex]
    if (!topic.subtopics || topic.subtopics.length === 0) return 0
    return topic.subtopics.reduce((sum, st) => sum + (st.estimatedHours || 0), 0)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Create New Plan</h1>
        <p className="mt-2 text-text-secondary">
          Use AI to generate a plan or create one manually
        </p>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Plan Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
          <CardDescription>Set up your plan's basic information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Plan Title *</Label>
            <Input
              id="title"
              placeholder="e.g., GATE 2026 Preparation"
              value={planData.title}
              onChange={(e) => setPlanData({ ...planData, title: e.target.value })}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="type">Plan Type</Label>
            <Select
              value={planData.type}
              onValueChange={(value) => setPlanData({ ...planData, type: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="startDate" className="text-sm font-medium">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={planData.startDate}
                onChange={(e) => setPlanData({ ...planData, startDate: e.target.value })}
                className="mt-2 cursor-pointer text-base"
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-sm font-medium">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={planData.endDate}
                onChange={(e) => setPlanData({ ...planData, endDate: e.target.value })}
                className="mt-2 cursor-pointer text-base"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="dailyHours" className="text-sm font-medium">Daily Study Hours (Optional)</Label>
            <Input
              id="dailyHours"
              type="number"
              step="0.5"
              min="0"
              placeholder="e.g., 4"
              value={planData.dailyHours}
              onChange={(e) => setPlanData({ ...planData, dailyHours: e.target.value })}
              className="mt-2 text-base font-medium"
            />
          </div>
        </CardContent>
      </Card>

      {/* Topics Section */}
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">
            <Calendar className="mr-2 h-4 w-4" />
            Add Topics Manually
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Topics & Subtopics</CardTitle>
                  <CardDescription>
                    Add topics to your study plan with priorities. 
                    <span className="block mt-1 text-xs text-yellow-600 dark:text-yellow-500">
                      💡 Tip: Subtopics are parts of the topic - they break down the topic hours.
                    </span>
                  </CardDescription>
                </div>
                <Button onClick={addTopic} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Topic
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {topics.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <p>No topics added yet. Click "Add Topic" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topics.map((topic, topicIndex) => {
                    const subtopicTotal = getSubtopicTotal(topicIndex)
                    const hasSubtopics = topic.subtopics && topic.subtopics.length > 0
                    
                    return (
                    <Card key={topicIndex} className="border-2">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2 flex items-center gap-3">
                              <div className="flex-1">
                                <Label>Topic Title *</Label>
                                <Input
                                  value={topic.title}
                                  onChange={(e) => updateTopic(topicIndex, 'title', e.target.value)}
                                  placeholder="e.g., Data Structures"
                                  className="mt-1"
                                />
                              </div>
                              <div className="pt-6">
                                <div className="px-3 py-1.5 rounded-md bg-purple-100 dark:bg-purple-900 border border-purple-300 dark:border-purple-700">
                                  <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                                    {(topic.estimatedHours || 0).toFixed(1)}h
                                  </span>
                                  {hasSubtopics && subtopicTotal > 0 && (
                                    <span className="text-xs ml-1 text-purple-600 dark:text-purple-400">
                                      ({subtopicTotal.toFixed(1)}h allocated)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label>Estimated Hours * {hasSubtopics && <span className="text-xs text-yellow-500">(subtopics are parts of this)</span>}</Label>
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={topic.estimatedHours}
                                onChange={(e) => updateTopic(topicIndex, 'estimatedHours', parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 20"
                                className="mt-1 text-base font-semibold"
                              />
                              {hasSubtopics && subtopicTotal > (topic.estimatedHours || 0) && (
                                <p className="text-xs text-red-500 mt-1">
                                  ⚠️ Subtopics total ({subtopicTotal.toFixed(1)}h) exceeds topic hours
                                </p>
                              )}
                            </div>
                            <div>
                              <Label>Priority</Label>
                              <Select
                                value={topic.priority.toString()}
                                onValueChange={(value) => updateTopic(topicIndex, 'priority', parseInt(value))}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">
                                    <div className="flex items-center gap-2">
                                      <ArrowUpCircle className="h-4 w-4 text-red-500" />
                                      <span>Highest</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="2">
                                    <div className="flex items-center gap-2">
                                      <ArrowUpCircle className="h-4 w-4 text-orange-500" />
                                      <span>High</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="3">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className="h-4 w-4 text-yellow-500" />
                                      <span>Medium</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="4">
                                    <div className="flex items-center gap-2">
                                      <ArrowDownCircle className="h-4 w-4 text-blue-500" />
                                      <span>Low</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="5">
                                    <div className="flex items-center gap-2">
                                      <ArrowDownCircle className="h-4 w-4 text-gray-500" />
                                      <span>Lowest</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTopic(topicIndex)}
                            className="mt-6"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>

                        {/* Subtopics */}
                        <div className="ml-6 space-y-3 border-l-2 border-border pl-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-text-secondary">
                              Subtopics {hasSubtopics && `(${subtopicTotal.toFixed(1)}h / ${(topic.estimatedHours || 0).toFixed(1)}h)`}
                            </Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addSubtopic(topicIndex)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add Subtopic
                            </Button>
                          </div>
                          {topic.subtopics.map((subtopic, subtopicIndex) => (
                            <div key={subtopicIndex} className="flex items-start gap-2">
                              <div className="flex-1 grid gap-2 md:grid-cols-3">
                                <Input
                                  value={subtopic.title}
                                  onChange={(e) => updateSubtopic(topicIndex, subtopicIndex, 'title', e.target.value)}
                                  placeholder="Subtopic title"
                                />
                                <Input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={subtopic.estimatedHours}
                                  onChange={(e) => updateSubtopic(topicIndex, subtopicIndex, 'estimatedHours', parseFloat(e.target.value) || 0)}
                                  placeholder="Hours"
                                  className="text-base font-semibold"
                                />
                                <Select
                                  value={subtopic.priority.toString()}
                                  onValueChange={(value) => updateSubtopic(topicIndex, subtopicIndex, 'priority', parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">Highest</SelectItem>
                                    <SelectItem value="2">High</SelectItem>
                                    <SelectItem value="3">Medium</SelectItem>
                                    <SelectItem value="4">Low</SelectItem>
                                    <SelectItem value="5">Lowest</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSubtopic(topicIndex, subtopicIndex)}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Study Plan Generator</CardTitle>
              <CardDescription>
                Describe your exam, course, or goal and let AI create a structured plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ai-prompt">What do you want to study?</Label>
                <Textarea
                  id="ai-prompt"
                  placeholder="e.g., GATE CS 2026, Learn React in 2 months, IELTS preparation..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
              <Button onClick={handleAIGenerate} disabled={loading || !aiPrompt}>
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? 'Generating...' : 'Generate Smart Plan'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !planData.title || !planData.startDate || topics.length === 0}
              size="lg"
            >
              {loading ? 'Creating...' : 'Create Plan'}
            </Button>
            <Button variant="outline" onClick={() => router.back()} size="lg">
              Cancel
            </Button>
          </div>
          <p className="text-sm text-text-secondary mt-3">
            * Required fields | Topics: {topics.length} | Total Hours: <span className="font-bold text-text-primary">{calculateTotalHours().toFixed(1)}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
