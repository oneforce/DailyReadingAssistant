import { useNavigate } from 'react-router-dom'

export default function BackButton({ onClick, style, label = '返回', className = '' }) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onClick) {
      onClick() 
    } else {
      navigate(-1)
    }
  }

  return (
    <button 
      className={className}
      onClick={handleBack} 
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 16px', background: 'rgba(43,157,238,0.1)', color: '#2b9dee',
        borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 14, 
        cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
        ...style
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
      {label && <span>{label}</span>}
    </button>
  )
}
