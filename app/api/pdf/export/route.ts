import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const examId  = searchParams.get('examId')
    const withKey = searchParams.get('key') === 'true'

    if (!examId) return NextResponse.json({ error: 'examId obrigatório' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: exam } = await supabase
      .from('exams')
      .select('*, organizations(name, logo_url, header_config)')
      .eq('id', examId)
      .single()

    if (!exam) return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })

    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('order_index', { ascending: true })

    const org = exam.organizations as any
    const headerFields: string[] = org?.header_config?.fields ?? ['nome', 'turma', 'data']
    const logoUrl: string | null = org?.logo_url ?? null
    const schoolName: string = org?.name ?? ''

    const html = buildPDFHtml({
      exam,
      questions: questions || [],
      schoolName,
      logoUrl,
      headerFields,
      withKey,
    })

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (err: any) {
    console.error('[pdf/export]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────
// Template HTML A4 — Profissional, Preto e Branco, Sem Branding
// ─────────────────────────────────────────────────────────────────
function buildPDFHtml({
  exam,
  questions,
  schoolName,
  logoUrl,
  headerFields,
  withKey,
}: {
  exam: any
  questions: any[]
  schoolName: string
  logoUrl: string | null
  headerFields: string[]
  withKey: boolean
}) {
  const FIELD_LABELS: Record<string, string> = {
    nome: 'Nome',
    turma: 'Turma / Série',
    data: 'Data',
    professor: 'Professor(a)',
    numero: 'Nº',
  }

  // Filtra "nota" dos campos de cabeçalho — vai para a caixa separada
  const infoFields = headerFields.filter(f => f !== 'nota')

  // ── Capa: campos de identificação do aluno ─────────────
  const infoFieldsHtml = infoFields.map(f => `
    <tr>
      <td class="field-label">${FIELD_LABELS[f] ?? esc(f)}</td>
      <td class="field-blank"></td>
    </tr>
  `).join('')

  // ── Questões ───────────────────────────────────────────
  const questionsHtml = questions.map((q, idx) => {
    const isVF   = q.type === 'true_false'
    const isEssay = q.type === 'essay'

    const optionsHtml = (q.options ?? []).map((opt: any) => {
      const letter = isVF ? (opt.text === 'Verdadeiro' ? 'V' : 'F') : opt.letter
      return `
        <div class="option${withKey && opt.is_correct ? ' option-correct' : ''}">
          <span class="opt-circle">${esc(letter)}</span>
          <span class="opt-text">${esc(opt.text)}</span>
        </div>`
    }).join('')

    const essayLinesHtml = isEssay ? `
      <div class="essay-lines">
        <div class="essay-line"></div>
        <div class="essay-line"></div>
        <div class="essay-line"></div>
        <div class="essay-line"></div>
        <div class="essay-line"></div>
      </div>` : ''

    const keyHtml = withKey ? `
      <div class="answer-key">
        <span class="key-label">Gabarito:</span>
        <span class="key-value">${esc(q.answer || '')}</span>
        ${q.explanation ? `<p class="key-explanation">${esc(q.explanation)}</p>` : ''}
      </div>` : ''

    return `
      <div class="question">
        <div class="question-num">${idx + 1}.</div>
        <div class="question-body">
          <div class="question-text">${esc(q.content)}</div>
          ${q.options ? `<div class="options">${optionsHtml}</div>` : ''}
          ${essayLinesHtml}
          ${keyHtml}
        </div>
      </div>`
  }).join('')

  const today = new Date().toLocaleDateString('pt-BR')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>${esc(exam.title)}</title>
<style>
/* ── Reset ────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }

body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  color: #000;
  background: #fff;
}

/* ── Print layout ─────────────────── */
@page {
  size: A4;
  margin: 18mm 18mm 18mm 20mm;
}

@media print {
  .no-print { display: none !important; }
  .cover    { page-break-after: always; }
  .question { page-break-inside: avoid; }
}

/* ── Screen preview ───────────────── */
@media screen {
  body { background: #ccc; padding: 60px 0 40px; }
  .cover, .questions-page {
    background: #fff;
    width: 210mm;
    margin: 0 auto 24px;
    padding: 18mm 18mm 18mm 20mm;
    box-shadow: 0 2px 24px rgba(0,0,0,.18);
  }
  .print-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    background: #111;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 24px;
    font-size: 13px;
    font-weight: 600;
    z-index: 999;
  }
  .print-bar button {
    background: #fff;
    color: #111;
    border: none;
    padding: 7px 18px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
  }
  .print-bar button:hover { background: #e5e7eb; }
}

/* ═══════════════════════════════════
   CAPA (Página 1)
═══════════════════════════════════ */
.cover {
  display: flex;
  flex-direction: column;
  min-height: 257mm; /* A4 - margens */
}

/* ── Cabeçalho da escola ─────────── */
.school-header {
  display: flex;
  align-items: center;
  gap: 14pt;
  border-bottom: 2.5pt solid #000;
  padding-bottom: 12pt;
  margin-bottom: 24pt;
}

.school-logo-box {
  width: 62pt;
  height: 62pt;
  border: 1.5pt solid #aaa;
  border-radius: 4pt;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.school-logo-box img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.school-logo-placeholder {
  font-size: 7pt;
  color: #aaa;
  text-align: center;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: .05em;
}

.school-info h1 {
  font-size: 16pt;
  font-weight: 700;
  letter-spacing: .01em;
  line-height: 1.2;
  margin-bottom: 4pt;
}

.school-info .exam-meta {
  font-size: 9.5pt;
  color: #444;
}

/* ── Título da prova ─────────────── */
.exam-title-block {
  text-align: center;
  margin-bottom: 28pt;
}

.exam-title-block h2 {
  font-size: 15pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
  margin-bottom: 4pt;
}

.exam-title-block .exam-theme {
  font-size: 10.5pt;
  color: #333;
}

/* ── Campos do aluno ─────────────── */
.student-section {
  display: flex;
  gap: 14pt;
  align-items: flex-start;
  margin-bottom: 28pt;
}

/* Tabela de campos (nome, turma, data…) */
.student-fields {
  flex: 1;
  border: 1.5pt solid #555;
  border-radius: 4pt;
  overflow: hidden;
}

.student-fields table {
  width: 100%;
  border-collapse: collapse;
}

.field-label {
  padding: 6pt 10pt;
  font-size: 9pt;
  font-weight: 700;
  white-space: nowrap;
  width: 90pt;
  border-right: 1.5pt solid #555;
  border-bottom: 1pt solid #ddd;
  background: #f7f7f7;
}

.field-label:last-of-type,
tr:last-child .field-label { border-bottom: none; }
tr:last-child .field-blank { border-bottom: none; }

.field-blank {
  padding: 6pt 10pt;
  border-bottom: 1pt solid #ddd;
  height: 22pt;
}

/* Caixa de Nota separada */
.nota-box {
  flex-shrink: 0;
  width: 80pt;
  border: 2pt solid #000;
  border-radius: 4pt;
  text-align: center;
}

.nota-box-label {
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  padding: 5pt 0;
  border-bottom: 1.5pt solid #555;
  background: #f7f7f7;
}

.nota-box-area {
  height: 42pt;
}

/* ── Instruções ──────────────────── */
.instructions-block {
  margin-bottom: 0;
  padding: 12pt 14pt;
  border: 1.5pt solid #aaa;
  border-radius: 4pt;
  background: #f9f9f9;
}

.instructions-title {
  font-size: 9pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  margin-bottom: 6pt;
  color: #222;
}

.instructions-text {
  font-size: 10pt;
  color: #222;
  line-height: 1.65;
}

/* ── Observações do Professor ────── */
.obs-block {
  flex: 1;
  margin-top: 20pt;
  border: 1.5pt solid #aaa;
  border-radius: 4pt;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 80pt;
}

.obs-title {
  font-size: 9pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  padding: 6pt 12pt;
  border-bottom: 1pt solid #ccc;
  background: #f7f7f7;
  color: #222;
}

.obs-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 8pt 12pt;
  gap: 0;
}

.obs-line {
  border-bottom: 1pt solid #ddd;
  height: 18pt;
}

/* ═══════════════════════════════════
   QUESTÕES (Página 2 em diante)
═══════════════════════════════════ */
.questions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1.5pt solid #000;
  padding-bottom: 8pt;
  margin-bottom: 18pt;
}

.questions-header .qh-title {
  font-size: 11pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.questions-header .qh-count {
  font-size: 9pt;
  color: #555;
}

/* ── Questão ─────────────────────── */
.question {
  display: flex;
  gap: 8pt;
  margin-bottom: 20pt;
  padding-bottom: 16pt;
  border-bottom: 1pt dashed #ccc;
}

.question:last-child { border-bottom: none; }

.question-num {
  font-size: 12pt;
  font-weight: 700;
  width: 18pt;
  flex-shrink: 0;
  padding-top: 1pt;
}

.question-body { flex: 1; }

.question-text {
  font-size: 11pt;
  line-height: 1.7;
  margin-bottom: 10pt;
}

/* ── Alternativas ────────────────── */
.options {
  display: flex;
  flex-direction: column;
  gap: 5pt;
  padding-left: 2pt;
}

.option {
  display: flex;
  align-items: baseline;
  gap: 7pt;
  font-size: 10.5pt;
  line-height: 1.5;
}

.opt-circle {
  width: 14pt;
  height: 14pt;
  border: 1.5pt solid #333;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 8pt;
  font-weight: 700;
  flex-shrink: 0;
}

.option-correct .opt-circle {
  border-color: #000;
  background: #000;
  color: #fff;
}

.option-correct .opt-text { font-weight: 700; }

.opt-text { line-height: 1.5; }

/* ── Linhas dissertativa ─────────── */
.essay-lines { display: flex; flex-direction: column; gap: 14pt; margin-top: 6pt; }
.essay-line  { border-bottom: 1pt solid #bbb; height: 0; }

/* ── Gabarito comentado ──────────── */
.answer-key {
  margin-top: 10pt;
  padding: 8pt 10pt;
  border: 1.5pt solid #333;
  border-radius: 4pt;
  background: #f3f3f3;
}

.key-label {
  font-size: 8.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.key-value {
  font-size: 10.5pt;
  font-weight: 700;
  margin-left: 6pt;
}

.key-explanation {
  font-size: 9.5pt;
  color: #333;
  margin-top: 5pt;
  line-height: 1.55;
}
</style>
</head>
<body>

<!-- ── Barra de impressão (apenas tela) ── -->
<div class="print-bar no-print">
  <span>${esc(exam.title)}</span>
  <div style="display:flex;gap:8px">
    <button onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
    <button onclick="window.close()" style="background:#374151;color:#fff">✕ Fechar</button>
  </div>
</div>

<!-- ══════════════════════════════════
     PÁGINA 1 — CAPA
══════════════════════════════════ -->
<div class="cover">

  <!-- Cabeçalho da escola -->
  <div class="school-header">
    <div class="school-logo-box">
      ${logoUrl
        ? `<img src="${logoUrl}" alt="Logo" />`
        : `<div class="school-logo-placeholder">Logo<br/>da<br/>Escola</div>`
      }
    </div>
    <div class="school-info">
      <h1>${esc(schoolName)}</h1>
      <div class="exam-meta">${esc(exam.subject)} · ${esc(exam.grade)}</div>
    </div>
  </div>

  <!-- Título da prova -->
  <div class="exam-title-block">
    <h2>${esc(exam.title)}</h2>
    ${exam.theme ? `<div class="exam-theme">${esc(exam.theme)}</div>` : ''}
  </div>

  <!-- Campos do aluno + Caixa de Nota -->
  <div class="student-section">
    <div class="student-fields">
      <table>
        <tbody>
          ${infoFieldsHtml}
        </tbody>
      </table>
    </div>

    <div class="nota-box">
      <div class="nota-box-label">Nota</div>
      <div class="nota-box-area"></div>
    </div>
  </div>

  <!-- Instruções -->
  ${exam.instructions ? `
  <div class="instructions-block">
    <div class="instructions-title">Instruções</div>
    <div class="instructions-text">${esc(exam.instructions)}</div>
  </div>` : ''}

  <!-- Observações do Professor -->
  <div class="obs-block">
    <div class="obs-title">Observações do Professor</div>
    <div class="obs-lines">
      <div class="obs-line"></div>
      <div class="obs-line"></div>
      <div class="obs-line"></div>
      <div class="obs-line"></div>
      <div class="obs-line"></div>
      <div class="obs-line"></div>
      <div class="obs-line"></div>
    </div>
  </div>

</div>

<!-- ══════════════════════════════════
     PÁGINA 2+ — QUESTÕES
══════════════════════════════════ -->
<div class="questions-page">
  <div class="questions-header">
    <span class="qh-title">Questões</span>
    <span class="qh-count">${questions.length} ${questions.length === 1 ? 'item' : 'itens'}</span>
  </div>

  ${questionsHtml}
</div>

</body>
</html>`
}

function esc(str: string | null | undefined): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>')
}
