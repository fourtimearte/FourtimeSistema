/* =====================================================================
   Modelo de dados — schema .ft (superset do editor v172) + roteamento.
   NÃO remover campos — só acrescentar (contrato .ft inviolável).
   ===================================================================== */

import { SMELJ_NAVY, SMELJ_BLACK, POLO_3A, CROSS_3B } from './seedImgs'

export type TecnicaKey = 'DTF' | 'Subli' | 'Silk' | 'Patch' | 'Bordado' | 'Etiqueta'
export interface Tecnica { label: string; cor: string; entry: string | null }
export const TECNICAS: Record<TecnicaKey, Tecnica> = {
  /* entry = 1ª estação da faixa (MARK42): Corte Manual distribui p/ DTF e
     Silk; Sublimação vem direto do estoque (tecido cru) → Subli Montagem */
  DTF: { label: 'DTF', cor: '--set-dtf', entry: 'corte' },
  Subli: { label: 'Sublimação', cor: '--set-sublimacao', entry: 'sub_mont' },
  Silk: { label: 'Silk', cor: '--set-silk', entry: 'corte' },
  Patch: { label: 'Patch', cor: '--set-corte', entry: 'acab' },
  Bordado: { label: 'Bordado', cor: '--set-bordado', entry: 'acab' },
  Etiqueta: { label: 'Etiqueta', cor: '--set-costura', entry: null },
}
/** rota completa de cada técnica pelas estações (MARK42 MK-V-29/30) */
export const ROTA_TECNICA: Record<TecnicaKey, string[]> = {
  DTF: ['corte', 'dtf_mont', 'dtf_imp', 'dtf_rec', 'dtf_prensa', 'dtf_etq', 'acab', 'costura', 'cq', 'despacho', 'entregue'],
  Silk: ['corte', 'silk_mont', 'silk_imp', 'silk_tela', 'silk_etq', 'silk_peca', 'acab', 'costura', 'cq', 'despacho', 'entregue'],
  Subli: ['sub_mont', 'sub_imp', 'sub_etq', 'sub_cal', 'laser', 'acab', 'costura', 'cq', 'despacho', 'entregue'],
  Patch: ['acab', 'costura', 'cq', 'despacho', 'entregue'],
  Bordado: ['acab', 'costura', 'cq', 'despacho', 'entregue'],
  Etiqueta: [],
}
export const DESIGN_ORDER: TecnicaKey[] = ['DTF', 'Subli', 'Silk', 'Patch', 'Bordado', 'Etiqueta']
/** técnicas que abrem seletor de código de cor (como no v172) */
export const TEM_CODIGO: TecnicaKey[] = ['DTF', 'Subli']

/* grades de tamanho (v172) */
export const TAM_ADULTO = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'G1', 'G2', 'G3', 'G4']
export const TAM_INFANTIL = ['2A', '4A', '6A', '8A', '10A', '12A', '14A']
export const isInfantil = (t: string) => TAM_INFANTIL.includes(t)

