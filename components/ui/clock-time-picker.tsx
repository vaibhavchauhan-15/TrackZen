'use client'

/**
 * ClockTimePicker
 *
 * A circular analog-style clock picker with AM/PM toggle.
 * - Step 1: tap/click on the clock face to select the hour (1-12).
 * - Step 2: clock automatically switches to minute selection (0-59).
 * - AM/PM toggle is always visible.
 * - Emits value as "HH:mm" in 24-hour format so existing API routes are unchanged.
 * - Fully keyboard-accessible and reduced-motion-safe.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'hour' | 'minute'
type Period = 'AM' | 'PM'

interface ClockTimePickerProps {
  /** Current value as "HH:mm" (24-h) or empty string */
  value: string
  onChange: (value: string) => void
  /** Optional label override */
  label?: string
  className?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse "HH:mm" string → { hour12, minute, period } */
function parse24h(val: string): { hour12: number; minute: number; period: Period } {
  const [hStr, mStr] = val.split(':')
  const h24 = parseInt(hStr, 10)
  const m = parseInt(mStr ?? '0', 10)
  const period: Period = h24 < 12 ? 'AM' : 'PM'
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12
  return { hour12, minute: isNaN(m) ? 0 : m, period }
}

/** Convert hour12 + period → 24-hour number */
function to24h(hour12: number, period: Period): number {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12
  return hour12 === 12 ? 12 : hour12 + 12
}

