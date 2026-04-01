import { useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import useTaskStore from '../stores/taskStore'
import useRecordStore from '../stores/recordStore'
import { AudioRecorder, formatTime } from '../utils/recorder'
import { speakEN } from '../utils/speech'
import BackButton from '../components/BackButton'
export default function EnSentencePage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const isViewOnly = query.get('viewOnly') === 'true'

  const task = useTaskStore((s) => s.getTaskById(taskId))
  const completeTask = useTaskStore((s) => s.completeTask)
  const addRecording = useRecordStore((s) => s.addRecording)
  const getRecording = useRecordStore((s) => s.getRecording)
  const hasRecording = useRecordStore((s) => s.hasRecording)
  const [recordingIndex, setRecordingIndex] = useState(-1)
  const [recordTime, setRecordTime] = useState(0)
  const [playingIndex, setPlayingIndex] = useState(-1)
  const [states, setStates] = useState(() =>
    task ? task.content.sentences.map((s, i) => ({
      recorded: s.recorded || hasRecording(taskId, `s-${i}`),
      duration: getRecording(taskId, `s-${i}`)?.duration || 0,
    })) : []
  )
  const recorderRef = useRef(new AudioRecorder())
  const audioRef = useRef(null)

  if (!task) return <div style={{ padding: 40, textAlign: 'center' }}>任务未找到</div>

  const sentences = task.content.sentences
  const done = states.filter((s) => s.recorded).length

  const handleRecord = async (i) => {
    if (recordingIndex === i) {
      const finalTime = recordTime
      const blob = await recorderRef.current.stop()
      setRecordingIndex(-1)
      if (blob) {
        await addRecording(taskId, `s-${i}`, blob, finalTime)
        const ns = [...states]
        ns[i] = { recorded: true, duration: finalTime }
        setStates(ns)
      }
    } else {
      if (recordingIndex >= 0) await recorderRef.current.stop()
      setRecordTime(0)
      const ok = await recorderRef.current.start((t) => setRecordTime(t))
      if (ok) setRecordingIndex(i)
    }
  }

  const handlePlay = (i) => {
    const rec = getRecording(taskId, `s-${i}`)
    if (!rec) return
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (playingIndex === i) { setPlayingIndex(-1); return }
    const audio = new Audio(rec.url)
    audioRef.current = audio
    setPlayingIndex(i)
    audio.onended = () => { setPlayingIndex(-1); audioRef.current = null }
    audio.onerror = () => { setPlayingIndex(-1); audioRef.current = null }
    audio.play()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7f8' }} className="animate-fade-in">
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>英语单句练习</h2>
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
        <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>{done}/{sentences.length}</span>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '16px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sentences.map((s, i) => {
            const st = states[i]
            const active = recordingIndex === i
            const playing = playingIndex === i
            return (
              <div key={i} onClick={() => speakEN(s.text)} style={{
                background: '#fff', borderRadius: 12, padding: '10px 14px',
                border: active ? '2px solid #ef4444' : '1px solid #f1f5f9',
                transition: 'all 0.2s', cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {/* Left: sentence text, wraps freely */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.4, marginBottom: 2, wordBreak: 'break-word' }}>{s.text}</p>
                    <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.3 }}>{s.translation}</p>
                  </div>

                  {/* Right: action buttons + time, fixed, won't be pushed */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {/* Duration near buttons */}
                    {active && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{formatTime(recordTime)}</span>
                    )}
                    {st.recorded && !active && st.duration > 0 && (
                      <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatTime(st.duration)}</span>
                    )}

                    {/* TTS Button */}
                    <button onClick={(e) => { e.stopPropagation(); speakEN(s.text); }} style={{
                      width: 40, height: 40, borderRadius: '50%', border: 'none',
                      background: 'rgba(43,157,238,0.1)', color: '#2b9dee',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>volume_up</span>
                    </button>

                    {/* Record / Re-record Button */}
                    {!isViewOnly && (
                    <button onClick={(e) => { e.stopPropagation(); handleRecord(i); }} style={{
                      width: 40, height: 40, borderRadius: '50%', border: 'none',
                      background: active ? '#ef4444' : st.recorded ? 'rgba(249,115,22,0.1)' : 'rgba(43,157,238,0.1)',
                      color: active ? '#fff' : st.recorded ? '#f97316' : '#2b9dee',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }} className={active ? 'recording-pulse' : ''}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                        {active ? 'stop' : st.recorded ? 'restart_alt' : 'mic'}
                      </span>
                    </button>
                    )}

                    {/* Play Button */}
                    {st.recorded && (
                      <button onClick={(e) => { e.stopPropagation(); handlePlay(i); }} style={{
                        width: 40, height: 40, borderRadius: '50%', border: 'none',
                        background: playing ? '#10b981' : '#d1fae5',
                        color: playing ? '#fff' : '#059669',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                          {playing ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {done === sentences.length && !isViewOnly ? (
          <button onClick={() => { completeTask(taskId); navigate(-1) }} style={{
            width: '100%', padding: 14, marginTop: 16,
            background: '#2b9dee', color: '#fff', border: 'none', borderRadius: 12,
            fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}>
            提交练习
          </button>
        ) : (
          <button onClick={() => navigate(-1)} style={{
            width: '100%', padding: 14, marginTop: 16,
            background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 12,
            fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}>
            返回 ({done}/{sentences.length})
          </button>
        )}
      </main>
    </div>
  )
}