/* paletas de código de cor — tabelas REAIS migradas do v172 (DTF 300, Subli 87) */
const DTF_RAW: [string, string][] = [['001','#FFFFFF'],['002','#202121'],['003','#25251F'],['004','#37363A'],['005','#494B59'],['006','#666877'],['007','#626672'],['008','#767985'],['009','#858994'],['010','#9698A4'],['011','#BFC1CB'],['012','#000000'],['013','#BB8859'],['014','#DB9B2C'],['015','#CE891D'],['016','#A66B22'],['017','#8B5B4B'],['018','#C26F47'],['019','#9E5127'],['020','#7B4936'],['021','#AA8665'],['022','#936B4F'],['023','#836449'],['024','#604537'],['025','#452E29'],['026','#BC2A4B'],['027','#9D2943'],['028','#792F43'],['029','#A92450'],['030','#A21F48'],['031','#D1E9EE'],['032','#C3E2EA'],['033','#A8D5E1'],['034','#80C5D6'],['035','#54B6CC'],['036','#00AAC2'],['037','#008FA3'],['038','#007484'],['039','#005A67'],['040','#D1E9EE'],['041','#B5DCEC'],['042','#93CDE4'],['043','#75C8DA'],['044','#42B6D9'],['045','#00ADC8'],['046','#009CB2'],['047','#008FA3'],['048','#008395'],['049','#CDDEF3'],['050','#BAE0F8'],['051','#90CEF4'],['052','#65BFF1'],['053','#23B2EE'],['054','#00ACEC'],['055','#009DD7'],['056','#0083B2'],['057','#2B648F'],['058','#D0E9FB'],['059','#A6D7F6'],['060','#7CC6F2'],['061','#4BB8EF'],['062','#00ACEC'],['063','#0090C5'],['064','#0076A0'],['065','#005B7D'],['066','#004D6B'],['067','#CAD4EC'],['068','#95B5DD'],['069','#7197CF'],['070','#0091CA'],['071','#0083B8'],['072','#067CB1'],['073','#007BBC'],['074','#0073BF'],['075','#095282'],['076','#C7CCE6'],['077','#A19BC8'],['078','#7A80BD'],['079','#687DC4'],['080','#0073C1'],['081','#205AA7'],['082','#264D8F'],['083','#2B3E71'],['084','#2C3D5C'],['085','#C5C3E0'],['086','#9F8DC8'],['087','#8D73B3'],['088','#7261A6'],['089','#52509E'],['090','#6353A1'],['091','#2846A4'],['092','#484185'],['093','#2B3881'],['094','#CFC7E1'],['095','#BF9DCF'],['096','#A178B1'],['097','#9760AA'],['098','#784B97'],['099','#5F4484'],['100','#593F79'],['101','#4C2477'],['102','#563270'],['103','#D9CAE2'],['104','#B881BE'],['105','#9865A3'],['106','#9760AA'],['107','#8B4E97'],['108','#8B4B97'],['109','#89478C'],['110','#673C7B'],['111','#674575'],['112','#E3CFE3'],['113','#D897CB'],['114','#AE579D'],['115','#CC33FF'],['116','#B535D1'],['117','#9F37A4'],['118','#883976'],['119','#7A417C'],['120','#71477E'],['121','#F0D4E4'],['122','#F0B7CF'],['123','#E284C4'],['124','#C367A6'],['125','#C500B2'],['126','#B3458E'],['127','#AB518F'],['128','#994887'],['129','#82346D'],['130','#F1D3D9'],['131','#EC89B3'],['132','#D765A7'],['133','#DC589D'],['134','#C9438A'],['135','#CA0088'],['136','#A23B7E'],['137','#91316C'],['138','#72294D'],['139','#F1D2D0'],['140','#E995AB'],['141','#F2789D'],['142','#E34D89'],['143','#CF3D81'],['144','#BA3575'],['145','#A33D6D'],['146','#863055'],['147','#67303A'],['148','#F1D2C9'],['149','#FF9B92'],['150','#E77981'],['151','#E53D33'],['152','#CD1C39'],['153','#B31F37'],['154','#A91328'],['155','#802741'],['156','#683842'],['157','#E5A88F'],['158','#E9674B'],['159','#E9502A'],['160','#F14434'],['161','#C54426'],['162','#A7262C'],['163','#9B1D2B'],['164','#732A34'],['165','#62383A'],['166','#F4DBC6'],['167','#FFC397'],['168','#EC801C'],['169','#FF8720'],['170','#FF7A13'],['171','#EA7815'],['172','#EE6331'],['173','#ED5215'],['174','#B95527'],['175','#F8E5CA'],['176','#FFD699'],['177','#FFD262'],['178','#FFC148'],['179','#FFB300'],['180','#F49713'],['181','#FB9221'],['182','#EC801C'],['183','#C85A1D'],['184','#FBEFD0'],['185','#FAE3AA'],['186','#FEDC66'],['187','#FCD300'],['188','#FFC800'],['189','#FAAF00'],['190','#CB9E0F'],['191','#B5975A'],['192','#7B6742'],['193','#FFFBD6'],['194','#FFF68A'],['195','#FDEB09'],['196','#FFF22D'],['197','#FFE000'],['198','#FFD603'],['199','#CAB734'],['200','#B4AB22'],['201','#7F7F3F'],['202','#E9EDAF'],['203','#F3EE8E'],['204','#F1EB51'],['205','#F4EB09'],['206','#F4EC6F'],['207','#D4D813'],['208','#AFB351'],['209','#7F8243'],['210','#6B7354'],['211','#E7F0D5'],['212','#D5E09C'],['213','#E1ED84'],['214','#D8DE3F'],['215','#CEDA42'],['216','#BAD147'],['217','#9DB63E'],['218','#7C864A'],['219','#6A7037'],['220','#DDEBD4'],['221','#C9DEA3'],['222','#CCEB80'],['223','#B2CE63'],['224','#8FF700'],['225','#A0C32D'],['226','#82A440'],['227','#678433'],['228','#41523F'],['229','#D3E7D3'],['230','#C9DEA3'],['231','#B1FD90'],['232','#A4CA78'],['233','#6DCC54'],['234','#77B566'],['235','#00C719'],['236','#478740'],['237','#475C37'],['238','#D2E7DC'],['239','#BFD8C0'],['240','#B2D6B3'],['241','#89C18B'],['242','#68D48F'],['243','#33C477'],['244','#55AB5C'],['245','#638C4E'],['246','#4E804D'],['247','#D2E8E5'],['248','#B1D2C2'],['249','#A8D0BB'],['250','#7AD8C4'],['251','#75CAB2'],['252','#44C6A6'],['253','#2BA478'],['254','#008550'],['255','#7F7F3F'],['256','#D1E9EE'],['257','#BBDBDC'],['258','#A0D4DA'],['259','#7EC9D3'],['260','#63ADB5'],['261','#51B3B1'],['262','#3EB8AF'],['263','#2B8184'],['264','#A2A247'],['265','#BD912A'],['266','#C69520'],['267','#C29E43'],['268','#CB9E0F'],['269','#D7AA1F'],['270','#EBBA1D'],['271','#D8B366'],['272','#E2C27B'],['273','#F3D99B'],['274','#AC8F55'],['275','#B09269'],['276','#BB9768'],['277','#BDA587'],['278','#BCA580'],['279','#B6A594'],['280','#B4A78F'],['281','#CCB49B'],['282','#EBDFCA'],['283','#734773'],['284','#4A3E7C'],['285','#2E396A'],['286','#3D4341'],['287','#A5B6C9'],['288','#B5ACAE'],['289','#C9B1B2'],['290','#9F9F98'],['291','#D8DA5E'],['292','#B62149'],['293','#D12968'],['294','#DB244F'],['295','#726D45'],['296','#948E63'],['297','#918865'],['298','#A5A187'],['299','#ABAA91'],['300','#CACF4F']]
const SB_RAW: [string, string][] = [['S01','#1E1E1E'],['S02','#141414'],['S03','#000000'],['S04','#3C3C3C'],['S05','#323232'],['S06','#282828'],['S07','#E5E5E6'],['S08','#D0D1D2'],['S09','#BABBBE'],['S10','#C5A455'],['S11','#B1944D'],['S12','#9F8545'],['S13','#F2C92F'],['S14','#E3A709'],['S15','#E39D09'],['S16','#FFF86B'],['S17','#FEF100'],['S18','#F3DF39'],['S19','#FF5109'],['S20','#CF4207'],['S21','#BA3B06'],['S22','#BB251D'],['S23','#A9221A'],['S24','#971E17'],['S25','#851D18'],['S26','#771A16'],['S27','#691713'],['S28','#5B213D'],['S29','#56143E'],['S30','#50063E'],['S31','#542467'],['S32','#48235C'],['S33','#3D2152'],['S34','#70139E'],['S35','#660F92'],['S36','#5C0A85'],['S37','#CD2D96'],['S38','#C00F82'],['S39','#9C0D69'],['S40','#F0D5E4'],['S41','#E9C1D7'],['S42','#E4AECB'],['S43','#E9E1D2'],['S44','#E5DAC8'],['S45','#E1D2BF'],['S46','#C9A687'],['S47','#BB967D'],['S48','#AD8672'],['S49','#541D19'],['S50','#481D19'],['S51','#3C1D19'],['S52','#213C27'],['S53','#1D3422'],['S54','#182C1D'],['S55','#49802F'],['S56','#3A6B23'],['S57','#385928'],['S58','#7C864A'],['S59','#525831'],['S60','#434728'],['S61','#B6E7AA'],['S62','#A3DDA6'],['S63','#90D2A2'],['S64','#97C62D'],['S65','#8DB82D'],['S66','#82AA2D'],['S67','#BBDBF0'],['S68','#AAD2F0'],['S69','#A0C8F0'],['S70','#81D9D7'],['S71','#5CC0C0'],['S72','#37A8A9'],['S73','#0085B7'],['S74','#006C95'],['S75','#005779'],['S76','#0F64A0'],['S77','#0A5AA0'],['S78','#0550A0'],['S79','#182153'],['S80','#131A41'],['S81','#101534'],['S82','#182034'],['S83','#141C2B'],['S84','#101722'],['S85','#FFFBD5'],['S86','#FFF8B9'],['S87','#FFF69C']]
export const DTF_CORES = DTF_RAW.map(([code, hex]) => ({ code, hex }))
export const SB_CORES = SB_RAW.map(([code, hex]) => ({ code, hex }))
export function codigoHex(tag: TecnicaKey, code: string): string {
  const tbl = tag === 'DTF' ? DTF_CORES : tag === 'Subli' ? SB_CORES : []
  return tbl.find(c => c.code === code)?.hex ?? '#98A3B0'
}

