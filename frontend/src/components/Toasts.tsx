import { useApp } from '../store/useApp'

export default function Toasts() {
  const toasts = useApp(s => s.toasts)
  return (
    <div className="toasts-root" style={{ position: 'fixed', right: 20, bottom: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 90 }}>
      {toasts.map(t => (
        <div key={t.id} className="play-subir" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--n-900)', color: '#fff', padding: '11px 14px', borderRadius: 8, fontSize: 13, boxShadow: 'var(--sh-3)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />{t.msg}
        </div>
      ))}
    </div>
  )
}
