import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 text-accent-purple animate-spin" />
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    </div>
  )
}