export const CORES: { nome: string; hex: string }[] = [
  { nome: 'Preto', hex: '#1B1B1F' }, { nome: 'Branco', hex: '#F3F4F6' }, { nome: 'Vermelho Fourtime', hex: '#C6161B' },
  { nome: 'Azul-marinho', hex: '#12213F' }, { nome: 'Royal', hex: '#2456C6' }, { nome: 'Verde bandeira', hex: '#0B7A3B' },
  { nome: 'Amarelo ouro', hex: '#F2B705' }, { nome: 'Laranja', hex: '#EA580C' }, { nome: 'Rosa pink', hex: '#DB2777' },
  { nome: 'Roxo', hex: '#6D28D9' }, { nome: 'Cinza mescla', hex: '#9AA1AC' }, { nome: 'Grafite', hex: '#3A3F47' },
]
export function corHexPorNome(nome: string): string {
  return CORES.find(x => x.nome.toLowerCase() === nome.trim().toLowerCase())?.hex ?? '#98A3B0'
}
/* classe de gênero p/ tingir o campo Referência (v172, paleta harmonizada
   com os tokens: azul=masc, rosa=fem, verde-menta=infantil). CSS em index.css */
export function generoClasse(genero?: string): string | null {
  const g = (genero || '').toLowerCase()
  if (g.startsWith('masc')) return 'gen-masc'
  if (g.startsWith('fem')) return 'gen-fem'
  if (g.startsWith('inf')) return 'gen-inf'
  return null
}
export const OBS_TAGS = [{ tag: 'URGENTE', cor: 'var(--danger)' }, { tag: 'ATRASADO', cor: 'var(--warning)' }]
/* catálogos p/ autocomplete (Banco de Dados do v172) */
export const TECIDOS = ['Dry-fit 100% poliéster', 'Dry-fit PET', 'Malha PV (Poliviscose)', 'Piquet', 'Helanca light', 'Dry premium', 'Ribana', 'Algodão penteado 30.1', 'Poliéster', 'Moletom flanelado', 'Tactel', 'Oxford']
export const VENDEDORES = ['Henrique', 'Daniele', 'Kevelin', 'Planejamento', 'Arte']
export const DEPARTAMENTOS = ['Uniformes', 'Esporte', 'Comércio', 'Academia', 'Faculdade', 'Escola', 'Eventos', 'Corporativo']
export const EMBALAGENS = ['Saco individual', 'Caixa', 'A granel', 'Sacola personalizada']

/* ---------------------------------------------------------------------
   SETORES (departamentos) — cada um é um token --set-* que o sistema
   inteiro lê: colunas do Kanban, faixas, tags de técnica, rail lateral e
   as pílulas de Design da folha A4. Trocar o token no <html> repinta tudo
   de uma vez; é isso que a aba "Cores dos departamentos" faz.
   `padrao` = valor de fábrica (o mesmo que está em tokens.css).
   --------------------------------------------------------------------- */
