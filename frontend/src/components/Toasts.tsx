import { useApp } from '../store/useApp'

/* .toast-wrap / .toast / .toast .d vêm do kit v5 (styles/kit.css).
   .toasts-root continua existindo só para o @media print escondê-lo. */
export default function Toasts() {
  const toasts = useApp(s => s.toasts)
  return (
    <div className="toasts-root toast-wrap" style={{ zIndex: 90 }}>
      {toasts.map(t => (
        <div key={t.id} className="toast show play-subir"><i className="d" />{t.msg}</div>
      ))}
    </div>
  )
}
