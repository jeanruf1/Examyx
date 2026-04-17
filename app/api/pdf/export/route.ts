import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BLOOM_PT: Record<string, string> = {
  memorization: 'Lembrar',
  comprehension: 'Compreender',
  application: 'Aplicar',
  analysis: 'Analisar',
  evaluation: 'Avaliar',
  synthesis: 'Criar',
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const examId   = searchParams.get('examId')
    const withKey  = searchParams.get('key') === 'true'   // incluir gabarito comentado

    if (!examId) return NextResponse.json({ error: 'examId obrigatório' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // ── Busca dados ────────────────────────────────────────────
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
    const headerFields: string[] = org?.header_config?.fields ?? ['nome', 'turma', 'data', 'nota']

    // ── Render HTML ────────────────────────────────────────────
    const html = buildPDFHtml({ exam, questions: questions || [], org, headerFields, withKey })

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

  } catch (err: any) {
    console.error('[pdf/export]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────────────────────
// Template HTML A4
// ──────────────────────────────────────────────────────────────
function buildPDFHtml({
  exam,
  questions,
  org,
  headerFields,
  withKey,
}: {
  exam: any
  questions: any[]
  org: any
  headerFields: string[]
  withKey: boolean
}) {
  const fieldLabels: Record<string, string> = {
    nome: 'Nome',
    turma: 'Turma',
    data: 'Data',
    nota: 'Nota',
    numero: 'Nº',
    professor: 'Professor(a)',
  }

  const headerFieldsHtml = headerFields.map(f => `
    <div class="field-line">
      <span class="field-label">${fieldLabels[f] ?? f}:</span>
      <span class="field-blank"></span>
    </div>`
  ).join('')

  const questionsHtml = questions.map((q, idx) => {
    const isVF = q.type === 'true_false'
    const bloomLabel = q.bloom_level ? BLOOM_PT[q.bloom_level] : null

    const optionsHtml = q.options ? q.options.map((opt: any) => {
      const letter = isVF ? (opt.text === 'Verdadeiro' ? 'V' : 'F') : opt.letter
      return `
        <div class="option">
          <span class="option-letter">${letter}</span>
          <span class="option-text">${escapeHtml(opt.text)}</span>
        </div>`
    }).join('') : ''

    const keyHtml = withKey ? `
      <div class="answer-key">
        <span class="answer-label">✓ Gabarito:</span>
        <span class="answer-text">${escapeHtml(q.answer || '')}</span>
        ${q.explanation ? `<p class="explanation">${escapeHtml(q.explanation)}</p>` : ''}
      </div>` : ''

    const metaHtml = [
      bloomLabel ? `<span class="badge bloom">${bloomLabel}</span>` : '',
      q.bncc_code ? `<span class="badge bncc">${escapeHtml(q.bncc_code)}</span>` : '',
    ].filter(Boolean).join('')

    return `
      <div class="question">
        <div class="question-header">
          <span class="question-number">${idx + 1}</span>
          <div class="question-meta">${metaHtml}</div>
        </div>
        <div class="question-content">${escapeHtml(q.content)}</div>
        ${q.options ? `<div class="options">${optionsHtml}</div>` : ''}
        ${q.type === 'essay' ? '<div class="essay-lines"></div>' : ''}
        ${keyHtml}
      </div>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(exam.title)}</title>
  <style>
    /* ── Reset & Base ───────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Georgia', 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
    }

    /* ── Print: A4 page ─────────────────────────── */
    @page {
      size: A4;
      margin: 20mm 18mm 20mm 18mm;
    }

    @media print {
      body { background: white; }
      .no-print { display: none !important; }
      .question { page-break-inside: avoid; }
      .answer-key { color: #15803d; }
    }

    /* ── Screen preview ─────────────────────────── */
    @media screen {
      body {
        background: #f0f0f0;
        padding: 20px;
      }
      .page {
        background: white;
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto 20px;
        padding: 20mm 18mm;
        box-shadow: 0 4px 32px rgba(0,0,0,0.15);
      }
    }

    /* ── Header ─────────────────────────────────── */
    .exam-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 10pt;
      border-bottom: 2px solid #1a1a1a;
      margin-bottom: 14pt;
    }

    .school-name {
      font-size: 14pt;
      font-weight: bold;
      letter-spacing: 0.02em;
      margin-bottom: 2pt;
    }

    .exam-title {
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      margin: 10pt 0 4pt;
    }

    .exam-subtitle {
      font-size: 10pt;
      text-align: center;
      color: #555;
      margin-bottom: 12pt;
    }

    /* ── Header fields (nome, turma, etc) ──────── */
    .header-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6pt 24pt;
      margin-bottom: 18pt;
      padding: 10pt 12pt;
      border: 1px solid #ccc;
      border-radius: 4pt;
      background: #fafafa;
    }

    .field-line {
      display: flex;
      align-items: baseline;
      gap: 4pt;
      font-size: 10pt;
    }

    .field-label {
      font-weight: bold;
      white-space: nowrap;
      font-size: 9.5pt;
      color: #333;
    }

    .field-blank {
      flex: 1;
      border-bottom: 1px solid #555;
      min-width: 80pt;
      height: 14pt;
    }

    /* ── Instructions ───────────────────────────── */
    .instructions {
      font-size: 9pt;
      color: #444;
      padding: 8pt 10pt;
      border-left: 3px solid #4F46E5;
      background: #f8f8ff;
      margin-bottom: 18pt;
      font-style: italic;
    }

    /* ── Separator ──────────────────────────────── */
    .section-title {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #666;
      margin: 20pt 0 10pt;
      padding-bottom: 4pt;
      border-bottom: 1px solid #ddd;
    }

    /* ── Questions ──────────────────────────────── */
    .question {
      margin-bottom: 18pt;
      padding-bottom: 14pt;
      border-bottom: 1px dashed #ddd;
    }

    .question:last-child {
      border-bottom: none;
    }

    .question-header {
      display: flex;
      align-items: center;
      gap: 8pt;
      margin-bottom: 6pt;
    }

    .question-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20pt;
      height: 20pt;
      border: 1.5pt solid #1a1a1a;
      border-radius: 50%;
      font-size: 9pt;
      font-weight: bold;
      font-family: 'Arial', sans-serif;
      flex-shrink: 0;
    }

    .question-meta {
      display: flex;
      gap: 4pt;
      flex-wrap: wrap;
    }

    .badge {
      font-family: 'Arial', sans-serif;
      font-size: 7pt;
      font-weight: bold;
      padding: 1pt 5pt;
      border-radius: 3pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge.bloom {
      background: #e0e7ff;
      color: #3730a3;
    }

    .badge.bncc {
      background: #d1fae5;
      color: #065f46;
    }

    .question-content {
      font-size: 11pt;
      line-height: 1.65;
      margin-bottom: 8pt;
      font-family: 'Georgia', serif;
    }

    /* ── Options ────────────────────────────────── */
    .options {
      display: flex;
      flex-direction: column;
      gap: 4pt;
      padding-left: 4pt;
    }

    .option {
      display: flex;
      align-items: baseline;
      gap: 6pt;
      font-size: 10.5pt;
    }

    .option-letter {
      font-family: 'Arial', sans-serif;
      font-weight: bold;
      font-size: 10pt;
      width: 14pt;
      flex-shrink: 0;
    }

    .option-text {
      font-family: 'Georgia', serif;
      line-height: 1.5;
    }

    /* ── Essay lines ────────────────────────────── */
    .essay-lines {
      margin-top: 6pt;
      display: flex;
      flex-direction: column;
      gap: 14pt;
    }

    .essay-lines::before,
    .essay-lines::after,
    .essay-lines span {
      content: '';
      display: block;
      height: 0;
      border-bottom: 1px solid #ccc;
    }

    .essay-lines::before { content: ''; border-bottom: 1px solid #ccc; }
    .essay-lines::after { content: ''; border-bottom: 1px solid #ccc; }

    /* ── Answer key ─────────────────────────────── */
    .answer-key {
      margin-top: 8pt;
      padding: 6pt 10pt;
      background: #f0fdf4;
      border-left: 3px solid #16a34a;
      border-radius: 3pt;
      font-family: 'Arial', sans-serif;
    }

    .answer-label {
      font-size: 9pt;
      font-weight: bold;
      color: #15803d;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .answer-text {
      font-size: 10pt;
      color: #14532d;
      font-weight: bold;
      margin-left: 4pt;
    }

    .explanation {
      font-size: 9pt;
      color: #166534;
      margin-top: 4pt;
      line-height: 1.5;
      font-style: italic;
    }

    /* ── Footer ─────────────────────────────────── */
    .exam-footer {
      margin-top: 24pt;
      padding-top: 8pt;
      border-top: 1px solid #ccc;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #888;
      font-family: 'Arial', sans-serif;
    }

    /* ── Print button (screen only) ─────────────── */
    .print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: #1a1d2f;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 24px;
      font-family: 'Arial', sans-serif;
      font-size: 13px;
      font-weight: 600;
    }

    .print-bar .btn {
      background: white;
      color: #1a1d2f;
      border: none;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
    }

    .print-bar .btn:hover {
      background: #e0e7ff;
    }

    @media screen {
      body { padding-top: 52px; }
    }
  </style>
</head>
<body>
  <!-- Print toolbar (screen only) -->
  <div class="print-bar no-print">
    <span>📄 ${escapeHtml(exam.title)}</span>
    <div style="display:flex;gap:10px">
      <button class="btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
      <button class="btn" onclick="window.close()" style="background:#374151;color:white">✕ Fechar</button>
    </div>
  </div>

  <div class="page">
    <!-- School header -->
    <div class="exam-header">
      <div>
        <div class="school-name">${escapeHtml(org?.name || 'Escola')}</div>
        <div style="font-size:9pt;color:#555;font-family:Arial,sans-serif;">${escapeHtml(exam.subject)} · ${escapeHtml(exam.grade)}</div>
      </div>
      <div style="text-align:right;font-size:9pt;color:#555;font-family:Arial,sans-serif;">
        ${questions.length} questões<br/>
        ${exam.estimated_time_min ? `Tempo estimado: ${exam.estimated_time_min} min` : ''}
      </div>
    </div>

    <!-- Exam title -->
    <div class="exam-title">${escapeHtml(exam.title)}</div>
    <div class="exam-subtitle">
      ${escapeHtml(exam.subject)} · ${escapeHtml(exam.grade)}
      ${exam.theme ? ` · ${escapeHtml(exam.theme)}` : ''}
    </div>

    <!-- Student fill fields -->
    <div class="header-fields">
      ${headerFieldsHtml}
    </div>

    <!-- Instructions -->
    ${exam.instructions ? `<div class="instructions">${escapeHtml(exam.instructions)}</div>` : ''}

    <!-- Questions -->
    <div class="section-title">Questões</div>
    <div class="questions-list">
      ${questionsHtml}
    </div>

    <!-- Footer -->
    <div class="exam-footer">
      <span>Gerado por Examyx &middot; ${new Date().toLocaleDateString('pt-BR')}</span>
      <span>${escapeHtml(org?.name || '')} &middot; ${escapeHtml(exam.subject)}</span>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
