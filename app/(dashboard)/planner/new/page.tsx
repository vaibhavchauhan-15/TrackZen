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
import { Sparkles, Calendar, Plus, Trash2, ChevronRight, ArrowUpCircle, ArrowDownCircle, ChevronDown, Edit2, Check } from 'lucide-react'

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
  const [expandedTopicIndex, setExpandedTopicIndex] = useState<number | null>(null)
  const [expandedSubtopics, setExpandedSubtopics] = useState<{ [key: number]: boolean }>({})

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
        const generatedTopics = data.topics.map((t: any) => ({
          ...t,
          priority: t.priority || 3,
          weightage: t.weightage || 0,
          subtopics: t.subtopics || []
        }))
        setTopics(generatedTopics)
        // Expand the last topic by default
        if (generatedTopics.length > 0) {
          setExpandedTopicIndex(generatedTopics.length - 1)
          // Initialize with last topic's subtopics expanded
          const initialExpandedSubtopics: { [key: number]: boolean } = {}
          initialExpandedSubtopics[generatedTopics.length - 1] = true
          setExpandedSubtopics(initialExpandedSubtopics)
        }
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
    
    // Validate each topic has at least one subtopic
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i]
      if (!topic.subtopics || topic.subtopics.length === 0) {
        setError(`Topic "${topic.title || `Topic ${i + 1}`}" must have at least one subtopic`)
        return
      }
      
      // Validate all subtopics have hours > 0
      for (let j = 0; j < topic.subtopics.length; j++) {
        const subtopic = topic.subtopics[j]
        if (!subtopic.title.trim()) {
          setError(`Subtopic ${j + 1} in "${topic.title || `Topic ${i + 1}`}" needs a title`)
          return
        }
        if (!subtopic.estimatedHours || subtopic.estimatedHours <= 0) {
          setError(`Subtopic "${subtopic.title || `Subtopic ${j + 1}`}" must have hours greater than 0`)
          return
        }
      }
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
    const newTopics = [
      ...topics,
      {
        title: '',
        estimatedHours: 0,
        priority: 3,
        weightage: 0,
        subtopics: [
          {
            title: '',
            estimatedHours: 0,
            priority: 3,
          }
        ],
      },
    ]
    setTopics(newTopics)
    // Expand the newly added topic and collapse others
    setExpandedTopicIndex(newTopics.length - 1)
    // Expand subtopics for the new topic by default
    const newExpandedSubtopics = { ...expandedSubtopics }
    newExpandedSubtopics[newTopics.length - 1] = true
    setExpandedSubtopics(newExpandedSubtopics)
  }

  const addSubtopic = (topicIndex: number) => {
    const newTopics = [...topics]
    newTopics[topicIndex].subtopics.push({
      title: '',
      estimatedHours: 0,
      priority: 3,
    })
    // Recalculate topic hours
    const subtopicTotal = newTopics[topicIndex].subtopics.reduce((sum, st) => sum + (st.estimatedHours || 0), 0)
    newTopics[topicIndex].estimatedHours = subtopicTotal
    setTopics(newTopics)
    // Ensure subtopics are expanded when adding, preserve other states
    const newExpandedSubtopics = { ...expandedSubtopics }
    newExpandedSubtopics[topicIndex] = true
    setExpandedSubtopics(newExpandedSubtopics)
  }

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index))
  }

  const removeSubtopic = (topicIndex: number, subtopicIndex: number) => {
    const newTopics = [...topics]
    // Prevent removing the last subtopic
    if (newTopics[topicIndex].subtopics.length <= 1) {
      setError('Each topic must have at least one subtopic. Delete the topic if you don\'t need it.')
      setTimeout(() => setError(''), 5000) // Clear error after 5 seconds
      return
    }
    newTopics[topicIndex].subtopics = newTopics[topicIndex].subtopics.filter((_, i) => i !== subtopicIndex)
    // Recalculate topic hours
    const subtopicTotal = newTopics[topicIndex].subtopics.reduce((sum, st) => sum + (st.estimatedHours || 0), 0)
    newTopics[topicIndex].estimatedHours = subtopicTotal
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
    // Auto-calculate topic hours from subtopics
    const subtopicTotal = newTopics[topicIndex].subtopics.reduce((sum, st) => sum + (st.estimatedHours || 0), 0)
    newTopics[topicIndex].estimatedHours = subtopicTotal
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

  const toggleTopicExpand = (topicIndex: number) => {
    setExpandedTopicIndex(expandedTopicIndex === topicIndex ? null : topicIndex)
  }

  const toggleSubtopicsExpand = (topicIndex: number) => {
    setExpandedSubtopics({
      ...expandedSubtopics,
      [topicIndex]: !expandedSubtopics[topicIndex]
    })
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
                    <span className="block mt-2 text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-3 py-2 rounded-md border border-purple-200 dark:border-purple-800">
                      ✨ Each topic requires at least one subtopic with hours. Topic hours are auto-calculated!
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
                    const hasInvalidSubtopics = topic.subtopics.some(st => !st.estimatedHours || st.estimatedHours <= 0)
                    const isExpanded = expandedTopicIndex === topicIndex
                    const areSubtopicsExpanded = expandedSubtopics[topicIndex] !== false // Default to true if not set
                    
                    return (
                    <Card 
                      key={topicIndex} 
                      className={`border-2 transition-all duration-300 ${
                        isExpanded 
                          ? 'shadow-xl border-purple-400 dark:border-purple-600 ring-2 ring-purple-200 dark:ring-purple-900' 
                          : 'hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700'
                      }`}
                    >
                      {/* Collapsed Header */}
                      {!isExpanded && (
                        <div 
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors group"
                          onClick={() => toggleTopicExpand(topicIndex)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <ChevronRight className="h-5 w-5 text-purple-500 transition-transform group-hover:translate-x-1" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-base text-text-primary">
                                {topic.title || `Topic ${topicIndex + 1}`}
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                                  {topic.estimatedHours.toFixed(1)}h • {topic.subtopics.length} subtopic{topic.subtopics.length !== 1 ? 's' : ''}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  hasInvalidSubtopics 
                                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' 
                                    : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                }`}>
                                  {hasInvalidSubtopics ? '⚠ Incomplete' : '✓ Complete'}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="group-hover:bg-purple-100 dark:group-hover:bg-purple-900"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleTopicExpand(topicIndex)
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeTopic(topicIndex)
                            }}
                            className="hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Expanded Content */}
                      {isExpanded && (
                      <CardContent className="pt-6 space-y-4">
                        {/* Header with collapse button */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-200 dark:border-purple-800">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                              Topic #{topicIndex + 1}
                            </span>
                            <span className="text-xs text-muted-foreground">Editing</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTopicExpand(topicIndex)}
                            className="hover:bg-purple-100 dark:hover:bg-purple-900"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Done
                          </Button>
                        </div>

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
                                <div className="px-4 py-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 border-2 border-purple-300 dark:border-purple-700 shadow-md hover:shadow-lg transition-all duration-300">
                                  <div className="text-center">
                                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-0.5">Total Hours</div>
                                    <span className="text-xl font-bold text-purple-700 dark:text-purple-300 tabular-nums">
                                      {(topic.estimatedHours || 0).toFixed(1)}h
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label className="flex items-center gap-2">
                                Estimated Hours *
                                <span className="text-xs text-green-500 font-normal">✨ Auto-calculated from subtopics</span>
                              </Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={topic.estimatedHours}
                                  disabled
                                  placeholder="Add subtopic hours"
                                  className="mt-1 text-base font-semibold bg-muted cursor-not-allowed opacity-70"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                  <span className="text-xs text-muted-foreground">Auto</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                💡 Total calculated from {topic.subtopics.length} subtopic{topic.subtopics.length !== 1 ? 's' : ''}
                              </p>
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
                        <div className="ml-6 space-y-3 border-l-2 border-purple-300 dark:border-purple-700 pl-4 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => toggleSubtopicsExpand(topicIndex)}
                              className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 transition-colors group"
                            >
                              <ChevronDown 
                                className={`h-4 w-4 transition-transform duration-300 ${
                                  areSubtopicsExpanded ? 'rotate-0' : '-rotate-90'
                                }`}
                              />
                              📝 Subtopics * (Required)
                              {hasSubtopics && (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                  {topic.subtopics.length} item{topic.subtopics.length !== 1 ? 's' : ''} • {subtopicTotal.toFixed(1)}h
                                </span>
                              )}
                            </button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addSubtopic(topicIndex)}
                              className="hover:bg-purple-50 dark:hover:bg-purple-950 transition-all duration-200 hover:scale-105"
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add Subtopic
                            </Button>
                          </div>
                          
                          {/* Subtopics List with Animation */}
                          <div 
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              areSubtopicsExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <div className="space-y-3 pt-2">
                          {topic.subtopics.map((subtopic, subtopicIndex) => (
                            <div 
                              key={subtopicIndex} 
                              className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200/50 dark:border-purple-800/50 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                            >
                              <div className="flex-1 grid gap-2 md:grid-cols-3">
                                <Input
                                  value={subtopic.title}
                                  onChange={(e) => updateSubtopic(topicIndex, subtopicIndex, 'title', e.target.value)}
                                  placeholder="Subtopic title *"
                                  className="border-purple-300 dark:border-purple-700 focus:ring-purple-500 transition-all duration-200"
                                  required
                                />
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    value={subtopic.estimatedHours || ''}
                                    onChange={(e) => updateSubtopic(topicIndex, subtopicIndex, 'estimatedHours', parseFloat(e.target.value) || 0)}
                                    placeholder="Hours *"
                                    className="text-base font-semibold border-purple-300 dark:border-purple-700 focus:ring-purple-500 transition-all duration-200"
                                    required
                                  />
                                  {(!subtopic.estimatedHours || subtopic.estimatedHours === 0) && (
                                    <div className="absolute -bottom-5 left-0 text-xs text-red-500">
                                      Required
                                    </div>
                                  )}
                                </div>
                                <Select
                                  value={subtopic.priority.toString()}
                                  onValueChange={(value) => updateSubtopic(topicIndex, subtopicIndex, 'priority', parseInt(value))}
                                >
                                  <SelectTrigger className="border-purple-300 dark:border-purple-700 transition-all duration-200">
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
                                disabled={topic.subtopics.length === 1}
                                className="hover:bg-red-50 dark:hover:bg-red-950 transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
                                title={topic.subtopics.length === 1 ? 'Cannot remove last subtopic' : 'Remove subtopic'}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          ))}
                            </div>
                          </div>
                          
                          {topic.subtopics.length === 1 && areSubtopicsExpanded && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 italic flex items-center gap-1 pt-2">
                              ⚠️ At least one subtopic is required per topic
                            </p>
                          )}
                        </div>
                      </CardContent>
                      )}
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
