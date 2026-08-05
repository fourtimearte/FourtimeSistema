import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bloco, Porque, SecaoKit } from './pecas'

/** A seção que faltava — e a falta dela é o motivo de as telas terem saído
 *  mais duras do que o Luma. Ver Superficie() lado a lado com o que eu
 *  havia escrito à mão deixa a diferença óbvia. */
export function Superficie() {
  return (
    <SecaoKit
      id="superficie"
      numero="03"
      titulo="Superfície e elevação"
      lead={
        <>
          O <code>Card</code> é a peça que define a cara do sistema, e é onde o Luma mora: raio grande, sombra macia e
          um anel quase invisível no lugar da borda. Ele não estava instalado — as telas usavam um{' '}
          <code>div</code> escrito à mão, e é por isso que ficaram mais duras que o desenho de referência.
        </>
      }
    >
      <Bloco titulo="Lado a lado" nota="mesmo conteúdo, duas superfícies">
        <div className="grid items-start gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-[10.5px]">
              Card do shadcn · rounded-4xl · shadow-md · ring-1
            </span>
            <Card>
              <CardHeader>
                <CardTitle>Payout Threshold</CardTitle>
                <CardDescription>Saldo mínimo antes de disparar o repasse.</CardDescription>
                <CardAction>
                  <Button size="icon-sm" variant="ghost" aria-label="Fechar">
                    ×
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] font-medium">Mínimo</span>
                  <span className="font-mono text-2xl font-semibold tabular-nums">$2.500,00</span>
                </div>
                <Button className="w-full">Salvar</Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-[10.5px]">
              O que eu escrevi à mão · rounded-lg · border · sem sombra
            </span>
            <div className="bg-card flex flex-col gap-3 rounded-lg border p-(--ft-card-pad)">
              <div>
                <div className="font-heading text-base font-medium">Payout Threshold</div>
                <div className="text-muted-foreground text-sm">Saldo mínimo antes de disparar o repasse.</div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-medium">Mínimo</span>
                <span className="font-mono text-2xl font-semibold tabular-nums">$2.500,00</span>
              </div>
              <Button className="w-full">Salvar</Button>
            </div>
          </div>
        </div>

        <Porque>
          Três diferenças, todas medíveis. <b>Raio:</b> <code>rounded-4xl</code> é{' '}
          <code>calc(var(--radius) × 2.6)</code> ≈ 19px; <code>rounded-lg</code> é o <code>--radius</code> cru, 7px.{' '}
          <b>Profundidade:</b> <code>shadow-md</code> + <code>ring-1 ring-foreground/5</code> em vez de uma borda de
          1px cheia. <b>Respiro:</b> <code>--card-spacing</code> de 24px governando padding <i>e</i> gap ao mesmo
          tempo.
        </Porque>
        <Porque>
          A borda cheia é o que mais endurece. Ela desenha uma linha de contraste em volta de tudo; a sombra do Luma
          faz o cartão <b>subir</b> do fundo sem traçar contorno nenhum. É literalmente a diferença entre "caixa" e
          "cartão".
        </Porque>
      </Bloco>

      <Bloco titulo="Tamanhos do card">
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>default</CardTitle>
              <CardDescription>--card-spacing: 24px</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground text-[12px]">Painel de tela, formulário, resumo.</CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>sm</CardTitle>
              <CardDescription>--card-spacing: 16px</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground text-[12px]">Card dentro de card, item de lista.</CardContent>
          </Card>
        </div>
      </Bloco>
    </SecaoKit>
  )
}
