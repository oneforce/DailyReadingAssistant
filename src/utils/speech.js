import useTaskStore from '../stores/taskStore'

// We use a singleton Audio object so we can cancel previous playbacks easily.
let globalAudio = null;
window.__speechUtteranceInstance = null;

// Eagerly load browser voices
let currentVoices = [];
function loadVoices() {
  if (!window.speechSynthesis) return;
  currentVoices = window.speechSynthesis.getVoices();
}
if (window.speechSynthesis) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export function speakEN(text) {
  if (!text) return;
  
  const engine = useTaskStore.getState().ttsEngine || 'browser';
  
  console.log('[TTS] ============================');
  console.log(`[TTS] speakEN called for text: ${text} | Engine: ${engine}`);

  if (engine === 'youdao') {
    // --- Youdao Dict Audio API ---
    if (window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
      window.speechSynthesis.cancel();
    }
  
    if (globalAudio) {
      globalAudio.pause();
      globalAudio.currentTime = 0;
      globalAudio = null;
    }
  
    try {
      // type=2 (US English)
      const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`;
      globalAudio = new Audio(url);
      
      globalAudio.onplay = () => console.log('[TTS] 🎬 Youdao Audio started playing.');
      globalAudio.onended = () => console.log('[TTS] 🛑 Youdao Audio finished playing.');
      globalAudio.onerror = (e) => console.error('[TTS] ❌ Youdao Audio playback error:', e);
  
      globalAudio.play().catch(err => console.error('[TTS] Play() was blocked or failed:', err));
    } catch (err) {
      console.error('[TTS] Exception when trying to play Youdao Audio:', err);
    }
  } else {
    // --- Browser Native SpeechSynthesis ---
    if (globalAudio) {
      globalAudio.pause();
      globalAudio.currentTime = 0;
      globalAudio = null;
    }

    if (!window.speechSynthesis) {
      console.error('[TTS] window.speechSynthesis is undefined! Browser does not support it.');
      return;
    }

    const performSpeak = () => {
      // Unstick TTS engine safely
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // 1. 创建朗读实例
      const u = new SpeechSynthesisUtterance();
      u.text = text;
      u.lang = 'en-US';
      u.rate = 0.8;
      u.pitch = 1.0;
      
      if (currentVoices.length > 0) {
        const safeVoiceNames = ['samantha', 'victoria', 'zira', 'google us english', 'google uk english female'];
        let safeVoice = currentVoices.find(v => 
          v.lang.startsWith('en') && 
          v.localService && 
          safeVoiceNames.some(name => v.name.toLowerCase().includes(name))
        );
                 
        if (safeVoice) {
          console.log(`[TTS] Selected safe known voice: ${safeVoice.name} (${safeVoice.lang})`);
          u.voice = safeVoice;
        } else {
          console.log('[TTS] No safe known voice found for en-US. Reverting to default browser OS voice.');
        }
      }
      
      // Preserve reference to avoid Garbage Collection bugs in Safari
      window.__speechUtteranceInstance = u;
      
      u.onstart = () => console.log('[TTS] 🎬 Browser Utterance started playing.');
      
      // 3. 监听结束事件
      u.onend = () => {
        console.log('[TTS] 🛑 朗读完毕 (Browser Utterance finished)');
        window.__speechUtteranceInstance = null;
      };
      
      u.onerror = (e) => {
        console.error('[TTS] ❌ Browser Utterance error:', e.error || e, e);
      };
      
      // 2. 执行朗读 (Queue up speech naturally without cancelling)
      window.speechSynthesis.speak(u);
    };

    performSpeak();
  }
}