export interface Setor { token: string; nome: string; grupo: string; padrao: string; onde: string }
export const SETORES: Setor[] = [
  { token: '--set-comercial', nome: 'Comercial', grupo: 'Atendimento', padrao: '#2563EB', onde: 'Rail · Editor · cabeçalho de layout' },
  { token: '--set-arte', nome: 'Arte', grupo: 'Atendimento', padrao: '#7C3AED', onde: 'Marcações e revisões de arte' },
  { token: '--set-dtf', nome: 'DTF', grupo: 'Produção', padrao: '#DB2777', onde: 'Faixa DTF (5 colunas) · tag DTF · pílula A4' },
  { token: '--set-sublimacao', nome: 'Sublimação', grupo: 'Produção', padrao: '#0E7490', onde: 'Faixa Subli (4 colunas) · tag Subli · pílula A4' },
  { token: '--set-silk', nome: 'Silk', grupo: 'Produção', padrao: '#047857', onde: 'Faixa Silk (5 colunas) · tag Silk · pílula A4' },
  { token: '--set-corte', nome: 'Corte', grupo: 'Produção', padrao: '#C2410C', onde: 'Corte Manual · Corte a Laser · tag Patch' },
  { token: '--set-bordado', nome: 'Bordado / Patch', grupo: 'Produção', padrao: '#B45309', onde: 'Acabamento · tag Bordado' },
  { token: '--set-costura', nome: 'CD Costura', grupo: 'Produção', padrao: '#4F46E5', onde: 'CD Costura (remonta) · tag Etiqueta' },
  { token: '--set-embalagem', nome: 'CQ + Embalagem', grupo: 'Expedição', padrao: '#0F766E', onde: 'Portão do CQ (regra MARK42)' },
  { token: '--set-expedicao', nome: 'Expedição', grupo: 'Expedição', padrao: '#475569', onde: 'Despacho · Entregue' },
  { token: '--set-estoque', nome: 'Estoque', grupo: 'Gestão', padrao: '#9333EA', onde: 'Estoque · Ficha Técnica · avatar PJ do CRM' },
  { token: '--set-financeiro', nome: 'Financeiro', grupo: 'Gestão', padrao: '#15803D', onde: 'Financeiro · KPIs de recebimento' },
]
export const SETOR_GRUPOS = ['Atendimento', 'Produção', 'Expedição', 'Gestão']
/** paleta sugerida na aba de cores (tons que passam em contraste sobre branco) */
export const PALETA_SETOR = [
  '#C6161B', '#DB2777', '#BE185D', '#9333EA', '#7C3AED', '#4F46E5',
  '#2563EB', '#0284C7', '#0E7490', '#0F766E', '#047857', '#15803D',
  '#65A30D', '#CA8A04', '#B45309', '#C2410C', '#57534E', '#475569',
]
export const PAGAMENTOS = ['À vista', '50% sinal + saldo', '30/60', 'Pix', 'Cartão 3x', 'Boleto']

/* ---- tipos ---- */
export interface Cliente {
  id: number; nome: string; doc: string; contato: string; endereco: string; vendedor: string; segmento: string
  /* cadastro completo (CRM v4) — campos novos são opcionais p/ tolerância (mesmo espírito do .ft) */
  tipo?: 'PF' | 'PJ'          // pessoa física ou jurídica (define máscara/validação do doc)
  fantasia?: string           // nome fantasia (PJ)
  ie?: string                 // inscrição estadual (PJ) / RG (PF)
  email?: string
  cidade?: string             // cidade (ex.: Goiânia)
  uf?: string                 // estado (ex.: GO) — usado no casamento de frete
  cep?: string
  bairro?: string
  complemento?: string
  obs?: string
  criadoEm?: string           // ISO
  ativo?: boolean             // default true
  blingId?: string            // id do export Bling (referência)
  nascimento?: string         // data de nascimento (PF)
  tipoContato?: string        // 'Cliente' / 'Cliente;Fornecedor' etc (Bling)
}
/** cidade "Goiânia-GO" → { cidade:'Goiânia', uf:'GO' } (tolerante) */
export function cidadeUf(c: Cliente): { cidade: string; uf: string } {
  if (c.uf) return { cidade: c.cidade ?? '', uf: c.uf }
  const m = /^(.*?)[\s-]+([A-Za-z]{2})$/.exec((c.cidade ?? '').trim())
  return m ? { cidade: m[1].trim(), uf: m[2].toUpperCase() } : { cidade: c.cidade ?? '', uf: '' }
}
export const SEGMENTOS = ['Escola', 'Faculdade', 'Academia', 'Esporte', 'Comércio', 'Indústria', 'Igreja', 'Evento', 'Corporativo', 'Outro']
export interface BomItem { insumoId: number; qtd: number; un: string }
export interface Referencia { cod: string; nome: string; genero: string; design: TecnicaKey[]; bom: BomItem[] }
export interface Insumo { id: number; nome: string; tipo: string; un: string; saldo: number; minimo: number; custo: number }
export interface Tamanho { qtd: number; uni: number }
export interface DesignTag { tag: TecnicaKey; cores: string[] }
export interface Layout {
  refCod: string; ref: string; grade: 'adulto' | 'infantil'
  tecidos: string[]; cor: string; corHex: string
  design: DesignTag[]
  tamanhos: Record<string, Tamanho>
  img: string | null; obs: string; obsTags: string[]
  genero?: string
}
export const GENEROS = ['Masculino', 'Feminino', 'Infantil', 'Unissex']
export type Status = 'rascunho' | 'aprovado' | 'producao' | 'entregue'
/** anotação livre sobre a folha A4. x/y/w/h em fração (0..1) do documento. */
export interface Anotacao { id: string; tipo: 'circulo' | 'retangulo' | 'seta' | 'texto'; x: number; y: number; w: number; h: number; cor: string; texto?: string }
export const ANOT_CORES = ['#C6161B', '#2563EB', '#047857', '#EA580C', '#161A20']
export interface Pedido {
  pedido: string; clienteId: number | null; cliente: string; cpf: string; vendedor: string; contato: string; endereco?: string
  depto: string; embalagem: string; entrega: string; envio: string; pagamento: string; obs: string; obsTags?: string[]
  status: Status; aprovado: boolean; late?: boolean; layouts: Layout[]; anotacoes?: Anotacao[]
  criadoPor?: string; atualizadoEm?: string
}
export interface KCard {
  id: string; pedido: string; cliente: string; tec: TecnicaKey; station: string; prazo: string; late: boolean; val: number; artes: number
  lays: string[]   // quais layouts do pedido este departamento produz (L-01, L-03…) — a fatia MARK42
  pecas: number    // peças somadas dos layouts desta fatia
}
/** dd/mm/aaaa → timestamp p/ ordenação por entrega (datas inválidas vão pro fim) */
export function entregaTs(prazo: string): number {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((prazo ?? '').trim())
  return m ? new Date(+m[3], +m[2] - 1, +m[1]).getTime() : Number.MAX_SAFE_INTEGER
}

