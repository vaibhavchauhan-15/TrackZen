import { Loader2 } from 'lucide-react'

export default function NewPlanLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 text-accent-purple animate-spin" />
        <p className="text-text-secondary">Loading plan creator...</p>
      </div>
    </div>
  )
}
