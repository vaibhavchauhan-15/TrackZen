'use client'

import { useState, useRef, useCallback } from 'react'
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
import { Sparkles, Calendar, Plus, Trash2, ChevronRight, ArrowUpCircle, ArrowDownCircle, ChevronDown, Edit2, Check, CalendarDays, AlertCircle } from 'lucide-react'
import { AnimatedAddButton } from '@/components/ui/animated-add-button'
import { AnimatedButton } from '@/components/ui/animated-button'
import { DatePicker } from '@/components/ui/date-picker'
import { revalidatePlans, revalidateDashboard } from '@/lib/hooks/use-swr-api'

// Field validation error types
interface FieldErrors {
  title?: string
  startDate?: string
  endDate?: string
  dailyHours?: string
}

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
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [aiPrompt, setAiPrompt] = useState('')
  const [planDetailsExpanded, setPlanDetailsExpanded] = useState(true)
  const [planData, setPlanData] = useState({
    title: '',
    type: 'exam',
    dailyHours: '',
    color: '#7C3AED',
  })
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [topics, setTopics] = useState<Topic[]>([])
  const [expandedTopicIndex, setExpandedTopicIndex] = useState<number | null>(null)
  const [expandedSubtopics, setExpandedSubtopics] = useState<{ [key: number]: boolean }>({})
  const [generationProgress, setGenerationProgress] = useState('')
  const [generationPercent, setGenerationPercent] = useState(0)
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const [currentTab, setCurrentTab] = useState('manual')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [streamingTopicIndex, setStreamingTopicIndex] = useState<number | null>(null)
  const [streamStats, setStreamStats] = useState({ topics: 0, subtopics: 0, hours: 0 })
  const abortControllerRef = useRef<AbortController | null>(null)

  // Field validation function
  const validateField = (field: keyof FieldErrors, value: any): string | undefined => {
    switch (field) {
      case 'title':
        if (!value || !value.trim()) return 'Plan title is required'
        if (value.trim().length < 3) return 'Title must be at least 3 characters'
        if (value.trim().length > 100) return 'Title must be less than 100 characters'
        return undefined
      case 'startDate':
        if (!value) return 'Start date is required'
        return undefined
      case 'endDate':
        if (value && startDate && value < startDate) return 'End date must be after start date'
        return undefined
      case 'dailyHours':
        if (value && (parseFloat(value) < 0.5 || parseFloat(value) > 24)) {
          return 'Daily hours must be between 0.5 and 24'
        }
        return undefined
      default:
        return undefined
    }
  }

  // Handle field blur for validation
  const handleFieldBlur = (field: keyof FieldErrors, value: any) => {
    const error = validateField(field, value)
    setFieldErrors(prev => ({ ...prev, [field]: error }))
  }

  // Validate all fields before submit
  const validateAllFields = (): boolean => {
    const errors: FieldErrors = {
      title: validateField('title', planData.title),
      startDate: validateField('startDate', startDate),
      endDate: validateField('endDate', endDate),
      dailyHours: validateField('dailyHours', planData.dailyHours),
    }
    setFieldErrors(errors)
    return !Object.values(errors).some(Boolean)
  }

  const handleAIGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) {
      setError('Please describe what you want to study')
      return
    }

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setError('')
    setTopics([])
    setGenerationProgress('🤖 Connecting to AI...')
    setGenerationPercent(0)
    setIsGenerating(true)
    setStreamingTopicIndex(null)
    setStreamStats({ topics: 0, subtopics: 0, hours: 0 })
    
    try {
      const response = await fetch('/api/ai/generate-plan-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate plan')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''
      let topicCount = 0
      let subtopicCount = 0
      let totalHours = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          
          try {
            const data = JSON.parse(line.slice(6))
            
            switch (data.type) {
              case 'status':
                setGenerationProgress(`🧠 ${data.message}`)
                setGenerationPercent(data.progress || 0)
                break
                
              case 'topic':
                setStreamingTopicIndex(data.index)
                setTopics(prev => [...prev, data.topic])
                topicCount = data.index + 1
                subtopicCount += data.topic.subtopics.length
                totalHours += data.topic.estimatedHours
                setStreamStats({ topics: topicCount, subtopics: subtopicCount, hours: Math.round(totalHours * 10) / 10 })
                setGenerationProgress(`📚 Adding topic ${data.index + 1}/${data.total}: ${data.topic.title}`)
                setGenerationPercent(data.progress || 0)
                break
                
              case 'complete':
                setStreamingTopicIndex(null)
                setIsAiGenerated(true)
                setCurrentTab('manual')
                setGenerationProgress(`✨ Generated ${data.totalTopics} topics with ${data.totalSubtopics} subtopics (${data.totalHours} hours total)`)
                setGenerationPercent(100)
                setStreamStats({ topics: data.totalTopics, subtopics: data.totalSubtopics, hours: data.totalHours })
                break
                
              case 'error':
                throw new Error(data.message)
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
              console.error('Parse error:', e)
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return
      console.error('AI generation failed:', error)
      setError(error.message || 'Failed to generate plan. Please try again.')
      setGenerationProgress('')
      setGenerationPercent(0)
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }, [aiPrompt])

  const handleSubmit = async () => {
    // Validate all fields first
    const errors: FieldErrors = {
      title: validateField('title', planData.title),
      startDate: validateField('startDate', startDate),
      endDate: validateField('endDate', endDate),
      dailyHours: validateField('dailyHours', planData.dailyHours),
    }
    setFieldErrors(errors)
    
    const hasFieldErrors = Object.values(errors).some(Boolean)
    if (hasFieldErrors) {
      setError('Please fix the errors in the form')
      setPlanDetailsExpanded(true)
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

    setError('')
    setIsCreating(true)
    try {
      // Format dates for API
      const formattedStartDate = startDate ? startDate.toISOString().split('T')[0] : ''
      const formattedEndDate = endDate ? endDate.toISOString().split('T')[0] : ''
      
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...planData,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          topics, 
          isAiGenerated,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create plan')
      }

      const data = await res.json()
      // Revalidate caches after creating plan
      revalidatePlans()
      revalidateDashboard()
      router.push(`/planner/${data.plan.id}`)
    } catch (error: any) {
      console.error('Failed to create plan:', error)
      setError(error.message || 'Failed to create plan. Please try again.')
    } finally {
      setIsCreating(false)
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
    <div className="mx-auto max-w-5xl space-y-6 animate-in">
      {/* Header with animated gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-900/20 via-bg-surface to-blue-900/20 p-6 border border-purple-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        <div className="relative">
          <h1 className="text-3xl font-bold text-text-primary bg-gradient-to-r from-purple-400 via-accent-purple to-blue-400 bg-clip-text text-transparent">
            Create New Plan
          </h1>
          <p className="mt-2 text-text-secondary">
            Use AI to generate a plan or create one manually
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-red-500/50 bg-red-950/30 animate-shake">
          <CardContent className="pt-6">
            <p className="text-red-400 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Plan Basic Info - Collapsible */}
      <Card className="glow-interactive overflow-hidden transition-all duration-300 hover:border-purple-500/40">
        <CardHeader 
          className="relative cursor-pointer select-none"
          onClick={() => setPlanDetailsExpanded(!planDetailsExpanded)}
        >
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl transition-all duration-500" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/10 transition-colors duration-300">
                <CalendarDays className="h-5 w-5 text-purple-400 transition-transform duration-300" />
              </span>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Plan Details
                  {!planDetailsExpanded && planData.title && (
                    <span className="text-sm font-normal text-purple-400">
                      — {planData.title}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Set up your plan's basic information</CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-purple-500/20 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation()
                setPlanDetailsExpanded(!planDetailsExpanded)
              }}
            >
              <ChevronDown className={`h-5 w-5 text-purple-400 transition-transform duration-300 ${planDetailsExpanded ? 'rotate-0' : '-rotate-90'}`} />
            </Button>
          </div>
        </CardHeader>
        
        {/* Collapsible Content */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${planDetailsExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <CardContent className="space-y-5 pb-6">
            {/* Title Field */}
            <div className="group/input">
              <Label htmlFor="title" className="flex items-center gap-1 text-sm font-medium">
                Plan Title <span className="text-red-400">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., GATE 2026 Preparation"
                value={planData.title}
                onChange={(e) => {
                  setPlanData({ ...planData, title: e.target.value })
                  if (fieldErrors.title) {
                    setFieldErrors(prev => ({ ...prev, title: validateField('title', e.target.value) }))
                  }
                }}
                onBlur={(e) => handleFieldBlur('title', e.target.value)}
                className={`mt-2 transition-all duration-200 focus:ring-2 focus:ring-purple-500/50 hover:border-purple-400/50 ${fieldErrors.title ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
              />
              {fieldErrors.title && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-fadeIn">
                  <AlertCircle className="h-3 w-3" />
                  {fieldErrors.title}
                </p>
              )}
            </div>

            {/* Plan Type */}
            <div>
              <Label htmlFor="type" className="text-sm font-medium">Plan Type</Label>
              <Select
                value={planData.type}
                onValueChange={(value) => setPlanData({ ...planData, type: value })}
              >
                <SelectTrigger className="mt-2 transition-all duration-200 hover:border-purple-400/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exam">📝 Exam</SelectItem>
                  <SelectItem value="work">💼 Work</SelectItem>
                  <SelectItem value="course">📚 Course</SelectItem>
                  <SelectItem value="custom">⚙️ Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium flex items-center gap-1">
                  Start Date <span className="text-red-400">*</span>
                </Label>
                <div className="mt-2">
                  <DatePicker
                    value={startDate}
                    onChange={(date) => {
                      setStartDate(date)
                      if (fieldErrors.startDate) {
                        setFieldErrors(prev => ({ ...prev, startDate: validateField('startDate', date) }))
                      }
                      // Revalidate end date if it exists
                      if (endDate && date && endDate < date) {
                        setFieldErrors(prev => ({ ...prev, endDate: 'End date must be after start date' }))
                      } else if (endDate) {
                        setFieldErrors(prev => ({ ...prev, endDate: undefined }))
                      }
                    }}
                    placeholder="Select start date"
                    error={!!fieldErrors.startDate}
                  />
                </div>
                {fieldErrors.startDate && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-fadeIn">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.startDate}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">End Date (Optional)</Label>
                <div className="mt-2">
                  <DatePicker
                    value={endDate}
                    onChange={(date) => {
                      setEndDate(date)
                      if (date && startDate && date < startDate) {
                        setFieldErrors(prev => ({ ...prev, endDate: 'End date must be after start date' }))
                      } else {
                        setFieldErrors(prev => ({ ...prev, endDate: undefined }))
                      }
                    }}
                    placeholder="Select end date"
                    error={!!fieldErrors.endDate}
                  />
                </div>
                {fieldErrors.endDate && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-fadeIn">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.endDate}
                  </p>
                )}
              </div>
            </div>

            {/* Daily Hours */}
            <div>
              <Label htmlFor="dailyHours" className="text-sm font-medium">Daily Study Hours (Optional)</Label>
              <Input
                id="dailyHours"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                placeholder="e.g., 4"
                value={planData.dailyHours}
                onChange={(e) => {
                  setPlanData({ ...planData, dailyHours: e.target.value })
                  if (fieldErrors.dailyHours) {
                    setFieldErrors(prev => ({ ...prev, dailyHours: validateField('dailyHours', e.target.value) }))
                  }
                }}
                onBlur={(e) => handleFieldBlur('dailyHours', e.target.value)}
                className={`mt-2 text-base font-medium transition-all duration-200 hover:border-purple-400/50 focus:ring-2 focus:ring-purple-500/50 ${fieldErrors.dailyHours ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
              />
              {fieldErrors.dailyHours && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-fadeIn">
                  <AlertCircle className="h-3 w-3" />
                  {fieldErrors.dailyHours}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                How many hours per day do you plan to study?
              </p>
            </div>

            {/* Summary badges when filled */}
            {(planData.title || startDate) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50 animate-fadeIn">
                {planData.title && (
                  <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-300 text-xs flex items-center gap-1">
                    📋 {planData.title.slice(0, 30)}{planData.title.length > 30 ? '...' : ''}
                  </span>
                )}
                {startDate && (
                  <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-300 text-xs flex items-center gap-1">
                    📅 {startDate.toLocaleDateString()}
                    {endDate && ` → ${endDate.toLocaleDateString()}`}
                  </span>
                )}
                {planData.dailyHours && (
                  <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-300 text-xs flex items-center gap-1">
                    ⏰ {planData.dailyHours}h/day
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {/* Topics Section */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-bg-surface p-1 rounded-xl">
          <TabsTrigger 
            value="manual" 
            disabled={isGenerating}
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-lg transition-all duration-300 group"
          >
            <Calendar className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
            {isAiGenerated ? 'Review & Edit Plan' : 'Add Topics Manually'}
          </TabsTrigger>
          <TabsTrigger 
            value="ai" 
            disabled={isGenerating || isAiGenerated}
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-lg transition-all duration-300 group"
          >
            <Sparkles className="mr-2 h-4 w-4 group-hover:animate-pulse transition-all duration-300" />
            Generate with AI
          </TabsTrigger>
        </TabsList>

        {/* Generation Progress Indicator */}
        {isGenerating && (
          <Card className="mt-4 border-purple-500/50 bg-gradient-to-r from-purple-950/50 to-blue-950/50 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent animate-pulse" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500/30 border-t-purple-500"></div>
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-purple-400 animate-sparkle" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-purple-100 truncate">{generationProgress}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (abortControllerRef.current) {
                          abortControllerRef.current.abort()
                        }
                        setIsGenerating(false)
                        setGenerationProgress('')
                        setGenerationPercent(0)
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-200"
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="mt-2 h-2 bg-purple-950/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${generationPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-purple-300/80">
                      Building your personalized study plan...
                    </p>
                    <span className="text-xs font-mono text-purple-400">{generationPercent}%</span>
                  </div>
                </div>
              </div>
              {/* Live stats during streaming */}
              {streamStats.topics > 0 && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-purple-500/20">
                  <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs animate-countUp">
                    📚 {streamStats.topics} topics
                  </span>
                  <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs animate-countUp">
                    📝 {streamStats.subtopics} subtopics
                  </span>
                  <span className="px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs animate-countUp">
                    ⏱️ {streamStats.hours}h total
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI Generated Banner */}
        {isAiGenerated && !isGenerating && topics.length > 0 && (
          <Card className="mt-4 border-green-500/50 bg-gradient-to-r from-green-950/40 to-emerald-950/40 animate-fadeIn overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/20 animate-bounce-subtle">
                  <Sparkles className="h-6 w-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-100">AI Plan Generated Successfully! ✨</p>
                  <p className="text-sm text-green-300/80 mt-1">
                    {generationProgress} You can edit any topic, subtopic, or priority below.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <TabsContent value="manual" className="space-y-4">
          <Card className="glow-interactive overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-purple-500/10">
                      <Plus className="h-5 w-5 text-purple-400" />
                    </span>
                    Topics & Subtopics
                  </CardTitle>
                  <CardDescription>
                    Add topics to your study plan with priorities. 
                    <span className="block mt-2 text-sm font-semibold text-purple-400 bg-purple-950/50 px-3 py-2 rounded-md border border-purple-800/50">
                      ✨ Each topic requires at least one subtopic with hours. Topic hours are auto-calculated!
                    </span>
                  </CardDescription>
                </div>
                <AnimatedAddButton 
                  text="Add Topic" 
                  onClick={addTopic} 
                  size="sm"
                />
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
                    const isNewlyStreamed = streamingTopicIndex !== null && topicIndex >= streamingTopicIndex
                    const isCurrentStreaming = streamingTopicIndex === topicIndex
                    
                    return (
                    <Card 
                      key={topicIndex} 
                      className={`border-2 transition-all duration-300 ${
                        isCurrentStreaming
                          ? 'shadow-xl border-purple-500/70 ring-2 ring-purple-500/30 animate-glowPulse'
                          : isExpanded 
                            ? 'shadow-xl border-purple-500/50 ring-2 ring-purple-500/20' 
                            : 'hover:shadow-lg hover:border-purple-500/30 hover:scale-[1.01]'
                      } ${isNewlyStreamed && !isExpanded ? 'animate-slideInTopic' : ''}`}
                      style={{ 
                        opacity: isNewlyStreamed && !isExpanded ? 0 : 1,
                        animationFillMode: 'forwards'
                      }}
                    >
                      {/* Collapsed Header */}
                      {!isExpanded && (
                        <div 
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-purple-950/20 transition-all duration-300 group"
                          onClick={() => toggleTopicExpand(topicIndex)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <ChevronRight className="h-5 w-5 text-purple-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-purple-300" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-base text-text-primary group-hover:text-purple-300 transition-colors duration-200">
                                {topic.title || `Topic ${topicIndex + 1}`}
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-purple-400 font-medium">
                                  {(topic.estimatedHours || 0).toFixed(1)}h • {topic.subtopics.length} subtopic{topic.subtopics.length !== 1 ? 's' : ''}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full transition-all duration-200 ${
                                  hasInvalidSubtopics 
                                    ? 'bg-red-900/50 text-red-300 border border-red-700/50' 
                                    : 'bg-green-900/50 text-green-300 border border-green-700/50'
                                }`}>
                                  {hasInvalidSubtopics ? '⚠ Incomplete' : '✓ Complete'}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="group-hover:bg-purple-500/20 transition-all duration-200 hover:scale-105"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleTopicExpand(topicIndex)
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform duration-300" />
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
                            className="hover:bg-red-950/50 hover:scale-110 transition-all duration-200 group/delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-400 group-hover/delete:animate-wiggle" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Expanded Content */}
                      {isExpanded && (
                      <CardContent className="pt-6 space-y-4 animate-fadeIn">
                        {/* Header with collapse button */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-500/30">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-purple-300 bg-purple-500/20 px-2 py-1 rounded animate-pulse-subtle">
                              Topic #{topicIndex + 1}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Edit2 className="h-3 w-3 animate-wiggle" />
                              Editing
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTopicExpand(topicIndex)}
                            className="hover:bg-green-500/20 text-green-400 hover:text-green-300 transition-all duration-200 hover:scale-105"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Done
                          </Button>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex-1 grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2 flex items-center gap-3">
                              <div className="flex-1 group/input">
                                <Label>Topic Title <span className="text-red-400">*</span></Label>
                                <Input
                                  value={topic.title}
                                  onChange={(e) => updateTopic(topicIndex, 'title', e.target.value)}
                                  placeholder="e.g., Data Structures"
                                  className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-purple-500/50 hover:border-purple-400/50"
                                />
                              </div>
                              <div className="pt-6">
                                <div className="px-4 py-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-2 border-purple-500/30 shadow-lg hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105 group/hours">
                                  <div className="text-center">
                                    <div className="text-xs text-purple-400 font-medium mb-0.5">Total Hours</div>
                                    <span className="text-xl font-bold text-purple-300 tabular-nums group-hover/hours:text-purple-200 transition-colors duration-200">
                                      {(topic.estimatedHours || 0).toFixed(1)}h
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label className="flex items-center gap-2">
                                Estimated Hours <span className="text-red-400">*</span>
                                <span className="text-xs text-green-400 font-normal">✨ Auto-calculated from subtopics</span>
                              </Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={topic.estimatedHours}
                                  disabled
                                  placeholder="Add subtopic hours"
                                  className="mt-1 text-base font-semibold bg-muted/50 cursor-not-allowed opacity-70"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                  <span className="text-xs text-muted-foreground bg-purple-500/20 px-2 py-0.5 rounded">Auto</span>
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
                                <SelectTrigger className="mt-1 transition-all duration-200 hover:border-purple-400/50">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">
                                    <div className="flex items-center gap-2">
                                      <ArrowUpCircle className="h-4 w-4 text-red-400" />
                                      <span>Highest</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="2">
                                    <div className="flex items-center gap-2">
                                      <ArrowUpCircle className="h-4 w-4 text-orange-400" />
                                      <span>High</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="3">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className="h-4 w-4 text-yellow-400" />
                                      <span>Medium</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="4">
                                    <div className="flex items-center gap-2">
                                      <ArrowDownCircle className="h-4 w-4 text-blue-400" />
                                      <span>Low</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="5">
                                    <div className="flex items-center gap-2">
                                      <ArrowDownCircle className="h-4 w-4 text-gray-400" />
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
                            className="mt-6 hover:bg-red-950/50 hover:scale-110 transition-all duration-200 group/delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-400 group-hover/delete:animate-wiggle" />
                          </Button>
                        </div>

                        {/* Subtopics */}
                        <div className="ml-6 space-y-3 border-l-2 border-purple-500/30 pl-4 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => toggleSubtopicsExpand(topicIndex)}
                              className="flex items-center gap-2 text-sm font-semibold text-purple-300 hover:text-purple-200 transition-colors group/subtopics"
                            >
                              <ChevronDown 
                                className={`h-4 w-4 transition-transform duration-300 ${
                                  areSubtopicsExpanded ? 'rotate-0' : '-rotate-90'
                                }`}
                              />
                              📝 Subtopics <span className="text-red-400">*</span> (Required)
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
                              className="border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all duration-200 hover:scale-105 group/add"
                            >
                              <Plus className="mr-1 h-3 w-3 group-hover/add:rotate-90 transition-transform duration-300" />
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
                              className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/20 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 hover:scale-[1.01] group/subtopic"
                            >
                              <div className="flex-1 grid gap-2 md:grid-cols-3">
                                <Input
                                  value={subtopic.title}
                                  onChange={(e) => updateSubtopic(topicIndex, subtopicIndex, 'title', e.target.value)}
                                  placeholder="Subtopic title *"
                                  className="border-purple-500/30 focus:ring-purple-500/50 transition-all duration-200 group-hover/subtopic:border-purple-400/50"
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
                                    className="text-base font-semibold border-purple-500/30 focus:ring-purple-500/50 transition-all duration-200 group-hover/subtopic:border-purple-400/50"
                                    required
                                  />
                                  {(!subtopic.estimatedHours || subtopic.estimatedHours === 0) && (
                                    <div className="absolute -bottom-5 left-0 text-xs text-red-400 animate-pulse">
                                      Required
                                    </div>
                                  )}
                                </div>
                                <Select
                                  value={subtopic.priority.toString()}
                                  onValueChange={(value) => updateSubtopic(topicIndex, subtopicIndex, 'priority', parseInt(value))}
                                >
                                  <SelectTrigger className="border-purple-500/30 transition-all duration-200 group-hover/subtopic:border-purple-400/50">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">🔴 Highest</SelectItem>
                                    <SelectItem value="2">🟠 High</SelectItem>
                                    <SelectItem value="3">🟡 Medium</SelectItem>
                                    <SelectItem value="4">🔵 Low</SelectItem>
                                    <SelectItem value="5">⚪ Lowest</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSubtopic(topicIndex, subtopicIndex)}
                                disabled={topic.subtopics.length === 1}
                                className="hover:bg-red-950/50 transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed group/del"
                                title={topic.subtopics.length === 1 ? 'Cannot remove last subtopic' : 'Remove subtopic'}
                              >
                                <Trash2 className="h-3 w-3 text-red-400 group-hover/del:animate-wiggle" />
                              </Button>
                            </div>
                          ))}
                            </div>
                          </div>
                          
                          {topic.subtopics.length === 1 && areSubtopicsExpanded && (
                            <p className="text-xs text-amber-400/80 italic flex items-center gap-1 pt-2 animate-fadeIn">
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
          <Card className="glow-interactive overflow-hidden group/ai min-h-[320px]">
            <div className="absolute -top-20 -right-20 w-40 h-15 bg-purple-500/10 rounded-full blur-3xl group-hover/ai:bg-purple-500/20 transition-all duration-500" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-500/10 group-hover/ai:bg-purple-500/20 transition-colors duration-300">
                  <Sparkles className="h-5 w-5 text-purple-400 group-hover/ai:animate-sparkle" />
                </span>
                AI Study Plan Generator
              </CardTitle>
              <CardDescription>
                Describe your exam, course, or goal and let AI create a structured plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div className="group/input">
                <Label htmlFor="ai-prompt">What do you want to study?</Label>
                <Textarea
                  id="ai-prompt"
                  placeholder="e.g., GATE CS 2026, Learn React in 2 months, IELTS preparation..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={5}
                  className="mt-2 min-h-[120px] transition-all duration-200 focus:ring-2 focus:ring-purple-500/50 hover:border-purple-400/50 resize-none"
                />
              </div>
              <AnimatedButton 
                onClick={handleAIGenerate} 
                disabled={isGenerating || !aiPrompt || isCreating}
                variant="primary"
              >
                <Sparkles className="h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate Smart Plan'}
              </AnimatedButton>
              {topics.length > 0 && !isAiGenerated && (
                <p className="text-xs text-muted-foreground mt-2 animate-fadeIn">
                  💡 Tip: AI generation will replace your current topics
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Buttons */}
      <Card className={`glow-interactive overflow-hidden transition-all duration-500 ${isAiGenerated && topics.length > 0 ? 'border-2 border-purple-500/50 shadow-lg shadow-purple-500/10' : ''}`}>
        <CardContent className="pt-6 relative">
          {isAiGenerated && topics.length > 0 && (
            <div className="mb-4 p-4 bg-purple-950/50 rounded-lg border border-purple-500/30 animate-fadeIn">
              <p className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse" />
                Your AI-generated plan is ready!
              </p>
              <p className="text-xs text-purple-400 mt-1">
                Review the topics and subtopics above. Make any changes you need, then click "Create Plan" to save it.
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-4 items-center">
            <AnimatedButton 
              onClick={handleSubmit} 
              disabled={isCreating || !planData.title || !startDate || topics.length === 0}
              variant="primary"
              size="lg"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Creating...
                </>
              ) : isAiGenerated ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  Create AI Plan
                </>
              ) : (
                'Create Plan'
              )}
            </AnimatedButton>
            {isAiGenerated && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAiGenerated(false)
                  setTopics([])
                  setCurrentTab('ai')
                  setGenerationProgress('')
                }} 
                size="lg"
                disabled={isCreating}
                className="border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all duration-200 hover:scale-105 group/restart"
              >
                <Sparkles className="mr-2 h-4 w-4 group-hover/restart:animate-spin" />
                Start Over
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => router.back()} 
              size="lg" 
              disabled={isCreating || isGenerating}
              className="hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all duration-200"
            >
              Cancel
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
            <p className="text-sm text-text-secondary">
              <span className="text-red-400">*</span> Required fields
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Topics: {topics.length}
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                Total Hours: <span className="font-bold">{calculateTotalHours().toFixed(1)}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
