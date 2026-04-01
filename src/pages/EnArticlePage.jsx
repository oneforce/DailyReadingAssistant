import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import useTaskStore from '../stores/taskStore'
import useRecordStore from '../stores/recordStore'
import useEventStore from '../stores/eventStore'
import { AudioRecorder, formatTime } from '../utils/recorder'
import BackButton from '../components/BackButton'
export default function EnArticlePage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const isViewOnly = query.get('viewOnly') === 'true'

  const task = useTaskStore((s) => s.getTaskById(taskId))
  const completeTask = useTaskStore((s) => s.completeTask)
  const addRecording = useRecordStore((s) => s.addRecording)
  const getRecording = useRecordStore((s) => s.getRecording)
  const [isRecording, setIsRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  const existingRec = getRecording(taskId, 'article')
  const [audioUrl, setAudioUrl] = useState(existingRec?.url || null)
  const [savedDuration, setSavedDuration] = useState(existingRec?.duration || 0)
  const recorderRef = useRef(new AudioRecorder())

  // Playback state
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playProgress, setPlayProgress] = useState(0)
  const [playCurrentTime, setPlayCurrentTime] = useState(0)
  const [playDuration, setPlayDuration] = useState(0)
  const progressBarRef = useRef(null)

  // Pre-create Audio object whenever audioUrl changes
  useEffect(() => {
    if (!audioUrl) { audioRef.current = null; return }
    const audio = new Audio(audioUrl)
    audioRef.current = audio
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => setPlayDuration(audio.duration)
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setPlayProgress((audio.currentTime / audio.duration) * 100)
        setPlayCurrentTime(audio.currentTime)
      }
    }
    audio.onended = () => { setIsPlaying(false); setPlayProgress(100); setPlayCurrentTime(audio.duration) }
    audio.onerror = () => setIsPlaying(false)
    return () => { audio.pause(); audio.src = '' }
  }, [audioUrl])

  if (!task) return <div style={{ padding: 40, textAlign: 'center' }}>任务未找到</div>

  const c = task.content
  const hasAudio = !!audioUrl

  const handleRecord = async () => {
    if (isRecording) {
      const finalTime = recordTime
      const recordStartTime = new Date(Date.now() - finalTime * 1000)
      const blob = await recorderRef.current.stop()
      setIsRecording(false)
      if (blob) {
        const url = await addRecording(taskId, 'article', blob, finalTime)
        
        const trackRecording = useEventStore.getState().trackRecording
        trackRecording(taskId, 'EnArticlePage', recordStartTime, finalTime, url || '')
        
        setAudioUrl(url)
        setSavedDuration(finalTime)
        setPlayProgress(0)
        setPlayCurrentTime(0)
      }
    } else {
      if (audioRef.current) audioRef.current.pause()
      setIsPlaying(false)
      setRecordTime(0)
      const ok = await recorderRef.current.start((t) => setRecordTime(t))
      if (ok) setIsRecording(true)
    }
  }

  const handlePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }
    // If at end, restart
    if (audioRef.current.ended || playProgress >= 100) {
      audioRef.current.currentTime = 0
      setPlayProgress(0)
      setPlayCurrentTime(0)
    }
    setIsPlaying(true)
    audioRef.current.play()
  }

  const seekTo = (clientX) => {
    if (!audioRef.current || !progressBarRef.current || !audioRef.current.duration) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    audioRef.current.currentTime = pct * audioRef.current.duration
    setPlayProgress(pct * 100)
    setPlayCurrentTime(pct * audioRef.current.duration)
  }

  const handleSeek = (e) => seekTo(e.clientX)

  const handleDragStart = (e) => {
    e.preventDefault()
    const onMove = (ev) => seekTo(ev.clientX)
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    seekTo(e.clientX)
  }

  const handleTouchDrag = (e) => {
    if (e.touches.length > 0) seekTo(e.touches[0].clientX)
  }

  const fmtSec = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleSubmit = () => { completeTask(taskId); navigate(-1) }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7f8' }} className="animate-fade-in">
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>朗读任务</h2>
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

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px', paddingBottom: 200 }}>
        {/* Article */}
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>{c.title}</h1>
        <div style={{ fontSize: 17, lineHeight: 2, color: '#334155', whiteSpace: 'pre-line' }}>
          {c.text}
        </div>
      </main>

      {/* Bottom Recording Bar */}
      {!isViewOnly && (
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid #e2e8f0', padding: '12px 16px', zIndex: 40,
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Playback Progress Bar - only show when has audio */}
          {hasAudio && !isRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                ref={progressBarRef}
                onClick={handleSeek}
                onMouseDown={handleDragStart}
                onTouchStart={handleTouchDrag}
                onTouchMove={handleTouchDrag}
                style={{
                  flex: 1, height: 24, background: 'transparent', borderRadius: 9999,
                  cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center',
                }}
              >
                {/* Track */}
                <div style={{ position: 'absolute', left: 0, right: 0, height: 6, background: '#e2e8f0', borderRadius: 9999 }}>
                  <div style={{
                    height: '100%', background: isPlaying ? '#10b981' : '#2b9dee',
                    borderRadius: 9999, width: `${playProgress}%`, transition: 'width 0.1s linear',
                  }} />
                </div>
                {/* Drag Handle */}
                <div style={{
                  position: 'absolute', left: `${playProgress}%`,
                  transform: 'translateX(-50%)', width: 18, height: 18,
                  borderRadius: '50%', background: '#fff',
                  border: `3px solid ${isPlaying ? '#10b981' : '#2b9dee'}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)', zIndex: 2,
                }} />
              </div>
              <span style={{ fontSize: 12, color: '#64748b', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {fmtSec(playCurrentTime)}/{fmtSec(playDuration || savedDuration)}
              </span>
            </div>
          )}

          {/* Recording time display */}
          {isRecording && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '4px 0' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse-ring 1s infinite' }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{formatTime(recordTime)}</span>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            {/* Play Button */}
            <button onClick={handlePlay} disabled={!hasAudio} style={{
              width: 48, height: 48, borderRadius: 14,
              background: hasAudio
                ? (isPlaying ? '#10b981' : '#d1fae5')
                : '#f1f5f9',
              border: hasAudio ? 'none' : '1px dashed #e2e8f0',
              color: hasAudio ? (isPlaying ? '#fff' : '#059669') : '#cbd5e1',
              cursor: hasAudio ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Record Button */}
            <button onClick={handleRecord} style={{
              width: 64, height: 64, borderRadius: '50%', border: 'none',
              background: isRecording ? '#ef4444' : '#2b9dee', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${isRecording ? 'rgba(239,68,68,0.3)' : 'rgba(43,157,238,0.3)'}`,
              transition: 'all 0.2s',
            }} className={isRecording ? 'recording-pulse' : ''}>
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{isRecording ? 'stop' : 'mic'}</span>
            </button>

            {/* Submit Button */}
            <button onClick={handleSubmit} style={{
              width: 48, height: 48, borderRadius: 14,
              background: hasAudio ? 'rgba(43,157,238,0.1)' : '#f1f5f9',
              border: hasAudio ? 'none' : '1px dashed #e2e8f0',
              color: hasAudio ? '#2b9dee' : '#cbd5e1',
              cursor: hasAudio ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>check</span>
            </button>
          </div>

          {/* Status text */}
          {hasAudio && !isRecording && !isPlaying && (
            <div style={{ textAlign: 'center' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                background: '#d1fae5', borderRadius: 8, fontSize: 12, color: '#059669', fontWeight: 600,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                已录制 {formatTime(savedDuration)}
              </span>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
