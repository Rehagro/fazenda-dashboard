import React, { useState } from 'react'
import {
  BookOpen, LayoutDashboard, TrendingUp, FlaskConical, Leaf,
  Calendar, Table2, History, Upload, Download, Filter,
  Building2, Zap, Droplets, Users, Milk, Wheat, Layers,
  ChevronDown, ChevronUp, Info,
} from 'lucide-react'
import { templateUrl, templateCsvUrl } from '../api/client'

function Section({ icon: Icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card overflow-hidden p-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left
                   hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
            <Icon className="w-4 h-4 text-brand-600" />
          </div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="font-semibold text-gray-700 whitespace-nowrap min-w-[180px]">{label}</span>
      <span className="text-gray-600">{value}</span>
    </div>
  )
}

function ColRow({ col, type, desc }) {
  return (
    <div className="grid grid-cols-[200px_100px_1fr] gap-3 text-sm border-b border-gray-50 py-2">
      <code className="font-mono text-brand-700 text-xs bg-brand-50 px-2 py-0.5 rounded self-start">{col}</code>
      <span className="text-gray-400 text-xs">{type}</span>
      <span className="text-gray-600">{desc}</span>
    </div>
  )
}

export default function OrientacoesTab() {
  return (
    <div className="space-y-4 max-w-4xl">

      {/* Boas-vindas */}
      <div className="card bg-brand-50 border-brand-200">
        <div className="flex gap-4">
          <Info className="w-6 h-6 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-brand-800 text-lg">Fazenda Nutrition Dashboard</h2>
            <p className="text-brand-700 text-sm mt-1">
              Painel de análise de nutrição e desempenho produtivo para pecuária leiteira.
              Carregue seus dados via planilha e explore os indicadores por lote, período e fazenda.
            </p>
          </div>
        </div>
      </div>

      {/* Abas */}
      <Section icon={LayoutDashboard} title="Guia das Abas">
        <div className="space-y-3 pt-3">
          {[
            { icon: LayoutDashboard, name: 'Visão Geral',        desc: 'KPIs do dia mais recente + gráficos de eficiência e produção + tabela de lotes + composição do rebanho.' },
            { icon: TrendingUp,      name: 'Eficiência Aliment.', desc: 'Série temporal da eficiência alimentar (kg leite / kg MS) com linha de meta e média do rebanho.' },
            { icon: FlaskConical,    name: 'Produção',            desc: 'Evolução da produção por vaca por lote + rebanho. Tabela ordenada por maior produção.' },
            { icon: Leaf,            name: 'Dieta & CMS',         desc: 'Relação da inclusão de forragem com produção e CMS por vaca. Gráficos com eixo duplo.' },
            { icon: Calendar,        name: 'Análise Mensal',      desc: 'Agrupamento por mês. Produção, eficiência, CMS e % forragem mensais por lote e rebanho.' },
            { icon: Table2,          name: 'Dados Brutos',        desc: 'Todos os registros individuais com busca e paginação. Ideal para conferir o que foi importado.' },
            { icon: History,         name: 'Histórico',           desc: 'Arquivos enviados com data de upload e quantidade de registros.' },
            { icon: BookOpen,        name: 'Orientações',         desc: 'Esta página.' },
          ].map(({ icon: Icon, name, desc }) => (
            <div key={name} className="flex gap-3 text-sm">
              <Icon className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-800">{name}: </span>
                <span className="text-gray-600">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Filtros */}
      <Section icon={Filter} title="Como Usar os Filtros">
        <div className="space-y-2 pt-3">
          <div className="flex gap-3 text-sm">
            <Building2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-800">Fazenda: </span>
              <span className="text-gray-600">
                Selecione a fazenda cujos dados você quer analisar. Cada fazenda tem seu banco de dados
                independente — os lotes de uma não interferem na outra.
                O nome da fazenda é definido na coluna <code className="bg-gray-100 px-1 rounded">fazenda</code> do arquivo importado.
              </span>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <Filter className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-800">Período: </span>
              <span className="text-gray-600">
                Intervalo de datas para análise. Todos os gráficos e KPIs respondem ao período selecionado.
                Os KPIs mostram os valores do último dia disponível no período.
              </span>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="w-4 h-4 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-800">Lotes: </span>
              <span className="text-gray-600">
                Clique nos chips coloridos para ativar ou desativar lotes.
                Os lotes disponíveis são carregados automaticamente do banco de dados para a fazenda selecionada.
                A linha "Rebanho" nos gráficos sempre considera apenas os lotes ativos.
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* KPIs */}
      <Section icon={Zap} title="Indicadores (KPIs) — Definições">
        <div className="space-y-2 pt-3">
          {[
            { icon: Droplets, label: 'Produção Total',          desc: 'Soma de kg de leite produzido por todos os lotes no último dia do período.' },
            { icon: Users,    label: 'Total Vacas em Lactação', desc: 'Soma do número de vacas de todos os lotes no último dia do período.' },
            { icon: Milk,     label: 'Leite/Vaca Rebanho',      desc: 'Produção total ÷ total de vacas. Média ponderada real do rebanho.' },
            { icon: Zap,      label: 'Eficiência Alimentar',    desc: 'Produção total ÷ consumo total de MS. Expressa em kg leite / kg MS.' },
            { icon: FlaskConical, label: 'CMS/Vaca Rebanho',   desc: 'Consumo total de MS ÷ total de vacas. Média ponderada real do rebanho.' },
            { icon: Leaf,     label: '% Forragem na Dieta',     desc: 'Média ponderada da inclusão de forragem (em % da MS) por número de vacas.' },
            { icon: Wheat,    label: '%MS Forragem Principal',  desc: 'Teor médio de matéria seca da forragem principal da dieta (ex: silagem de milho ~30%). Ponderado por vacas.' },
            { icon: Layers,   label: '%MS da Dieta',           desc: 'Teor médio de matéria seca da dieta total (TMR). Reflete o quanto a ração está "seca". Ponderado por vacas.' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex gap-3 text-sm">
              <Icon className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-800">{label}: </span>
                <span className="text-gray-600">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Fórmulas */}
      <Section icon={Zap} title="Critérios de Cálculo">
        <div className="space-y-2 pt-3">
          <Row label="Eficiência Alimentar"     value="Leite/Vaca (kg) ÷ CMS/Vaca (kg)" />
          <Row label="Leite/Vaca Rebanho"       value="Σ Produção Total ÷ Σ Nº Vacas (ponderado)" />
          <Row label="CMS/Vaca Rebanho"         value="Σ CMS Total ÷ Σ Nº Vacas (ponderado)" />
          <Row label="% Forragem Rebanho"       value="Σ (%forragem × nº vacas) ÷ Σ nº vacas" />
          <Row label="%MS Forragem Rebanho"     value="Σ (%MS forragem × nº vacas) ÷ Σ nº vacas" />
          <Row label="%MS Dieta Rebanho"        value="Σ (%MS dieta × nº vacas) ÷ Σ nº vacas" />
          <Row label="Mensal — Leite/Vaca"      value="Σ Produção Total do mês ÷ Σ Nº Vacas do mês (ponderado)" />
          <Row label="Mensal — Eficiência"      value="Média ponderada por nº vacas de cada semana/registro" />
          <Row label="Linha Rebanho (gráficos)" value="Calculada diariamente com os mesmos critérios acima" />
        </div>
        <div className="mt-3 p-3 bg-amber-50 rounded-lg text-xs text-amber-800 flex gap-2">
          <Info className="w-4 h-4 shrink-0" />
          Meta de referência para eficiência alimentar: ≥ 1.50 kg leite / kg MS (linha verde nos gráficos).
          Valores ≥ 1.30 são considerados aceitáveis.
        </div>
      </Section>

      {/* Upload */}
      <Section icon={Upload} title="Como Importar Dados">
        <div className="space-y-3 pt-3 text-sm">
          <p className="text-gray-600">
            Clique em <span className="font-semibold">Upload</span> no cabeçalho para enviar seus dados.
            O sistema aceita arquivos <strong>.xlsx</strong>, <strong>.xls</strong> ou <strong>.csv</strong>.
          </p>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-800 text-xs">
            <strong>Importante:</strong> O nome da fazenda e o nome do lote são definidos dentro do arquivo
            (colunas <code>fazenda</code> e <code>lote</code>). Isso permite que um único arquivo carregue
            dados de múltiplas fazendas ou lotes com nomes personalizados.
          </div>
          <p className="text-gray-600 font-semibold">Baixe o template:</p>
          <div className="flex gap-3">
            <a href={templateUrl} className="btn-primary text-sm inline-flex items-center gap-2">
              <Download className="w-4 h-4" /> Template Excel (.xlsx)
            </a>
            <a href={templateCsvUrl} className="btn-ghost text-sm inline-flex items-center gap-2 border border-gray-300">
              <Download className="w-4 h-4" /> Template CSV (.csv)
            </a>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Preencha a partir da linha 3 (as duas primeiras são cabeçalho e legenda).
            As colunas <code className="bg-gray-100 px-1 rounded">pct_ms_forragem</code> e{' '}
            <code className="bg-gray-100 px-1 rounded">pct_ms_dieta</code> são opcionais —
            deixe em branco se não tiver o dado.
          </p>
        </div>
      </Section>

      {/* Colunas */}
      <Section icon={Table2} title="Dicionário de Colunas do Arquivo" defaultOpen={false}>
        <div className="pt-3">
          <div className="grid grid-cols-[200px_100px_1fr] gap-3 text-xs font-semibold text-gray-500 pb-2 border-b border-gray-200">
            <span>Coluna</span><span>Tipo</span><span>Descrição</span>
          </div>
          <ColRow col="fazenda"              type="Texto"   desc="Nome da fazenda. Define o banco de dados isolado. Ex: 'Fazenda São João'." />
          <ColRow col="data"                 type="Data"    desc="Data do registro no formato AAAA-MM-DD. Ex: 2026-01-15." />
          <ColRow col="lote"                 type="Texto"   desc="Nome do lote. Pode ser qualquer nome. Ex: 'Alta Produção', 'Vaca Seca'." />
          <ColRow col="num_vacas"            type="Inteiro" desc="Número de vacas em lactação no lote naquela data." />
          <ColRow col="producao_leite_total" type="Decimal" desc="Produção total de leite do lote no dia em kg." />
          <ColRow col="leite_por_vaca"       type="Decimal" desc="Produção média por vaca no dia em kg (= produção total ÷ num_vacas)." />
          <ColRow col="consumo_ms_total"     type="Decimal" desc="Consumo total de matéria seca do lote no dia em kg." />
          <ColRow col="consumo_ms_vaca"      type="Decimal" desc="Consumo de MS por vaca no dia em kg (= CMS total ÷ num_vacas)." />
          <ColRow col="percentual_forragem"  type="Decimal" desc="Percentual de forragem na dieta em base MS (0 a 100). Ex: 50.0." />
          <ColRow col="pct_ms_forragem"      type="Decimal" desc="(Opcional) Teor de MS da forragem principal em %. Ex: silagem de milho = 30.0." />
          <ColRow col="pct_ms_dieta"         type="Decimal" desc="(Opcional) Teor de MS da dieta total (TMR) em %. Ex: 45.0." />
        </div>
      </Section>

    </div>
  )
}
