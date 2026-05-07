import SectionHeader from '../ui/SectionHeader'
import Icon from '../ui/Icon'

const GUIAS = [
  { icon: 'upload',   title: 'Como subir uma planilha',   body: 'Use o botão "Upload Excel" na sidebar. O arquivo deve seguir o template oficial com as colunas exatas de data, lote, vacas, produção e consumo.', tag: 'Início rápido' },
  { icon: 'bolt',     title: 'Eficiência alimentar',      body: 'Calculada como kg de leite produzido por kg de matéria seca consumida. Valores ≥ 1.5 indicam ótimo aproveitamento; abaixo de 1.3 merecem investigação imediata.', tag: 'Indicador' },
  { icon: 'leaf',     title: '% Forragem na dieta',       body: 'Faixa saudável para vacas em lactação: 50–60%. Excesso reduz produção; déficit pode causar acidose ruminal e comprometer a saúde do rebanho.', tag: 'Nutrição' },
  { icon: 'wheat',    title: '% Matéria seca (MS)',       body: 'A MS da dieta total deve ficar entre 45–55%. Variação grande pode indicar problemas de mistura ou conservação da forragem, especialmente silagem.', tag: 'Nutrição' },
  { icon: 'cow',      title: 'Lotes',                     body: 'TOP VACA / TOP NOV: vacas e novilhas de alta produção. CB1, CB2, CB4: categorias intermediárias. PÓS PARTO: período de transição (até 21 dias).', tag: 'Glossário' },
  { icon: 'calendar', title: 'Frequência de upload',      body: 'Recomendamos upload diário ou semanal. Quanto mais frequente, melhor o histórico para detectar tendências e quedas antes que se agravem.', tag: 'Boas práticas' },
]

export default function GuideTab({ A }) {
  return (
    <>
      <SectionHeader A={A} eyebrow="Ajuda" title="Orientações de uso" subtitle="Glossário rápido e boas práticas para gestores e nutricionistas" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {GUIAS.map((g, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: `1px solid ${A.primaryLight}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span style={{ width: 42, height: 42, borderRadius: 12, background: A.primaryLight, color: A.primaryDark, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name={g.icon} size={20} strokeWidth={2} style={{ color: A.primaryDark }} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <h3 style={{ fontSize: 15.5, fontWeight: 800, margin: 0, letterSpacing: -0.2 }}>{g.title}</h3>
                  <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: A.bg, color: '#6b7568', textTransform: 'uppercase', letterSpacing: 0.8, flexShrink: 0 }}>{g.tag}</span>
                </div>
                <p style={{ fontSize: 12.5, lineHeight: 1.6, color: '#3a4438', margin: 0, textWrap: 'pretty' }}>{g.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