export interface Station { id: string; nome: string; lane: string }
/* Estações = colunas do Kanban de Produção, fiéis ao pipeline MARK42
   (MK-V-29/30): Preparo → faixas DTF/Silk/Subli (com etiquetas) →
   Corte a Laser → Acabamento → CD Costura → CQ → Despacho → Entregue. */
export const STATIONS: Station[] = [
  { id: 'corte', nome: 'Corte Manual', lane: '--set-corte' },
  { id: 'dtf_mont', nome: 'DTF Montagem', lane: '--set-dtf' },
  { id: 'dtf_imp', nome: 'DTF Impressão', lane: '--set-dtf' },
  { id: 'dtf_rec', nome: 'DTF Recorte', lane: '--set-dtf' },
  { id: 'dtf_prensa', nome: 'DTF Prensa', lane: '--set-dtf' },
  { id: 'dtf_etq', nome: 'Etiqueta DTF', lane: '--set-dtf' },
  { id: 'silk_mont', nome: 'Silk Montagem', lane: '--set-silk' },
  { id: 'silk_imp', nome: 'Silk Impressão / VEG', lane: '--set-silk' },
  { id: 'silk_tela', nome: 'Revelação de Tela', lane: '--set-silk' },
  { id: 'silk_etq', nome: 'Etiqueta Silk', lane: '--set-silk' },
  { id: 'silk_peca', nome: 'Silkar a Peça', lane: '--set-silk' },
  { id: 'sub_mont', nome: 'Subli Montagem', lane: '--set-sublimacao' },
  { id: 'sub_imp', nome: 'Subli Impressão', lane: '--set-sublimacao' },
  { id: 'sub_etq', nome: 'Etiqueta Sublimada', lane: '--set-sublimacao' },
  { id: 'sub_cal', nome: 'Calandra', lane: '--set-sublimacao' },
  { id: 'laser', nome: 'Corte a Laser', lane: '--set-corte' },
  { id: 'acab', nome: 'Acabamento · Patch/Bordado', lane: '--set-bordado' },
  { id: 'costura', nome: 'CD Costura (Remonta)', lane: '--set-costura' },
  { id: 'cq', nome: 'CQ + Embalagem', lane: '--set-embalagem' },
  { id: 'despacho', nome: 'Despacho', lane: '--set-expedicao' },
  { id: 'entregue', nome: 'Entregue', lane: '--set-expedicao' },
]

/* ---- dados mock ---- */
import { CLIENTES_BLING } from './clientesBling'
/* base de clientes = export real do Bling (1901). O CRM lê daqui. */
export const CLIENTES: Cliente[] = CLIENTES_BLING
export const INSUMOS: Insumo[] = [
  { id: 1, nome: 'Malha Dry-fit PET', tipo: 'Tecido', un: 'kg', saldo: 180, minimo: 60, custo: 38.0 },
  { id: 2, nome: 'Malha PV (Poliviscose)', tipo: 'Tecido', un: 'kg', saldo: 44, minimo: 50, custo: 32.5 },
  { id: 3, nome: 'Tinta DTF branca', tipo: 'Tinta', un: 'L', saldo: 12, minimo: 6, custo: 210.0 },
  { id: 4, nome: 'Tinta Sublimação (kit)', tipo: 'Tinta', un: 'L', saldo: 5, minimo: 8, custo: 180.0 },
  { id: 5, nome: 'Filme DTF', tipo: 'Insumo', un: 'm', saldo: 320, minimo: 100, custo: 4.2 },
  { id: 6, nome: 'Punho ribana', tipo: 'Aviamento', un: 'par', saldo: 640, minimo: 200, custo: 2.1 },
  { id: 7, nome: 'Gola careca', tipo: 'Aviamento', un: 'un', saldo: 410, minimo: 150, custo: 1.8 },
  { id: 8, nome: 'Elástico 3cm', tipo: 'Aviamento', un: 'm', saldo: 75, minimo: 120, custo: 0.9 },
  { id: 9, nome: 'Tela de silk 120 fios', tipo: 'Insumo', un: 'un', saldo: 18, minimo: 8, custo: 45.0 },
  { id: 10, nome: 'Linha costura (cone)', tipo: 'Aviamento', un: 'un', saldo: 96, minimo: 40, custo: 9.5 },
]
export const REFERENCIAS: Referencia[] = [
  { cod: 'REF-4021', nome: 'Camiseta dry-fit gola careca', genero: 'Masculino', design: ['DTF', 'Silk'], bom: [{ insumoId: 1, qtd: 0.22, un: 'kg' }, { insumoId: 7, qtd: 1, un: 'un' }, { insumoId: 10, qtd: 0.05, un: 'un' }] },
  { cod: 'REF-2087', nome: 'Uniforme sublimado manga curta', genero: 'Feminino', design: ['Subli'], bom: [{ insumoId: 1, qtd: 0.26, un: 'kg' }, { insumoId: 4, qtd: 0.02, un: 'L' }, { insumoId: 10, qtd: 0.06, un: 'un' }] },
  { cod: 'REF-1150', nome: 'Camiseta silk algodão', genero: 'Infantil', design: ['Silk'], bom: [{ insumoId: 2, qtd: 0.2, un: 'kg' }, { insumoId: 9, qtd: 0.02, un: 'un' }, { insumoId: 10, qtd: 0.04, un: 'un' }] },
  { cod: 'REF-3310', nome: 'Regata dry treino', genero: 'Masculino', design: ['DTF'], bom: [{ insumoId: 1, qtd: 0.18, un: 'kg' }, { insumoId: 8, qtd: 0.3, un: 'm' }, { insumoId: 10, qtd: 0.04, un: 'un' }] },
  { cod: 'REF-5502', nome: 'Polo piquet bordada', genero: 'Feminino', design: ['Bordado'], bom: [{ insumoId: 2, qtd: 0.24, un: 'kg' }, { insumoId: 7, qtd: 1, un: 'un' }, { insumoId: 6, qtd: 1, un: 'par' }] },
]

