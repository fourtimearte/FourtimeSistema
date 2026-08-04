#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FOURTIME — Relatório do banco (modo LEITURA)
============================================

Levanta, com número, tudo o que precisa ser decidido antes de migrar o
cadastro e os orçamentos para o Postgres do CRM V6.

ESTE SCRIPT NÃO ESCREVE NADA. Só faz requisições GET e grava arquivos de
saída na pasta local que você indicar. Nada é alterado no Drive, no
servidor, no editor ou no banco.

O que ele responde
------------------
  1. Quantos itens existem por categoria no fourtime-banco.json
  2. Quantas COLISÕES DE CHAVE existem — o problema central da migração,
     já que a chave de mesclagem hoje é o NOME em maiúsculas
  3. Quantas lápides (_removidos) precisam virar deleted_at
  4. Que campos cada categoria realmente usa (esboço do schema Postgres)
  5. Quantos .ft existem, como estão distribuídos e quanto pesam
  6. Numa amostra de .ft: versões do formato, imagens em base64,
     e quais tags HTML aparecem em obs/anotacoes

Uso
---
  # pelo servidor (o caminho normal)
  python relatorio_banco.py --url https://SEU-SERVIDOR --token SEU_FT_TOKEN

  # a partir de arquivos que você já baixou
  python relatorio_banco.py --banco ./fourtime-banco.json --pasta-ft ./orcamentos

  # amostra maior de .ft (padrão 40; use 0 para abrir todos)
  python relatorio_banco.py --url ... --token ... --amostra 150

Saídas (na pasta -o, padrão ./saida-relatorio)
  relatorio.md         leitura humana — é o que você lê
  ambiguidades.csv     os casos que PRECISAM da sua decisão
  relatorio.json       os mesmos dados, para o importador consumir depois

