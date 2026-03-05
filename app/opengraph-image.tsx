import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'TrackZen – AI Study Planner & Habit Tracker'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0d0d0f 0%, #1a0a2e 50%, #0d0d0f 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
        }}
      >
        {/* Ambient purple glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 700,
            height: 500,
            background:
              'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Logo row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
            }}
          >
            🔥
          </div>
          <span
            style={{
              fontSize: 60,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-2px',
            }}
          >
            TrackZen
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 30,
            color: '#a78bfa',
            margin: 0,
            textAlign: 'center',
            maxWidth: 700,
            fontWeight: 600,
          }}
        >
          AI Study Planner &amp; Habit Tracker
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: 21,
            color: '#9ca3af',
            margin: '18px 0 0',
            textAlign: 'center',
            maxWidth: 820,
          }}
        >
          Build streaks. Track habits. Plan smarter with AI.
        </p>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 36,
          }}
        >
          {['📚 AI Study Plans', '🔥 Habit Streaks', '📊 Rich Analytics'].map(
            (pill) => (
              <div
                key={pill}
                style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  borderRadius: 999,
                  padding: '10px 22px',
                  color: '#c4b5fd',
                  fontSize: 18,
                }}
              >
                {pill}
              </div>
            )
          )}
        </div>

        {/* Domain badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 999,
            padding: '8px 28px',
          }}
        >
          <span style={{ color: '#6b7280', fontSize: 18 }}>
            trackzen-nine.vercel.app
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
