import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import useTaskStore from '../stores/taskStore'
import useRecordStore from '../stores/recordStore'
import useEventStore from '../stores/eventStore'
import { AudioRecorder, formatTime } from '../utils/recorder'
import BackButton from '../components/BackButton'
const ROUND_COLORS = ['#2b9dee', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899']

const getRoundLabel = (i) => {
  const cnNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  return `第${cnNums[i] || (i + 1)}遍`
}

function RoundCard({ round, label, color, audioUrl, duration, isActiveRecording, recordTime, onRecord, onPlay, isPlaying, isViewOnly }) {
  const hasAudio = !!audioUrl
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
      background: hasAudio ? `${color}08` : '#f8fafc',
      borderRadius: 14, border: `1.5px solid ${hasAudio ? `${color}30` : '#e2e8f0'}`,
      transition: 'all 0.2s',
    }}>
      {/* Round indicator */}
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: hasAudio ? color : '#e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hasAudio ? '#fff' : '#94a3b8', fontWeight: 800, fontSize: 13,
        flexShrink: 0,
      }}>
        {hasAudio ? (
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check</span>
        ) : round}
      </div>

      {/* Label + duration */}
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#334155' }}>{label}</p>
        {isActiveRecording ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse-ring 1s infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{formatTime(recordTime)}</span>
          </div>
        ) : hasAudio ? (
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
            已录制 {formatTime(duration)}
          </p>
        ) : (
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#cbd5e1' }}>未录制</p>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {hasAudio && !isActiveRecording && (
          <button onClick={onPlay} style={{
            width: 36, height: 36, borderRadius: 10, border: 'none',
            background: isPlaying ? '#10b981' : '#d1fae5',
            color: isPlaying ? '#fff' : '#059669',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
        )}
        {!isViewOnly && (
          <button onClick={onRecord} style={{
            width: 36, height: 36, borderRadius: 10, border: 'none',
            background: isActiveRecording ? '#ef4444' : (hasAudio ? '#f1f5f9' : color),
            color: isActiveRecording ? '#fff' : (hasAudio ? '#64748b' : '#fff'),
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {isActiveRecording ? 'stop' : (hasAudio ? 'refresh' : 'mic')}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

export default function TextbookReadPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const isViewOnly = query.get('viewOnly') === 'true'

  const task = useTaskStore((s) => s.getTaskById(taskId))
  const completeTask = useTaskStore((s) => s.completeTask)
  const addRecording = useRecordStore((s) => s.addRecording)
  const getRecording = useRecordStore((s) => s.getRecording)

  const roundCount = task?.content?.totalReadCount || 3

  // Per-round state
  const [recordings, setRecordings] = useState(() => {
    const recs = []
    for (let i = 0; i < roundCount; i++) {
      const rec = getRecording(taskId, `textbook-${i + 1}`)
      recs.push({ url: rec?.url || null, duration: rec?.duration || 0 })
    }
    return recs
  })

  const [activeRound, setActiveRound] = useState(-1) // -1 = not recording
  const [recordTime, setRecordTime] = useState(0)
  const [playingRound, setPlayingRound] = useState(-1)

  const recorderRef = useRef(new AudioRecorder())
  const audioRef = useRef(null)

  const allComplete = recordings.every(r => !!r.url)

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    }
  }, [])

  if (!task) return <div style={{ padding: 40, textAlign: 'center' }}>任务未找到</div>

  const c = task.content
  const fullText = c.text || (c.pages ? c.pages.join('\n\n') : '')
  const completedRounds = recordings.filter(r => !!r.url).length

  const handleRecord = async (roundIndex) => {
    // Stop any playing audio
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPlayingRound(-1) }

    if (activeRound === roundIndex) {
      // Stop recording
      const finalTime = recordTime
      const recordStartTime = new Date(Date.now() - finalTime * 1000)
      const blob = await recorderRef.current.stop()
      setActiveRound(-1)
      if (blob) {
        const url = await addRecording(taskId, `textbook-${roundIndex + 1}`, blob, finalTime)
        
        const trackRecording = useEventStore.getState().trackRecording
        trackRecording(taskId, 'TextbookReadPage', recordStartTime, finalTime, url || '')
        
        setRecordings(prev => {
          const next = [...prev]
          next[roundIndex] = { url, duration: finalTime }
          return next
        })
      }
    } else {
      // Stop any current recording first
      if (activeRound >= 0) {
        await recorderRef.current.stop()
        setActiveRound(-1)
      }
      setRecordTime(0)
      const ok = await recorderRef.current.start((t) => setRecordTime(t))
      if (ok) setActiveRound(roundIndex)
    }
  }

  const handlePlay = (roundIndex) => {
    const url = recordings[roundIndex]?.url
    if (!url) return

    if (playingRound === roundIndex) {
      // Stop playing
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      setPlayingRound(-1)
      return
    }

    // Stop previous
    if (audioRef.current) { audioRef.current.pause() }

    const audio = new Audio(url)
    audioRef.current = audio
    setPlayingRound(roundIndex)
    audio.onended = () => { setPlayingRound(-1); audioRef.current = null }
    audio.onerror = () => { setPlayingRound(-1); audioRef.current = null }
    audio.play()
  }

  const handleSubmit = () => { completeTask(taskId); navigate(-1) }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f6f7f8' }} className="animate-fade-in">
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>语文课文朗读</h2>
          {task?.completed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#059669', borderRadius: 20, fontWeight: 800, fontSize: 12, boxShadow: '0 2px 8px rgba(16,185,129,0.15)' }}>
              <span>已完成</span>
            </div>
          ) : task?.returnHistory?.length > 0 ? (
            <span style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', borderRadius: 20, fontWeight: 700, fontSize: 12 }}>
              被退回重读
            </span>
          ) : null}
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 960, margin: '0 auto', width: '100%', padding: '16px 16px 0', overflow: 'hidden' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexShrink: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>《{c.title}》</h1>
          <span style={{
            padding: '2px 10px', background: 'rgba(43,157,238,0.1)', color: '#2b9dee',
            fontSize: 12, fontWeight: 600, borderRadius: 6,
          }}>{c.type}</span>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>作者：{c.author}</span>
        </div>

        {/* Content - Scrollable Text Area */}
        <div style={{
          flex: 1, background: '#fff', borderRadius: 16, padding: '24px 28px',
          border: '1px solid #f1f5f9', overflowY: 'auto',
          WebkitOverflowScrolling: 'touch', marginBottom: 12,
        }}>
          <p style={{ fontSize: 17, lineHeight: 2, color: '#1e293b', whiteSpace: 'pre-line', margin: 0 }}>
            {fullText}
          </p>
        </div>
      </main>

      {/* Bottom Recording Panel */}
      <div style={{
        background: '#fff', borderTop: '1px solid #e2e8f0',
        padding: '12px 16px 16px', flexShrink: 0,
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          {/* Progress indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
              录音进度 {completedRounds}/{roundCount}
            </span>
            {!isViewOnly && (
              <button onClick={handleSubmit} disabled={!allComplete} style={{
                padding: '6px 20px', borderRadius: 10, border: 'none',
                background: allComplete ? '#2b9dee' : '#e2e8f0',
                color: allComplete ? '#fff' : '#94a3b8',
                fontWeight: 800, fontSize: 13, cursor: allComplete ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 4,
                boxShadow: allComplete ? '0 4px 12px rgba(43,157,238,0.3)' : 'none',
                transition: 'all 0.2s',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                提交任务
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: roundCount }).map((_, i) => (
              <RoundCard
                key={i}
                round={i + 1}
                label={getRoundLabel(i)}
                color={ROUND_COLORS[i % ROUND_COLORS.length]}
                audioUrl={recordings[i]?.url}
                duration={recordings[i]?.duration}
                isActiveRecording={activeRound === i}
                recordTime={recordTime}
                onRecord={() => handleRecord(i)}
                onPlay={() => handlePlay(i)}
                isPlaying={playingRound === i}
                isViewOnly={isViewOnly}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
