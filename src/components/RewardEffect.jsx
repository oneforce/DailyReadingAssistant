import { useEffect, useState, useCallback } from 'react'
import useEventStore from '../stores/eventStore'

// Particle config
const SMALL_PARTICLE_COUNT = 12
const BIG_PARTICLE_COUNT = 30

function Particle({ x, y, color, size, delay, duration, distance }) {
  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width: size, height: size,
      borderRadius: '50%',
      background: color,
      animation: `particle-fly ${duration}s ${delay}s ease-out forwards`,
      opacity: 0,
      pointerEvents: 'none',
      '--fly-x': `${(Math.random() - 0.5) * distance}px`,
      '--fly-y': `${-Math.random() * distance - 60}px`,
    }} />
  )
}

function SmallEffect({ onDone, amount = 10 }) {
  const [particles] = useState(() =>
    Array.from({ length: SMALL_PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: `${40 + Math.random() * 20}%`,
      y: `${45 + Math.random() * 10}%`,
      color: ['#fbbf24', '#f59e0b', '#d97706', '#fcd34d'][i % 4],
      size: 8 + Math.random() * 8,
      delay: Math.random() * 0.3,
      duration: 0.8 + Math.random() * 0.5,
      distance: 180,
    }))
  )

  useEffect(() => {
    const timer = setTimeout(onDone, 1800)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      pointerEvents: 'none', overflow: 'hidden',
    }}>
      {/* Global dark overlay mask */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        animation: 'reward-glow-pulse 1.8s ease-out forwards',
      }} />

      {/* Coin particles */}
      {particles.map(p => <Particle key={p.id} {...p} />)}
      
      {/* Floating text */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'reward-float-up 1.5s ease-out forwards',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <span style={{
          fontSize: 60, fontWeight: 900,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          textShadow: 'none',
          filter: 'drop-shadow(0 4px 16px rgba(245,158,11,0.6))',
          animation: 'reward-emoji-spin 1s ease-out',
        }}>🪙</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{
            fontSize: 42, fontWeight: 900,
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 8px rgba(245,158,11,0.5))',
          }}>+{amount}</span>
          <span style={{
            fontSize: 16, fontWeight: 800, color: '#fcd34d', opacity: 0.9,
          }}>积分</span>
        </div>
      </div>
    </div>
  )
}

function BigEffect({ onDone, amount = 100 }) {
  const [particles] = useState(() =>
    Array.from({ length: BIG_PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: `${20 + Math.random() * 60}%`,
      y: `${30 + Math.random() * 40}%`,
      color: ['#f43f5e', '#8b5cf6', '#06b6d4', '#fbbf24', '#10b981', '#ec4899'][i % 6],
      size: 8 + Math.random() * 12,
      delay: Math.random() * 0.5,
      duration: 1.2 + Math.random() * 0.8,
      distance: 250,
    }))
  )

  useEffect(() => {
    const timer = setTimeout(onDone, 3500)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      pointerEvents: 'none', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.15) 0%, transparent 70%)',
        animation: 'reward-glow-pulse 1s ease-out forwards',
      }} />

      {/* Expanding ring */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: 0, height: 0,
        border: '3px solid rgba(251,191,36,0.6)',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'reward-ring-expand 1.5s ease-out forwards',
      }} />

      {/* Star particles */}
      {particles.map(p => <Particle key={p.id} {...p} />)}

      {/* Center celebration */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'reward-big-pop 2.5s ease-out forwards',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 52, animation: 'reward-emoji-spin 1s ease-out' }}>🎉</span>
        <span style={{
          fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #fbbf24, #f43f5e, #8b5cf6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 4px 16px rgba(244,63,94,0.5))',
        }}>+{amount}</span>
        <span style={{
          fontSize: 16, fontWeight: 800, color: '#f59e0b',
          background: 'rgba(251,191,36,0.15)', padding: '4px 16px', borderRadius: 20,
        }}>{amount >= 200 ? '🏅 完结一本大书！' : '🏆 特殊奖励积分!'}</span>
      </div>
    </div>
  )
}

export default function RewardEffect() {
  const pendingReward = useEventStore((s) => s.pendingReward)
  const clearReward = useEventStore((s) => s.clearReward)
  const [showEffect, setShowEffect] = useState(null)

  useEffect(() => {
    if (pendingReward) {
      setShowEffect(pendingReward)
    }
  }, [pendingReward])

  const handleDone = useCallback(() => {
    setShowEffect(null)
    clearReward()
  }, [clearReward])

  if (!showEffect) return null

  return showEffect.amount >= 100
    ? <BigEffect onDone={handleDone} amount={showEffect.amount} />
    : <SmallEffect onDone={handleDone} amount={showEffect.amount} />
}