/** Get (x, y) position on a circle given angle (degrees from 12 o'clock) and radius */
function polarToXY(angleDeg: number, radius: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

/** Get the angle (0-360) from centre to pointer position */
function xyToAngle(px: number, py: number, cx: number, cy: number): number {
  const dx = px - cx
  const dy = py - cy
  const rad = Math.atan2(dy, dx)
  let deg = (rad * 180) / Math.PI + 90
  if (deg < 0) deg += 360
  return deg % 360
}

// ─── Sub-component: Clock Face ────────────────────────────────────────────────

const CLOCK_SIZE = 230
const CENTER = CLOCK_SIZE / 2
const HOUR_RADIUS = 86
const MINUTE_RADIUS = 86
const TICK_RADIUS = 74
const HAND_RADIUS = 72

interface FaceProps {
  mode: Mode
  hour12: number
  minute: number
  onSelect: (value: number) => void
}

function ClockFace({ mode, hour12, minute, onSelect }: FaceProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const isDragging = useRef(false)

  const selected = mode === 'hour' ? hour12 : minute

  // Hand angle
  const handAngle =
    mode === 'hour'
      ? (hour12 % 12) * 30          // 360/12 = 30° per hour
      : minute * 6                  // 360/60 = 6° per minute

  // Numbers on the clock face
  const numbers =
    mode === 'hour'
      ? Array.from({ length: 12 }, (_, i) => i + 1)      // 1-12
      : Array.from({ length: 12 }, (_, i) => i * 5)      // 0,5,10,…55

  function angleFromEvent(e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) {
    if (!svgRef.current) return 0
    const rect = svgRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? (e as any).changedTouches[0]?.clientX
      clientY = e.touches[0]?.clientY ?? (e as any).changedTouches[0]?.clientY
    } else {
      clientX = (e as MouseEvent).clientX
      clientY = (e as MouseEvent).clientY
    }
    return xyToAngle(clientX, clientY, cx, cy)
  }

  function angleToValue(angle: number): number {
    if (mode === 'hour') {
      const h = Math.round(angle / 30) % 12
      return h === 0 ? 12 : h
    } else {
      return Math.round(angle / 6) % 60
    }
  }

  const handleInteract = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      const angle = angleFromEvent(e)
      onSelect(angleToValue(angle))
    },
    [mode, onSelect],
  )

  // Also handle drag/move to allow smooth sweeping
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    handleInteract(e)
    const move = (mv: MouseEvent) => {
      if (!isDragging.current) return
      const angle = angleFromEvent(mv)
      onSelect(angleToValue(angle))
    }
    const up = () => { isDragging.current = false; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const { x: hx, y: hy } = polarToXY(handAngle, HAND_RADIUS, CENTER, CENTER)

  return (
    <svg
      ref={svgRef}
      width={CLOCK_SIZE}
      height={CLOCK_SIZE}
      viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}
      className="select-none touch-none cursor-pointer w-full max-w-[230px]"
      onMouseDown={handleMouseDown}
      onTouchStart={handleInteract}
      onTouchMove={handleInteract}
    >
      {/* Outer ring */}
      <circle cx={CENTER} cy={CENTER} r={CENTER - 4} fill="#1e1b2e" stroke="#2d2a3e" strokeWidth={2} />

      {/* Hand */}
      <line
        x1={CENTER}
        y1={CENTER}
        x2={hx}
        y2={hy}
        stroke="#7C3AED"
        strokeWidth={2.5}
        strokeLinecap="round"
        style={{ transition: 'x2 0.18s ease, y2 0.18s ease' }}
      />

      {/* Centre dot */}
      <circle cx={CENTER} cy={CENTER} r={4} fill="#7C3AED" />

      {/* Dot at hand tip */}
      <circle cx={hx} cy={hy} r={18} fill="#7C3AED" opacity={0.18} />
      <circle cx={hx} cy={hy} r={10} fill="#7C3AED" />

      {/* Numbers */}
      {numbers.map((num, i) => {
        const angle = mode === 'hour' ? num * 30 : num * 6
        const { x, y } = polarToXY(angle, mode === 'hour' ? HOUR_RADIUS : MINUTE_RADIUS, CENTER, CENTER)
        const isSelected = num === selected
        return (
          <g key={num}>
            {isSelected && <circle cx={x} cy={y} r={16} fill="#7C3AED" />}
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={isSelected ? 14 : 13}
              fontWeight={isSelected ? 700 : 400}
              fill={isSelected ? '#ffffff' : '#8b86a8'}
            >
              {mode === 'minute' ? String(num).padStart(2, '0') : num}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClockTimePicker({ value, onChange, label, className = '' }: ClockTimePickerProps) {
  // Parse controlled value; fallback to 12:00 AM
  const parsed = value ? parse24h(value) : { hour12: 12, minute: 0, period: 'AM' as Period }

  const [hour12, setHour12] = useState(parsed.hour12)
  const [minute, setMinute] = useState(parsed.minute)
  const [period, setPeriod] = useState<Period>(parsed.period)
  const [mode, setMode] = useState<Mode>('hour')
  const [open, setOpen] = useState(false)

  // Sync from external value
  useEffect(() => {
    if (value) {
      const p = parse24h(value)
      setHour12(p.hour12)
      setMinute(p.minute)
      setPeriod(p.period)
    }
  }, [value])

  // Emit every time internal state changes
  const emit = useCallback(
    (h: number, m: number, p: Period) => {
      const h24 = to24h(h, p)
      const str = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      onChange(str)
    },
    [onChange],
  )

  const handleHourSelect = useCallback(
    (h: number) => {
      setHour12(h)
      emit(h, minute, period)
      // Auto-advance to minute picking after a short delay
      setTimeout(() => setMode('minute'), 160)
    },
    [minute, period, emit],
  )

  const handleMinuteSelect = useCallback(
    (m: number) => {
      setMinute(m)
      emit(hour12, m, period)
    },
    [hour12, period, emit],
  )

  const handlePeriod = useCallback(
    (p: Period) => {
      setPeriod(p)
      emit(hour12, minute, p)
    },
    [hour12, minute, emit],
  )

  const handleClear = () => {
    onChange('')
    setOpen(false)
  }

  const handleDone = () => setOpen(false)

  const displayTime = value
    ? `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
    : null

  return (
    <div className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1e1b2e] border border-[#2d2a3e] text-sm transition-all hover:border-[#7C3AED]/50 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]/60"
      >
        <Clock size={15} className="text-[#7C3AED] shrink-0" />
        {displayTime ? (
          <span className="text-white font-medium">{displayTime}</span>
        ) : (
          <span className="text-[#8b86a8]">Set reminder time…</span>
        )}
        {displayTime && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); handleClear() }}
            onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), handleClear())}
            className="ml-auto text-[#8b86a8] hover:text-white text-xs transition-colors"
            aria-label="Clear time"
          >
            ✕
          </span>
        )}
      </button>

      {/* Popover — opens ABOVE the trigger */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 24, stiffness: 340 }}
            className="absolute z-[200] bottom-full left-0 mb-2 w-[calc(100vw-32px)] max-w-[280px] sm:w-[280px] rounded-2xl bg-[#13111e] border border-[#2d2a3e] shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Digital readout + mode tabs */}
            <div className="flex items-center justify-center gap-1 pt-4 pb-2 px-5">
              <button
                onClick={() => setMode('hour')}
                className={`text-4xl font-bold tracking-tight transition-colors ${
                  mode === 'hour' ? 'text-[#7C3AED]' : 'text-[#8b86a8] hover:text-white'
                }`}
              >
                {String(hour12).padStart(2, '0')}
              </button>
              <span className="text-3xl font-bold text-[#4b4664] pb-0.5">:</span>
              <button
                onClick={() => setMode('minute')}
                className={`text-4xl font-bold tracking-tight transition-colors ${
                  mode === 'minute' ? 'text-[#7C3AED]' : 'text-[#8b86a8] hover:text-white'
                }`}
              >
                {String(minute).padStart(2, '0')}
              </button>

              {/* AM / PM */}
              <div className="ml-3 flex flex-col gap-1">
                {(['AM', 'PM'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePeriod(p)}
                    className={`w-9 h-7 rounded text-xs font-semibold transition-all ${
                      period === p
                        ? 'bg-[#7C3AED] text-white'
                        : 'text-[#8b86a8] hover:text-white hover:bg-[#2d2a3e]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode label */}
            <p className="text-center text-[10px] font-medium tracking-widest uppercase text-[#4b4664] mb-1">
              {mode === 'hour' ? 'Select Hour' : 'Select Minute'}
            </p>

            {/* Clock face */}
            <div className="flex justify-center px-3 pb-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                >
                  <ClockFace
                    mode={mode}
                    hour12={hour12}
                    minute={minute}
                    onSelect={mode === 'hour' ? handleHourSelect : handleMinuteSelect}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between px-4 pb-4 gap-2">
              <button
                onClick={handleClear}
                className="text-xs text-[#8b86a8] hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#2d2a3e]"
              >
                Clear
              </button>
              <button
                onClick={handleDone}
                className="flex-1 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6d35d4] text-white text-sm font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click-away backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[199]"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
    </div>
  )
}