Requer apenas Python 3.8+. Sem dependências externas.
"""

import argparse
import base64
import csv
import json
import os
import re
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone

LAPIDES = "_removidos"


# ---------------------------------------------------------------------------
# Chaves: reproduz a lógica do servidor e mostra onde ela machuca
# ---------------------------------------------------------------------------

def chave_servidor(item):
    """EXATAMENTE o _chave() do server.py. É esta a chave que o banco usa hoje."""
    if isinstance(item, dict):
        return str(item.get("n", "")).strip().upper()
    return str(item).strip().upper()


def chave_normalizada(k):
    """Sem acento, sem pontuação, espaços colapsados.

    Serve para achar itens que o servidor trata como DIFERENTES mas que
    são, quase certamente, a mesma coisa: 'JOÃO' vs 'JOAO', 'ACME LTDA'
    vs 'ACME  LTDA.', 'MALHA PV' vs 'Malha PV'.
    """
    s = unicodedata.normalize("NFKD", k)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^\w\s]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip().upper()


# ---------------------------------------------------------------------------
# Acesso ao servidor — só GET
# ---------------------------------------------------------------------------

class Servidor:
    def __init__(self, url, token, timeout=60):
        self.url = url.rstrip("/")
        self.token = token
        self.timeout = timeout

    def get(self, caminho, params=None):
        u = self.url + caminho
        if params:
            u += "?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(u, headers={"X-FT-Token": self.token})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            corpo = e.read().decode("utf-8", "ignore")[:300]
            raise SystemExit(
                "\nERRO %s em %s\n%s\n\n"
                "401 costuma ser token errado. 404, URL errada.\n"
                % (e.code, caminho, corpo)
            )
        except Exception as e:
            raise SystemExit("\nNão consegui falar com %s: %r\n" % (u, e))


def coleta_ft_do_servidor(srv, limite_listagem=5000):
    """Anda pela árvore de pastas de orçamentos coletando os .ft.

    Só usa /api/ft/listar, que já devolve nome, tamanho e data — ou seja,
    dá para medir o acervo inteiro SEM baixar nenhum arquivo.
    """
    achados = []
    pilha = [("", "raiz")]
    vistas = set()
    while pilha and len(achados) < limite_listagem:
        pid, caminho = pilha.pop()
        if pid in vistas:
            continue
        vistas.add(pid)
        r = srv.get("/api/ft/listar", {"pasta": pid} if pid else None)
        for a in r.get("arquivos", []):
            a["caminho"] = caminho
            achados.append(a)
        for p in r.get("pastas", []):
            pilha.append((p["id"], caminho + "/" + p["nome"]))
    return achados


# ---------------------------------------------------------------------------
# Análise do cadastro (fourtime-banco.json)
# ---------------------------------------------------------------------------

def analisa_cadastro(data):
    rel = {
        "categorias": {},
        "lapides": {},
        "totais": {"itens": 0, "categorias": 0, "lapides": 0},
        "ambiguidades": [],
    }

    lapides = data.get(LAPIDES) or {}
    for cat, marcas in lapides.items():
        if not isinstance(marcas, dict):
            continue
        datas = [v for v in marcas.values() if isinstance(v, str) and v]
        rel["lapides"][cat] = {
            "quantidade": len(marcas),
            "mais_antiga": min(datas) if datas else "",
            "mais_recente": max(datas) if datas else "",
        }
        rel["totais"]["lapides"] += len(marcas)

    for cat, itens in data.items():
        if cat == LAPIDES:
            continue
        if not isinstance(itens, list):
            rel["categorias"][cat] = {
                "tipo": "escalar",
                "valor_resumo": str(itens)[:120],
            }
            continue

        chaves = [chave_servidor(it) for it in itens]
        vazias = sum(1 for k in chaves if not k)
        dup_exatas = {k: c for k, c in Counter(k for k in chaves if k).items() if c > 1}

        # itens que o servidor vê como distintos mas que normalizam igual
        por_norm = defaultdict(list)
        for k in chaves:
            if k:
                por_norm[chave_normalizada(k)].append(k)
        quase_iguais = {
            n: sorted(set(ks)) for n, ks in por_norm.items() if len(set(ks)) > 1
        }

        # esboço do schema: que campos aparecem, e em quantos itens
        campos = Counter()
        tipos_valor = defaultdict(Counter)
        dicts = 0
        for it in itens:
            if isinstance(it, dict):
                dicts += 1
                for c, v in it.items():
                    campos[c] += 1
                    tipos_valor[c][type(v).__name__] += 1

        rel["categorias"][cat] = {
            "tipo": "lista",
            "itens": len(itens),
            "itens_dict": dicts,
            "itens_texto": len(itens) - dicts,
            "chaves_vazias": vazias,
            "duplicatas_exatas": len(dup_exatas),
            "duplicatas_exatas_exemplos": dict(list(dup_exatas.items())[:10]),
            "colisoes_normalizadas": len(quase_iguais),
            "campos": {
                c: {
                    "presente_em": n,
                    "cobertura_pct": round(100.0 * n / dicts, 1) if dicts else 0.0,
                    "tipos": dict(tipos_valor[c]),
                }
                for c, n in campos.most_common()
            },
        }
        rel["totais"]["itens"] += len(itens)

        # ambiguidades: é isto que vira a planilha de decisão
        for k, c in sorted(dup_exatas.items()):
            rel["ambiguidades"].append({
                "categoria": cat,
                "tipo": "duplicata exata",
                "chave": k,
                "detalhe": "%d itens com a mesma chave — já estão fundidos hoje" % c,
                "risco": "ALTO" if cat.lower().startswith("cli") else "MEDIO",
            })
        for n, ks in sorted(quase_iguais.items()):
            rel["ambiguidades"].append({
                "categoria": cat,
                "tipo": "quase iguais",
                "chave": " | ".join(ks),
                "detalhe": "registros separados hoje; normalizados viram '%s'" % n,
                "risco": "ALTO" if cat.lower().startswith("cli") else "MEDIO",
            })
        if vazias:
            rel["ambiguidades"].append({
                "categoria": cat,
                "tipo": "chave vazia",
                "chave": "(vazio)",
                "detalhe": "%d itens sem nome — o servidor os IGNORA na mesclagem" % vazias,
                "risco": "ALTO",
            })

        # lápide cuja chave voltou a existir: sintoma de ressurreição
        enterradas = set((lapides.get(cat) or {}).keys())
        vivos = set(k for k in chaves if k)
        voltaram = sorted(enterradas & vivos)
        for k in voltaram:
            rel["ambiguidades"].append({
                "categoria": cat,
                "tipo": "lapide viva",
                "chave": k,
                "detalhe": "está em _removidos E na lista — conferir qual vale",
                "risco": "ALTO",
            })

    rel["totais"]["categorias"] = len(rel["categorias"])
    return rel


# ---------------------------------------------------------------------------
# Análise dos orçamentos (.ft)
# ---------------------------------------------------------------------------

TAG_HTML = re.compile(r"<\s*([a-zA-Z][a-zA-Z0-9]*)")


def percentil(vals, p):
    if not vals:
        return 0
    vs = sorted(vals)
    i = int(round((p / 100.0) * (len(vs) - 1)))
    return vs[i]


def analisa_ft_listagem(arquivos):
    tam = [int(a.get("tamanho") or 0) for a in arquivos]
    por_caminho = Counter(a.get("caminho", "?") for a in arquivos)
    maiores = sorted(arquivos, key=lambda a: int(a.get("tamanho") or 0), reverse=True)[:10]
    return {
        "total": len(arquivos),
        "bytes_total": sum(tam),
        "bytes_mediana": percentil(tam, 50),
        "bytes_p95": percentil(tam, 95),
        "bytes_maior": max(tam) if tam else 0,
        "por_pasta": dict(por_caminho.most_common(40)),
        "maiores": [
            {"nome": a["nome"], "bytes": int(a.get("tamanho") or 0),
             "caminho": a.get("caminho", "")}
            for a in maiores
        ],
    }


def analisa_ft_conteudo(docs):
    """docs: lista de (nome, dict_do_ft). Amostra aberta de verdade."""
    r = {
        "amostrados": len(docs),
        "versoes_formato": Counter(),
        "layouts_por_doc": [],
        "docs_com_imagem": 0,
        "imagens_total": 0,
        "bytes_base64_total": 0,
        "maior_imagem_bytes": 0,
        "docs_com_obs_html": 0,
        "docs_com_anotacoes_html": 0,
        "tags_html": Counter(),
        "campos_header": Counter(),
        "falhas": [],
    }
    for nome, d in docs:
        if not isinstance(d, dict):
            r["falhas"].append({"nome": nome, "motivo": "não é objeto JSON"})
            continue
        r["versoes_formato"][str(d.get("_versao", "ausente"))] += 1

        for c in (d.get("header") or {}):
            r["campos_header"][c] += 1

        layouts = d.get("layouts") or []
        r["layouts_por_doc"].append(len(layouts))
        tem_img = False
        for lay in layouts:
            if not isinstance(lay, dict):
                continue
            img = lay.get("img")
            if isinstance(img, str) and img.startswith("data:"):
                tem_img = True
                r["imagens_total"] += 1
                b64 = img.split(",", 1)[-1]
                try:
                    n = len(base64.b64decode(b64, validate=False))
                except Exception:
                    n = len(b64) * 3 // 4
                r["bytes_base64_total"] += n
                r["maior_imagem_bytes"] = max(r["maior_imagem_bytes"], n)
            obs = lay.get("obs")
            if isinstance(obs, str) and "<" in obs:
                r["docs_com_obs_html"] += 1
                for t in TAG_HTML.findall(obs):
                    r["tags_html"][t.lower()] += 1
        if tem_img:
            r["docs_com_imagem"] += 1

        for an in (d.get("anotacoes") or []):
            if isinstance(an, str) and "<" in an:
                r["docs_com_anotacoes_html"] += 1
                for t in TAG_HTML.findall(an):
                    r["tags_html"][t.lower()] += 1

    lp = r["layouts_por_doc"]
    r["layouts_media"] = round(sum(lp) / len(lp), 1) if lp else 0
    r["layouts_max"] = max(lp) if lp else 0
    r["versoes_formato"] = dict(r["versoes_formato"])
    r["tags_html"] = dict(r["tags_html"].most_common(30))
    r["campos_header"] = dict(r["campos_header"].most_common(50))
    del r["layouts_por_doc"]
    return r


# ---------------------------------------------------------------------------
# Escrita do relatório
# ---------------------------------------------------------------------------

def mb(n):
    return "%.1f MB" % (n / 1048576.0)


def kb(n):
    return "%.0f KB" % (n / 1024.0)


def escreve_markdown(rel, destino):
    L = []
    a = L.append
    a("# Relatório do banco — Fourtime\n")
    a("Gerado em %s · **nada foi alterado** (só leitura).\n"
      % datetime.now(timezone.utc).astimezone().strftime("%d/%m/%Y %H:%M"))

    ctx = rel.get("contexto", {})
    if ctx:
        a("\n## Contexto\n")
        for k, v in ctx.items():
            a("- **%s:** %s" % (k, v))
        a("")

    cad = rel.get("cadastro")
    if cad:
        t = cad["totais"]
        a("\n## 1. Cadastro (fourtime-banco.json)\n")
        a("**%d itens** em **%d categorias**, mais **%d lápides**.\n"
          % (t["itens"], t["categorias"], t["lapides"]))
        a("| Categoria | Itens | Chave vazia | Duplicata exata | Quase iguais |")
        a("|---|--:|--:|--:|--:|")
        for cat, c in sorted(cad["categorias"].items()):
            if c.get("tipo") != "lista":
                continue
            a("| %s | %d | %d | %d | %d |" % (
                cat, c["itens"], c["chaves_vazias"],
                c["duplicatas_exatas"], c["colisoes_normalizadas"]))
        a("")
        a("> **Como ler:** a chave de mesclagem do servidor é o NOME em maiúsculas. ")
        a("> *Duplicata exata* = itens já fundidos hoje, sem volta pelo arquivo. ")
        a("> *Quase iguais* = registros hoje SEPARADOS que provavelmente são o mesmo ")
        a("> (diferem só por acento, caixa ou pontuação) — são os que você precisa decidir.\n")

        if cad["lapides"]:
            a("\n### Lápides (`_removidos`)\n")
            a("Precisam virar `deleted_at` no Postgres. Se forem descartadas e o ")
            a("editor sincronizar depois, os itens **ressuscitam**.\n")
            a("| Categoria | Quantas | Mais antiga | Mais recente |")
            a("|---|--:|---|---|")
            for cat, l in sorted(cad["lapides"].items()):
                a("| %s | %d | %s | %s |" % (
                    cat, l["quantidade"], l["mais_antiga"][:10], l["mais_recente"][:10]))
            a("")

        a("\n### Esboço de schema por categoria\n")
        a("Cobertura baixa num campo quer dizer coluna opcional (ou lixo herdado).\n")
        for cat, c in sorted(cad["categorias"].items()):
            if c.get("tipo") != "lista" or not c.get("campos"):
                continue
            a("\n**%s** — %d itens (%d objetos, %d texto puro)"
              % (cat, c["itens"], c["itens_dict"], c["itens_texto"]))
            a("")
            a("| Campo | Presente em | Cobertura | Tipos |")
            a("|---|--:|--:|---|")
            for campo, info in list(c["campos"].items())[:25]:
                a("| `%s` | %d | %.0f%% | %s |" % (
                    campo, info["presente_em"], info["cobertura_pct"],
                    ", ".join(info["tipos"].keys())))
            a("")

    ft = rel.get("ft_listagem")
    if ft:
        a("\n## 2. Orçamentos (.ft)\n")
        a("**%d arquivos**, %s no total. Mediana %s · p95 %s · maior %s.\n"
          % (ft["total"], mb(ft["bytes_total"]), kb(ft["bytes_mediana"]),
             kb(ft["bytes_p95"]), mb(ft["bytes_maior"])))
        a("| Pasta | Arquivos |")
        a("|---|--:|")
        for p, n in ft["por_pasta"].items():
            a("| %s | %d |" % (p, n))
        a("")
        a("\n**Os 10 maiores** — são estes que definem se vale extrair as imagens:\n")
        a("| Arquivo | Tamanho | Pasta |")
        a("|---|--:|---|")
        for m in ft["maiores"]:
            a("| %s | %s | %s |" % (m["nome"], kb(m["bytes"]), m["caminho"]))
        a("")

    ct = rel.get("ft_conteudo")
    if ct:
        a("\n## 3. Dentro dos .ft (amostra de %d)\n" % ct["amostrados"])
        a("- Versões do formato: %s" % json.dumps(ct["versoes_formato"], ensure_ascii=False))
        a("- Layouts por orçamento: média %.1f, máximo %d" % (ct["layouts_media"], ct["layouts_max"]))
        a("- Orçamentos com imagem: **%d de %d**" % (ct["docs_com_imagem"], ct["amostrados"]))
        a("- Imagens base64 na amostra: %d, somando %s (maior: %s)"
          % (ct["imagens_total"], mb(ct["bytes_base64_total"]), kb(ct["maior_imagem_bytes"])))
        a("- Layouts com HTML em `obs`: %d · folhas de `anotacoes` com HTML: %d"
          % (ct["docs_com_obs_html"], ct["docs_com_anotacoes_html"]))
        if ct["tags_html"]:
            a("\n### Tags HTML encontradas\n")
            a("É esta a lista que a sanitização precisa permitir e que o contêiner ")
            a("de prosa do V6 precisa estilizar — o CSS antigo não vai junto.\n")
            a("| Tag | Ocorrências |")
            a("|---|--:|")
            for t, n in ct["tags_html"].items():
                a("| `<%s>` | %d |" % (t, n))
            a("")
        if ct["falhas"]:
            a("\n### Arquivos que não abriram\n")
            for f in ct["falhas"]:
                a("- `%s` — %s" % (f["nome"], f["motivo"]))
            a("")

    amb = (cad or {}).get("ambiguidades", []) if cad else []
    a("\n## 4. O que precisa da sua decisão\n")
    if not amb:
        a("Nenhuma ambiguidade encontrada. A importação pode cunhar os UUIDs "
          "direto, sem risco de fundir registros diferentes.\n")
    else:
        altos = [x for x in amb if x["risco"] == "ALTO"]
        a("**%d casos** no total, sendo **%d de risco alto**. "
          "A lista completa está em `ambiguidades.csv` — abra no Excel, "
          "decida cada linha, e o importador segue a sua decisão.\n"
          % (len(amb), len(altos)))
        a("Amostra dos 15 primeiros de risco alto:\n")
        a("| Categoria | Tipo | Chave | Detalhe |")
        a("|---|---|---|---|")
        for x in altos[:15]:
            a("| %s | %s | %s | %s |" % (
                x["categoria"], x["tipo"], x["chave"][:60], x["detalhe"]))
        a("")

    a("\n## 5. Próximos passos\n")
    a("1. Você revisa `ambiguidades.csv` e decide os casos de risco alto.")
    a("2. O importador cunha um UUID por item e **nunca mais** chaveia por nome.")
    a("3. Lápides entram como `deleted_at`, não são descartadas.")
    a("4. Imagens base64 saem para armazenamento de objetos — **sem alterar o "
      "`.ft` original no Drive**, que continua auto-contido pelo contrato.")
    a("5. O `/api/db` do `server.py` vira projeção do Postgres. O editor não muda.\n")

    with open(destino, "w", encoding="utf-8") as f:
        f.write("\n".join(L))


def escreve_csv(amb, destino):
    with open(destino, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["risco", "categoria", "tipo", "chave", "detalhe", "DECISAO (preencher)"])
        for x in sorted(amb, key=lambda y: (y["risco"] != "ALTO", y["categoria"])):
            w.writerow([x["risco"], x["categoria"], x["tipo"], x["chave"], x["detalhe"], ""])


# ---------------------------------------------------------------------------

def main():
    p = argparse.ArgumentParser(
        description="Relatório de leitura do banco Fourtime (não altera nada).")
    p.add_argument("--url", help="URL do servidor, ex: https://fourtime.onrender.com")
    p.add_argument("--token", help="FT_TOKEN")
    p.add_argument("--banco", help="caminho local do fourtime-banco.json")
    p.add_argument("--pasta-ft", help="pasta local com arquivos .ft")
    p.add_argument("--amostra", type=int, default=40,
                   help="quantos .ft abrir de verdade (0 = todos). Padrão 40.")
    p.add_argument("-o", "--saida", default="./saida-relatorio")
    args = p.parse_args()

    if not (args.url or args.banco or args.pasta_ft):
        p.error("informe --url + --token, ou --banco / --pasta-ft")

    os.makedirs(args.saida, exist_ok=True)
    rel = {"contexto": {}}

    # ---- cadastro ----
    data = None
    if args.url:
        if not args.token:
            p.error("--url exige --token")
        srv = Servidor(args.url, args.token)
        print("→ /api/ping")
        srv.get("/api/ping")
        try:
            v = srv.get("/api/versao")
            rel["contexto"]["editor publicado"] = "v%s (%s)" % (v.get("editor"), v.get("arquivo"))
            rel["contexto"]["versão mínima para gravar"] = v.get("minimo")
        except SystemExit:
            pass
        print("→ /api/db")
        d = srv.get("/api/db")
        data = d.get("data") or {}
        rel["contexto"]["revisão do banco"] = d.get("rev")
        rel["contexto"]["atualizado em"] = d.get("atualizado")
        rel["contexto"]["onde o banco mora"] = d.get("onde")
        if d.get("onde", "").startswith("sqlite"):
            rel["contexto"]["ATENÇÃO"] = (
                "o banco está no disco EFÊMERO do Render — some a cada deploy")
    elif args.banco:
        with open(args.banco, encoding="utf-8") as f:
            bruto = json.load(f)
        data = bruto.get("data", bruto)
        rel["contexto"]["revisão do banco"] = bruto.get("rev", "?")
        rel["contexto"]["origem"] = args.banco

    if data is not None:
        print("→ analisando cadastro (%d categorias)" % len(data))
        rel["cadastro"] = analisa_cadastro(data)

    # ---- orçamentos ----
    arquivos, docs = [], []
    if args.url:
        print("→ listando .ft (sem baixar)")
        srv = Servidor(args.url, args.token)
        try:
            arquivos = coleta_ft_do_servidor(srv)
        except SystemExit as e:
            print("  aviso: não consegui listar os .ft (%s)" % e)
        if arquivos:
            rel["ft_listagem"] = analisa_ft_listagem(arquivos)
            n = len(arquivos) if args.amostra == 0 else min(args.amostra, len(arquivos))
            if n:
                passo = max(1, len(arquivos) // n)
                alvos = arquivos[::passo][:n]
                print("→ abrindo amostra de %d .ft" % len(alvos))
                for i, a in enumerate(alvos, 1):
                    try:
                        r = srv.get("/api/ft/abrir/" + a["id"])
                        docs.append((a["nome"], r.get("conteudo")))
                    except SystemExit:
                        docs.append((a["nome"], None))
                    if i % 10 == 0:
                        print("   %d/%d" % (i, len(alvos)))
    elif args.pasta_ft:
        for raiz, _, nomes in os.walk(args.pasta_ft):
            for nome in nomes:
                if not nome.lower().endswith(".ft"):
                    continue
                cam = os.path.join(raiz, nome)
                arquivos.append({
                    "nome": nome, "id": cam, "tamanho": os.path.getsize(cam),
                    "caminho": os.path.relpath(raiz, args.pasta_ft),
                })
        if arquivos:
            rel["ft_listagem"] = analisa_ft_listagem(arquivos)
            n = len(arquivos) if args.amostra == 0 else min(args.amostra, len(arquivos))
            passo = max(1, len(arquivos) // n) if n else 1
            for a in arquivos[::passo][:n]:
                try:
                    with open(a["id"], encoding="utf-8") as f:
                        docs.append((a["nome"], json.load(f)))
                except Exception as e:
                    docs.append((a["nome"], None))
                    print("   falhou: %s (%r)" % (a["nome"], e))

    if docs:
        validos = [(n, d) for n, d in docs if d is not None]
        rel["ft_conteudo"] = analisa_ft_conteudo(validos)
        rel["ft_conteudo"]["falhas"] += [
            {"nome": n, "motivo": "não abriu"} for n, d in docs if d is None
        ]

    # ---- saídas ----
    md = os.path.join(args.saida, "relatorio.md")
    js = os.path.join(args.saida, "relatorio.json")
    cs = os.path.join(args.saida, "ambiguidades.csv")

    escreve_markdown(rel, md)
    with open(js, "w", encoding="utf-8") as f:
        json.dump(rel, f, ensure_ascii=False, indent=1)
    escreve_csv((rel.get("cadastro") or {}).get("ambiguidades", []), cs)

    print("\n✓ pronto — nada foi alterado")
    print("  %s" % md)
    print("  %s" % cs)
    print("  %s" % js)

    cad = rel.get("cadastro")
    if cad:
        amb = cad["ambiguidades"]
        altos = sum(1 for x in amb if x["risco"] == "ALTO")
        print("\n  %d itens · %d lápides · %d ambiguidades (%d de risco alto)"
              % (cad["totais"]["itens"], cad["totais"]["lapides"], len(amb), altos))


if __name__ == "__main__":
    main()
