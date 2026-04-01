import { useNavigate } from 'react-router-dom'
import useTaskStore from '../stores/taskStore'
import BackButton from '../components/BackButton'
export default function SettingsPage() {
  const navigate = useNavigate()
  const ttsEngine = useTaskStore((s) => s.ttsEngine) || 'browser'
  const setTtsEngine = useTaskStore((s) => s.setTtsEngine)
  const earlyReadingConfig = useTaskStore((s) => s.earlyReadingConfig) || { start: '06:30', end: '07:30' }
  const setEarlyReadingConfig = useTaskStore((s) => s.setEarlyReadingConfig)
  const dailyLimits = useTaskStore((s) => s.dailyLimits) || { maxPerType: 2, maxDailyTasks: 6 }
  const setDailyLimits = useTaskStore((s) => s.setDailyLimits)
  const generateHistoricalStreakRewards = useTaskStore((s) => s.generateHistoricalStreakRewards)
  const injectMock3DayStreak = useTaskStore((s) => s.injectMock3DayStreak)

  const handleGenerateHistory = () => {
    generateHistoricalStreakRewards();
    alert("历史连续阅读奖励计算完成！");
  }

  const handleInjectMock3Day = () => {
    injectMock3DayStreak();
    alert("已成功生成过去3天连续阅读（语文+英语）及早读的模拟数据！去日历看看吧。");
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <BackButton />
        <h1 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>系统设置</h1>
      </header>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '16px', color: '#334155', margin: '0 0 16px 0' }}>TTS 语音朗读引擎</h2>
        
        <label style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px', gap: '12px', cursor: 'pointer' }}>
          <input 
            type="radio" 
            name="ttsEngine" 
            value="browser" 
            checked={ttsEngine === 'browser'} 
            onChange={() => setTtsEngine('browser')}
            style={{ marginTop: '4px' }}
          />
          <div>
            <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '500' }}>浏览器原生朗读 (推荐)</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
              调用当前设备系统自带的英语发音（如存在），无需网络，速度最快。默认优先尝试使用女声。
            </div>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
          <input 
            type="radio" 
            name="ttsEngine" 
            value="youdao" 
            checked={ttsEngine === 'youdao'} 
            onChange={() => setTtsEngine('youdao')}
            style={{ marginTop: '4px' }}
          />
          <div>
            <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '500' }}>有道词典 API (网络发音)</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
              当浏览器原生引擎出现 Bug 或者没有生动的人声时可以使用，需要网络连接。提供纯正美音发音。
            </div>
          </div>
        </label>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '20px' }}>
        <h2 style={{ fontSize: '16px', color: '#334155', margin: '0 0 16px 0' }}>奖励规则设置</h2>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '500', marginBottom: '8px' }}>晨读时间段</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>在此期间完成的朗读任务将被计入“早起鸟”晨读勋章。</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="time" 
              value={earlyReadingConfig.start}
              onChange={(e) => setEarlyReadingConfig({ ...earlyReadingConfig, start: e.target.value })}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
            <span style={{ color: '#64748b' }}>至</span>
            <input 
              type="time" 
              value={earlyReadingConfig.end}
              onChange={(e) => setEarlyReadingConfig({ ...earlyReadingConfig, end: e.target.value })}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
            />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '20px' }}>
        <h2 style={{ fontSize: '16px', color: '#334155', margin: '0 0 16px 0' }}>每日任务限制</h2>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '500', marginBottom: '8px' }}>每种任务类型最多完成</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>例如：设为2则每天最多完成2个古诗、2个课文等。</div>
          <select 
            value={dailyLimits.maxPerType}
            onChange={(e) => setDailyLimits({ maxPerType: parseInt(e.target.value) })}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', minWidth: '120px' }}
          >
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n} 项/天</option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '500', marginBottom: '8px' }}>每日最多完成任务数</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>所有类型任务加起来每天最多完成的总数。</div>
          <select 
            value={dailyLimits.maxDailyTasks}
            onChange={(e) => setDailyLimits({ maxDailyTasks: parseInt(e.target.value) })}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', minWidth: '120px' }}
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <option key={n} value={n}>{n} 项/天</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '20px' }}>
        <h2 style={{ fontSize: '16px', color: '#334155', margin: '0 0 16px 0' }}>数据操作</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={handleGenerateHistory}
            style={{
              padding: '12px', background: '#f8fafc', color: '#475569', fontSize: '14px', fontWeight: 'bold',
              border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', textAlign: 'left'
            }}
          >
            🔥 生成/重新计算历史连续阅读奖励
          </button>
          <button 
            onClick={handleInjectMock3Day}
            style={{
              padding: '12px', background: '#f8fafc', color: '#475569', fontSize: '14px', fontWeight: 'bold',
              border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <span style={{ fontSize: '16px' }}>🧪</span> 生成测试数据：连续3天阅读+早读记录
          </button>
        </div>
      </div>
    </div>
  )
}