function dt(tag: TecnicaKey, cores: string[] = []): DesignTag { return { tag, cores } }
function L(o: Partial<Layout>): Layout {
  return { refCod: '', ref: 'Nova referência', grade: 'adulto', tecidos: [''], cor: '', corHex: '#98A3B0', design: [dt('DTF')], tamanhos: {}, img: null, obs: '', obsTags: [], ...o }
}
export function novoLayout(): Layout { return L({ tamanhos: { P: { qtd: 0, uni: 0 }, M: { qtd: 0, uni: 0 }, G: { qtd: 0, uni: 0 } } }) }

export const PEDIDOS_SEED: Pedido[] = [
  { pedido: 'PD003929', clienteId: 1, cliente: 'Escola João XXIII', cpf: '12.345.678/0001-11', vendedor: 'Henrique', contato: '(62) 99912-3421', depto: 'Uniformes', embalagem: 'Saco individual', entrega: '22/07/2026', envio: '', pagamento: '50% sinal + saldo', obs: 'Arte aprovada pelo cliente', status: 'rascunho', aprovado: false, criadoPor: 'Henrique', atualizadoEm: '2026-07-20T16:42:00',
    layouts: [L({ refCod: 'REF-4021', ref: 'Camiseta dry-fit gola careca', grade: 'adulto', tecidos: ['Dry-fit 100% poliéster', 'Ribana punho'], cor: 'Azul-marinho', corHex: '#12213F', design: [dt('DTF', ['017', '142']), dt('Silk')], tamanhos: { '10A': { qtd: 6, uni: 79.9 }, PP: { qtd: 4, uni: 89.9 }, M: { qtd: 10, uni: 89.9 }, G: { qtd: 8, uni: 89.9 } } })] },
  { pedido: 'PD003912', clienteId: 2, cliente: 'Time Vôlei Sub-15', cpf: '—', vendedor: 'Daniele', contato: '(62) 98110-7788', depto: 'Esporte', embalagem: 'Caixa', entrega: '14/07/2026', envio: '', pagamento: 'À vista', obs: '', status: 'producao', aprovado: true, late: true, criadoPor: 'Daniele', atualizadoEm: '2026-07-19T10:15:00',
    layouts: [L({ refCod: 'REF-2087', ref: 'Uniforme sublimado manga curta', grade: 'adulto', tecidos: ['Dry-fit PET'], cor: 'Full print', corHex: '#0E7490', design: [dt('Subli', ['S12', 'S40'])], tamanhos: { P: { qtd: 8, uni: 119.9 }, M: { qtd: 12, uni: 119.9 }, G: { qtd: 10, uni: 119.9 } } })] },
  { pedido: 'PD003940', clienteId: 4, cliente: 'Padaria Estrela', cpf: '33.111.222/0001-45', vendedor: 'Kevelin', contato: '(62) 99655-3030', depto: 'Comércio', embalagem: '', entrega: '25/07/2026', envio: '', pagamento: '50% sinal + saldo', obs: '', status: 'aprovado', aprovado: true, criadoPor: 'Kevelin', atualizadoEm: '2026-07-20T09:03:00',
    layouts: [L({ refCod: 'REF-1150', ref: 'Camiseta silk algodão', grade: 'adulto', tecidos: ['PV'], cor: 'Preto', corHex: '#1B1B1F', design: [dt('Silk')], tamanhos: { M: { qtd: 6, uni: 49.9 }, G: { qtd: 6, uni: 49.9 } } })] },
  { pedido: 'PD003944', clienteId: 3, cliente: 'Academia Pulse', cpf: '22.987.654/0001-90', vendedor: 'Henrique', contato: '(62) 99740-1122', depto: 'Academia', embalagem: '', entrega: '28/07/2026', envio: '', pagamento: 'À vista', obs: '', status: 'aprovado', aprovado: true, criadoPor: 'Henrique', atualizadoEm: '2026-07-18T14:30:00',
    layouts: [
      L({ refCod: 'REF-3310', ref: 'Regata dry treino', grade: 'adulto', tecidos: ['Dry-fit PET'], cor: 'Royal', corHex: '#2456C6', design: [dt('DTF', ['201'])], tamanhos: { P: { qtd: 10, uni: 69.9 }, M: { qtd: 14, uni: 69.9 }, G: { qtd: 8, uni: 69.9 } } }),
      L({ refCod: 'REF-5502', ref: 'Polo piquet bordada', grade: 'adulto', tecidos: ['Piquet'], cor: 'Marinho', corHex: '#12213F', design: [dt('Bordado')], tamanhos: { M: { qtd: 6, uni: 98.0 }, G: { qtd: 6, uni: 98.0 } } }),
    ] },
  /* ---- pedido GRANDE de teste: 12 layouts, com imagens reais em alguns ---- */
  { pedido: 'PD003950', clienteId: 2, cliente: 'SMELJ Vôlei · Caldas Novas', cpf: '—', vendedor: 'Daniele', contato: '(64) 99988-2100', depto: 'Esporte', embalagem: 'Saco individual', entrega: '30/07/2026', envio: '', pagamento: '50% sinal + saldo', obs: 'Coleção completa 2026 — conferir numeração', obsTags: [], status: 'producao', aprovado: true, criadoPor: 'Daniele', atualizadoEm: '2026-07-22T11:00:00',
    layouts: [
      L({ refCod: 'FT-020-002M', ref: 'Jogo Vôlei Azul (frente/costas)', grade: 'adulto', genero: 'Masculino', tecidos: ['Dry-fit PET'], cor: 'Azul-marinho', corHex: '#12213F', design: [dt('Subli', ['S79', 'S64'])], img: SMELJ_NAVY, tamanhos: { P: { qtd: 4, uni: 129.9 }, M: { qtd: 8, uni: 129.9 }, G: { qtd: 6, uni: 129.9 }, GG: { qtd: 2, uni: 129.9 } } }),
      L({ refCod: 'FT-020-002M', ref: 'Jogo Vôlei Preto (frente/costas)', grade: 'adulto', genero: 'Masculino', tecidos: ['Dry-fit PET'], cor: 'Preto', corHex: '#1B1B1F', design: [dt('Subli', ['S03', 'S64'])], img: SMELJ_BLACK, tamanhos: { P: { qtd: 4, uni: 129.9 }, M: { qtd: 8, uni: 129.9 }, G: { qtd: 6, uni: 129.9 } } }),
      L({ refCod: 'REF-4021', ref: 'Camiseta comissão DTF', grade: 'adulto', genero: 'Masculino', tecidos: ['Dry-fit 100% poliéster'], cor: 'Preto', corHex: '#1B1B1F', design: [dt('DTF', ['001', '235'])], tamanhos: { M: { qtd: 5, uni: 69.9 }, G: { qtd: 5, uni: 69.9 } } }),
      L({ refCod: 'FT-010-011M', ref: 'Polo staff 3A Consultoria', grade: 'adulto', tecidos: ['Piquet'], cor: 'Verde bandeira', corHex: '#0B7A3B', design: [dt('Silk'), dt('Bordado')], img: POLO_3A, tamanhos: { P: { qtd: 3, uni: 89.9 }, M: { qtd: 6, uni: 89.9 }, G: { qtd: 6, uni: 89.9 }, GG: { qtd: 3, uni: 89.9 } } }),
      L({ refCod: 'REF-1150', ref: 'Camiseta torcida silk', grade: 'adulto', tecidos: ['Algodão penteado 30.1'], cor: 'Branco', corHex: '#F3F4F6', design: [dt('Silk')], tamanhos: { M: { qtd: 10, uni: 39.9 }, G: { qtd: 10, uni: 39.9 }, GG: { qtd: 5, uni: 39.9 } } }),
      L({ refCod: 'FT-010-000M', ref: 'Camiseta 3B Cross', grade: 'adulto', genero: 'Masculino', tecidos: ['Poliéster'], cor: 'Preto', corHex: '#1B1B1F', design: [dt('DTF', ['001'])], img: CROSS_3B, tamanhos: { P: { qtd: 4, uni: 59.9 }, M: { qtd: 8, uni: 59.9 }, G: { qtd: 8, uni: 59.9 }, GG: { qtd: 4, uni: 59.9 } } }),
      L({ refCod: 'REF-3310', ref: 'Regata treino sublimada', grade: 'adulto', genero: 'Masculino', tecidos: ['Dry-fit PET'], cor: 'Royal', corHex: '#2456C6', design: [dt('Subli', ['S73'])], tamanhos: { M: { qtd: 6, uni: 79.9 }, G: { qtd: 6, uni: 79.9 } } }),
      L({ refCod: 'REF-2087', ref: 'Uniforme infantil sublimado', grade: 'infantil', genero: 'Infantil', tecidos: ['Dry-fit PET'], cor: 'Azul-marinho', corHex: '#12213F', design: [dt('Subli', ['S79'])], tamanhos: { '8A': { qtd: 4, uni: 99.9 }, '10A': { qtd: 6, uni: 99.9 }, '12A': { qtd: 4, uni: 99.9 } } }),
      L({ refCod: 'REF-5502', ref: 'Polo comissão bordada', grade: 'adulto', tecidos: ['Piquet'], cor: 'Grafite', corHex: '#3A3F47', design: [dt('Bordado')], tamanhos: { M: { qtd: 4, uni: 98.0 }, G: { qtd: 4, uni: 98.0 } } }),
      L({ refCod: 'REF-4021', ref: 'Camiseta patch aplicado', grade: 'adulto', genero: 'Feminino', tecidos: ['Dry-fit 100% poliéster'], cor: 'Rosa pink', corHex: '#DB2777', design: [dt('DTF', ['125']), dt('Patch')], tamanhos: { P: { qtd: 6, uni: 74.9 }, M: { qtd: 6, uni: 74.9 } } }),
      L({ refCod: 'REF-1150', ref: 'Camiseta staff silk', grade: 'adulto', tecidos: ['Algodão penteado 30.1'], cor: 'Vermelho Fourtime', corHex: '#C6161B', design: [dt('Silk')], tamanhos: { G: { qtd: 8, uni: 44.9 }, GG: { qtd: 4, uni: 44.9 } } }),
      L({ refCod: 'REF-3310', ref: 'Regata feminina DTF', grade: 'adulto', genero: 'Feminino', tecidos: ['Dry-fit PET'], cor: 'Roxo', corHex: '#6D28D9', design: [dt('DTF', ['098'])], tamanhos: { P: { qtd: 5, uni: 69.9 }, M: { qtd: 7, uni: 69.9 } } }),
    ] },
  /* ---- +16 pedidos de teste (total 20) — gerados de forma determinística ---- */
  ...(() => {
    const CLI: [number, string, string, string, string][] = [
      [1, 'Escola João XXIII', '12.345.678/0001-11', '(62) 99912-3421', 'Henrique'],
      [2, 'Time Vôlei Sub-15', '—', '(62) 98110-7788', 'Daniele'],
      [3, 'Academia Pulse', '22.987.654/0001-90', '(62) 99740-1122', 'Henrique'],
      [4, 'Padaria Estrela', '33.111.222/0001-45', '(62) 99655-3030', 'Kevelin'],
      [5, 'Auto Peças Silva', '44.222.333/0001-70', '(62) 99333-8080', 'Daniele'],
      [6, 'Faculdade Sigma', '55.444.555/0001-32', '(62) 98800-4545', 'Henrique'],
    ]
    const REFS: [string, string, string, string][] = [
      ['REF-4021', 'Camiseta dry-fit gola careca', 'Dry-fit 100% poliéster', 'Royal'],
      ['REF-2087', 'Uniforme sublimado manga curta', 'Dry-fit PET', 'Full print'],
      ['REF-1150', 'Camiseta silk algodão', 'Algodão penteado 30.1', 'Preto'],
      ['REF-3310', 'Regata dry treino', 'Dry-fit PET', 'Grafite'],
      ['REF-5502', 'Polo piquet bordada', 'Piquet', 'Azul-marinho'],
    ]
    const DESIGNS: DesignTag[][] = [
      [dt('DTF', ['012', '152'])], [dt('Subli', ['S17'])], [dt('Silk')], [dt('DTF', ['054']), dt('Bordado')],
      [dt('Subli', ['S23', 'S77']), dt('Patch')], [dt('Silk'), dt('DTF', ['188'])], [dt('DTF', ['235'])], [dt('Subli', ['S36'])],
    ]
    /* entregas em volta de 24/07/2026 — as anteriores ficam atrasadas */
    const DATAS = ['18/07/2026', '21/07/2026', '23/07/2026', '24/07/2026', '27/07/2026', '29/07/2026', '31/07/2026', '03/08/2026', '05/08/2026', '08/08/2026', '11/08/2026', '14/08/2026', '17/08/2026', '20/08/2026', '24/08/2026', '28/08/2026']
    const HOJE = entregaTs('24/07/2026')
    return DATAS.map((entrega, i) => {
      const c = CLI[i % CLI.length]
      const late = entregaTs(entrega) < HOJE
      const nLay = 1 + (i % 2)
      const layouts: Layout[] = Array.from({ length: nLay }, (_, li) => {
        const r = REFS[(i + li) % REFS.length]
        return L({
          refCod: r[0], ref: r[1], grade: 'adulto', tecidos: [r[2]], cor: r[3], corHex: corHexPorNome(r[3]),
          design: DESIGNS[(i * 2 + li) % DESIGNS.length].map(d => ({ ...d, cores: [...d.cores] })),
          tamanhos: { P: { qtd: 4 + (i % 5), uni: 59.9 + (i % 4) * 10 }, M: { qtd: 6 + (i % 6), uni: 59.9 + (i % 4) * 10 }, G: { qtd: 4 + (i % 4), uni: 59.9 + (i % 4) * 10 } },
        })
      })
      return {
        pedido: 'PD00' + (3860 + i * 3), clienteId: c[0], cliente: c[1], cpf: c[2], vendedor: c[4], contato: c[3],
        depto: ['Uniformes', 'Esporte', 'Academia', 'Comércio'][i % 4], embalagem: i % 3 === 0 ? 'Saco individual' : '', entrega, envio: '',
        pagamento: i % 2 ? 'À vista' : '50% sinal + saldo', obs: '', obsTags: [], status: 'producao', aprovado: true,
        late, criadoPor: c[4], atualizadoEm: '2026-07-2' + (i % 4) + 'T10:00:00', layouts,
      } as Pedido
    })
  })(),
]

