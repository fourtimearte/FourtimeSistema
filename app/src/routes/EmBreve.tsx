import { Link } from 'react-router-dom'

/** Stub honesto: diz o que falta e para onde ir, em vez de tela em branco. */
export function EmBreve({ nome }: { nome: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-lg border border-dashed p-16 text-center">
      <h1 className="font-heading text-foreground text-lg font-semibold">{nome}</h1>
      <p className="max-w-[52ch] text-[13px]">
        Fundação pronta. Esta tela entra na próxima fase — o wireframe dela já está aprovado.
      </p>
      <Link to="/kit" className="hover:bg-accent h-(--ft-control-h) rounded-lg border px-3.5 text-[13px] leading-[2.25rem] font-medium">
        Ver o /kit
      </Link>
    </div>
  )
}
