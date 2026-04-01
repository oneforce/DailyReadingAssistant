export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null
    this.chunks = []
    this.stream = null
    this.startTime = null
    this.timerInterval = null
    this.onTimeUpdate = null
  }

  async start(onTimeUpdate) {
    this.onTimeUpdate = onTimeUpdate
    this.chunks = []
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.mediaRecorder = new MediaRecorder(this.stream)
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data)
      }
      this.mediaRecorder.start()
      this.startTime = Date.now()
      this.timerInterval = setInterval(() => {
        if (this.onTimeUpdate) {
          const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
          this.onTimeUpdate(elapsed)
        }
      }, 1000)
      return true
    } catch (err) {
      console.error('Microphone access denied:', err)
      return false
    }
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null)
        return
      }
      clearInterval(this.timerInterval)
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' })
        this.stream?.getTracks().forEach((t) => t.stop())
        this.stream = null
        this.mediaRecorder = null
        this.chunks = []
        resolve(blob)
      }
      this.mediaRecorder.stop()
    })
  }

  isRecording() {
    return this.mediaRecorder?.state === 'recording'
  }
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