/* ---- helpers de negócio ---- */
export function layoutPecas(l: Layout) { return Object.values(l.tamanhos).reduce((s, t) => s + t.qtd, 0) }
export function layoutValor(l: Layout) { return Object.values(l.tamanhos).reduce((s, t) => s + t.qtd * t.uni, 0) }
export function pedTotais(p: Pedido) {
  let pecas = 0, valor = 0
  p.layouts.forEach(l => Object.values(l.tamanhos).forEach(t => { pecas += t.qtd; valor += t.qtd * t.uni }))
  return { pecas, valor }
}
export function pedTecnicas(p: Pedido): TecnicaKey[] {
  const s = new Set<TecnicaKey>()
  p.layouts.forEach(l => l.design.forEach(d => { if (TECNICAS[d.tag] && TECNICAS[d.tag].entry) s.add(d.tag) }))
  return [...s]
}
/** ordem de linhas da tabela: base = grade atual; cruzadas (com qtd) no topo (adulto) ou fim (infantil) */
export function ordemTamanhos(l: Layout): string[] {
  const base = l.grade === 'adulto' ? TAM_ADULTO : TAM_INFANTIL
  const cross = (l.grade === 'adulto' ? TAM_INFANTIL : TAM_ADULTO).filter(t => (l.tamanhos[t]?.qtd ?? 0) > 0 || l.tamanhos[t] !== undefined)
  return l.grade === 'adulto' ? [...cross, ...base] : [...base, ...cross]
}
/** validação antes de aprovar/imprimir (v172 §20): Ref, Tecido, Cor, Design por layout + Departamento */
export function validarPedido(p: Pedido): string[] {
  const errs: string[] = []
  if (!p.depto.trim()) errs.push('Departamento (cabeçalho)')
  p.layouts.forEach((l, i) => {
    const n = 'L-' + String(i + 1).padStart(2, '0')
    if (!l.ref.trim() || l.ref === 'Nova referência') errs.push('Referência (' + n + ')')
    if (!l.tecidos.some(t => t.trim())) errs.push('Tecido (' + n + ')')
    if (!l.cor.trim()) errs.push('Cor (' + n + ')')
    if (!l.design.length) errs.push('Design (' + n + ')')
  })
  return errs
}
export function insumoNome(id: number) { return INSUMOS.find(i => i.id === id)?.nome ?? '?' }
export function bomCusto(r: Referencia) { return r.bom.reduce((s, b) => { const i = INSUMOS.find(x => x.id === b.insumoId); return s + (i ? i.custo * b.qtd : 0) }, 0) }
export function money(v: number) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
export function moneyK(v: number) { return v >= 1000 ? 'R$ ' + (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : 'R$ ' + money(v) }
