import React, { useEffect } from 'react';

export default function RewardRulesModal({ onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const sections = [
    {
      title: '🌟 基础学习积分',
      items: [
        { label: '单句合集阅读', points: '5~10分' },
        { label: '单词合集阅读', points: '10分' },
        { label: '古诗阅读', points: '5分' },
        { label: '语文课文', points: '20~30分' },
        { label: '英语短剧或课文', points: '20~30分' },
        { label: '家长评审附加', points: '最高 +5分' },
      ]
    },
    {
      title: '🎯 任务连续奖励',
      subtitle: '当日完成多个任务可获得额外积分',
      items: [
        { label: '完成第 1 个阅读任务', points: '额外 +2' },
        { label: '完成第 2 个阅读任务', points: '额外 +3' },
        { label: '完成第 3 个阅读任务', points: '额外 +5' },
        { label: '完成第 4 个阅读任务', points: '额外 +8' },
        { label: '完成第 5 个阅读任务', points: '额外 +11' },
      ]
    },
    {
      title: '📋 每日任务限制',
      items: [
        { label: '每种任务类型最多', points: '2 项/天' },
        { label: '每日最多完成', points: '6 项/天' },
      ]
    },
    {
      title: '🔥 连续阅读挑战',
      subtitle: '需每日完成并审核"语文课文"+"英语阅读"',
      items: [
        { label: '连续阅读 3 天', points: '+30分' },
        { label: '连续阅读 5 天', points: '+80分' },
        { label: '连续阅读 8 天', points: '+160分' },
        { label: '连续阅读 15 天', points: '+290分' },
        { label: '连续阅读 30 天', points: '+840分' },
        { label: '连续阅读 100 天', points: '+1840分' },
      ]
    },
    {
      title: '🌅 早起护航挑战',
      subtitle: '需在设定的早读时间段内完成上述连续要求',
      items: [
        { label: '连续早读 3 天', points: '+20分' },
        { label: '连续早读 5 天', points: '+30分' },
        { label: '连续早读 8 天', points: '+50分' },
        { label: '连续早读 15 天', points: '+80分' },
        { label: '连续早读 30 天', points: '+210分' },
        { label: '连续早读 100 天', points: '+340分' },
      ]
    }
  ];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15,23,42,0.6)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      <div className="animate-slide-up" style={{
        background: '#fff', borderRadius: 24, width: '100%', maxWidth: 400,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ 
          padding: '24px 24px 16px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(43,157,238,0.1), rgba(43,157,238,0.02))'
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: '#2b9dee' }}>emoji_events</span>
            奖励规则
          </h2>
          <button onClick={onClose} style={{ 
            background: 'rgba(148,163,184,0.1)', border: 'none', width: 32, height: 32, 
            borderRadius: '50%', color: '#64748b', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '0 24px 24px', overflowY: 'auto' }}>
          {sections.map((sec, idx) => (
            <div key={idx} style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#334155', marginBottom: sec.subtitle ? 4 : 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                {sec.title}
              </h3>
              {sec.subtitle && <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px 0', fontWeight: 600 }}>💡 {sec.subtitle}</p>}
              <div style={{ background: '#f8fafc', borderRadius: 16, padding: '12px 16px', border: '1px solid rgba(226,232,240,0.6)' }}>
                {sec.items.map((item, i) => (
                  <div key={i} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: i < sec.items.length - 1 ? '1px dashed #cbd5e1' : 'none'
                  }}>
                    <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontSize: 13, color: '#2b9dee', fontWeight: 800, background: 'rgba(43,157,238,0.1)', padding: '2px 8px', borderRadius: 8 }}>{item.points}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div style={{ marginTop: 24, padding: 16, background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))', borderRadius: 16, border: '1px solid rgba(245,158,11,0.2)' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#b45309', lineHeight: 1.6, fontWeight: 600 }}>
              <span style={{ fontWeight: 800 }}>💡 提示：</span>
              积分和荣誉不仅能记录你的进步，还可以在家长端兑换特殊惊喜！每天保持阅读，创造属于你的纪录吧！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
