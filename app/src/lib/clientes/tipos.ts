/** Espelha o schema real do export do Bling (1.901 registros).
 *  Campos além de id/nome/doc são opcionais por tolerância — mesmo espírito
 *  do contrato .ft: campo ausente vira padrão, nunca erro. */
export interface Cliente {
  id: number
  nome: string
  doc: string
  contato: string
  endereco: string
  vendedor: string
  segmento: string
  blingId?: string
  tipo?: 'PF' | 'PJ'
  fantasia?: string
  ie?: string
  email?: string
  cidade?: string
  uf?: string
  cep?: string
  bairro?: string
  complemento?: string
  obs?: string
  criadoEm?: string
  ativo?: boolean
  /* campos que o export do Bling traz em alguns registros. Estão aqui pela
     regra do contrato .ft: campo que existe nunca é descartado. */
  nascimento?: string
  tipoContato?: string
}

export const VENDEDORES = ['Henrique', 'Daniele', 'Kevelin', 'Planejamento', 'Arte'] as const
export const SEGMENTOS = [
  'Escola', 'Faculdade', 'Academia', 'Esporte', 'Comércio',
  'Indústria', 'Igreja', 'Evento', 'Corporativo', 'Outro',
] as const
