export function renderAppShell() {
  return `
    <div class="ui-root">
      <header class="ui-header">
        <div class="ui-titleRow">
          <div>
            <h1 class="ui-title">Treino do Dia</h1>
            <p id="ui-subtitle" class="ui-subtitle">Carregando…</p>
          </div>

          <div class="ui-badges">
            <span id="ui-weekBadge" class="ui-badge">Semana: —</span>
            <span id="ui-dayBadge" class="ui-badge">Dia: —</span>
            <span id="ui-warnBadge" class="ui-badge ui-badgeWarn" style="display:none;">PRs pendentes</span>
          </div>
        </div>

        <div class="ui-actions">
          <button class="ui-btn ui-btnPrimary" data-action="pdf:pick" title="Carregar ou adicionar PDF">
            Carregar PDF
          </button>

          <button class="ui-btn" data-action="pdf:clear" title="Limpar todos os PDFs" style="border-color: rgba(251, 113, 133, 0.4); background: rgba(251, 113, 133, 0.10);">
            Limpar PDFs
          </button>

          <select class="ui-select" data-action="day:set" title="Escolher dia manualmente">
            <option value="">Dia (manual)…</option>
            <option value="Segunda">Segunda</option>
            <option value="Terça">Terça</option>
            <option value="Quarta">Quarta</option>
            <option value="Quinta">Quinta</option>
            <option value="Sexta">Sexta</option>
            <option value="Sábado">Sábado</option>
            <option value="Domingo">Domingo</option>
          </select>

          <button class="ui-btn" data-action="day:auto" title="Voltar para o dia do sistema">Auto</button>
          <button class="ui-btn ui-btnGood" data-action="workout:copy">Copiar</button>
          <button class="ui-btn" data-action="workout:export">Exportar</button>
          <button class="ui-btn" data-action="prs:open">PRs</button>
        </div>

        <div id="ui-weekChips" class="ui-weekChips" aria-label="Seleção de semana" style="min-height:40px;"></div>
      </header>

      <div class="ui-grid">
        <section class="ui-panel">
          <div id="ui-main"></div>
        </section>

        <aside class="ui-panel" id="ui-sidebar">
          <button class="ui-sidebarToggle" data-action="sidebar:toggle" title="Mostrar/Ocultar painéis laterais">
            <span class="ui-toggleIcon">◀</span>
          </button>

          <div class="ui-sidebarContent">
            <div class="ui-card">
              <h3 class="ui-cardTitle">Estado</h3>
              <div id="ui-state" class="ui-muted" style="font-size:13px; line-height:1.45;"></div>
            </div>

            <div class="ui-sep"></div>

            <div class="ui-card">
              <h3 class="ui-cardTitle">Eventos</h3>
              <div id="ui-events" class="ui-muted" style="font-size:13px; line-height:1.45;"></div>
            </div>
          </div>
        </aside>
      </div>

      ${renderPrsModal()}
    </div>
  `;
}

export function renderAll(state) {
  const day = state?.currentDay || '—';
  const activeWeek = state?.activeWeekNumber ?? '—';
  const screen = state?.ui?.activeScreen || 'welcome';
  const weeks = normalizeWeeks(state?.weeks);
  const prsCount = state?.prs ? Object.keys(state.prs).length : 0;
  const hasWarnings = !!state?.ui?.hasWarnings;

  return {
    subtitle: buildSubtitle({ weeksCount: weeks.length, activeWeek, day, screen }),
    weekBadge: `Semana: ${activeWeek}`,
    dayBadge: `Dia: ${day}`,
    warnBadgeVisible: hasWarnings,
    weekChipsHtml: renderWeekChips({ weeks, activeWeek }),
    mainHtml: renderMain({ state, screen, weeks }),
    stateHtml: renderStatePanel({ day, prsCount, activeWeek, screen, weeksCount: weeks.length }),
    prsModalHtml: renderPrsTable(state),
  };
}

function buildSubtitle({ weeksCount, activeWeek, day, screen }) {
  if (!weeksCount) return 'Carregue um PDF para começar.';
  return `Semanas: ${weeksCount} • Semana ativa: ${activeWeek} • Dia: ${day} • Tela: ${screen}`;
}

function normalizeWeeks(weeks) {
  if (!Array.isArray(weeks)) {
    return [];
  }
  
  const normalized = weeks
    .map((w) => ({
      ...w,
      weekNumber: w?.weekNumber ?? w?.week,
    }))
    .filter((w) => {
      const num = Number(w.weekNumber);
      return Number.isFinite(num) && num > 0;
    })
    .sort((a, b) => Number(a.weekNumber) - Number(b.weekNumber));

  return normalized;
}

function renderWeekChips({ weeks, activeWeek }) {
  if (!weeks.length) {
    return `<span class="ui-muted" style="font-size:13px;">Nenhuma semana carregada. Faça upload de um PDF.</span>`;
  }

  return weeks
    .map((w) => {
      const isActive = Number(w.weekNumber) === Number(activeWeek);
      return `
        <button
          class="ui-chip"
          data-action="week:select"
          data-week="${escapeHtml(w.weekNumber)}"
          aria-pressed="${isActive ? 'true' : 'false'}"
          title="Selecionar semana ${escapeHtml(w.weekNumber)}"
        >
          Semana ${escapeHtml(w.weekNumber)}${isActive ? ' • ativa' : ''}
        </button>
      `;
    })
    .join('');
}

function renderMain({ state, screen, weeks }) {
  if (screen === 'rest') {
    return `
      <div class="ui-card">
        <h3 class="ui-cardTitle">Dia de descanso</h3>
        <p class="ui-muted" style="margin:0;">Nenhum treino carregado para hoje.</p>
      </div>
    `;
  }

  if (!weeks.length) {
    return `
      <div class="ui-card">
        <h3 class="ui-cardTitle">Começar</h3>
        <p class="ui-muted" style="margin:0 0 10px 0;">
          Carregue um PDF. O sistema detecta semanas automaticamente.
        </p>
        <button class="ui-btn ui-btnPrimary" data-action="pdf:pick">Carregar PDF</button>
      </div>
    `;
  }

  const workout = normalizeWorkout(state?.workout);

  if (!workout) {
    return `
      <div class="ui-card">
        <h3 class="ui-cardTitle">Nenhum treino encontrado</h3>
        <p class="ui-muted" style="margin:0;">
          Não há treino para <strong>${escapeHtml(state?.currentDay || 'hoje')}</strong> na semana ${escapeHtml(state?.activeWeekNumber ?? '—')}.
        </p>
      </div>
    `;
  }

  const blocks = Array.isArray(workout.blocks) ? workout.blocks : [];
  const hasWarnings = !!state?.ui?.hasWarnings;

  return `
    <div class="ui-card">
      <h3 class="ui-cardTitle">Treino • ${escapeHtml(workout.day || state?.currentDay || '')}</h3>

      <div class="ui-kpis" style="margin-bottom:10px;">
        <span class="ui-kpi">Blocos: ${blocks.length}</span>
        <span class="ui-kpi">Semana: ${escapeHtml(state?.activeWeekNumber ?? '—')}</span>
        <span class="ui-kpi">Avisos: ${hasWarnings ? '<span style="color:rgba(251,191,36,0.95)">sim</span>' : 'não'}</span>
      </div>

      ${blocks.map(renderBlock).join('')}
    </div>
  `;
}

function normalizeWorkout(workout) {
  if (!workout) return null;
  if (typeof workout !== 'object') return null;
  return workout;
}
function renderWorkoutBlock(block, index) {
  const lines = block.lines || [];
  
  return `
    <div class="workout-block" data-block-index="${index}">
      ${/* ❌ REMOVIDO: <h3 class="block-title">${block.type || 'DEFAULT'}</h3> */'' }
      <div class="block-content">
        ${lines.map((line, lineIndex) => renderWorkoutLine(line, lineIndex)).join('')}
      </div>
    </div>
  `;
}

function renderBlock(block, idx) {
  const title = block?.title || block?.name || block?.type || `Bloco ${idx + 1}`;
  const lines = Array.isArray(block?.lines) ? block.lines : [];

  return `
    <div class="ui-block">
      <h4 class="ui-blockTitle">${escapeHtml(title)}</h4>
      ${lines.length ? lines.map(renderLine).join('') : `<div class="ui-muted">Sem linhas</div>`}
    </div>
  `;
}

function renderLine(line) {
  // Caso 1: String simples
  if (typeof line === 'string') {
    return `
      <div class="ui-line">
        <div>${escapeHtml(line)}</div>
        <div></div>
      </div>
    `;
  }

  // Caso 2: Não é objeto válido
  if (!line || typeof line !== 'object') {
    return `
      <div class="ui-line">
        <div>${escapeHtml(String(line))}</div>
        <div></div>
      </div>
    `;
  }

  // Caso 3: Objeto com raw/calculatedText
  const raw = line.raw ?? line.text ?? line.line ?? line.original ?? '';
  const calculated = line.calculatedText ?? line.calculated ?? line.loadText ?? line.load ?? '';
  const warn = !!(line.isWarning || line.warning);

  return `
    <div class="ui-line">
      <div>${escapeHtml(String(raw))}</div>
      ${
        calculated
          ? `<div class="ui-calc ${warn ? 'ui-calcWarn' : ''}">${escapeHtml(String(calculated))}</div>`
          : `<div></div>`
      }
    </div>
  `;
}


function renderStatePanel({ day, prsCount, activeWeek, screen, weeksCount }) {
  return `
    <div>Dia: <strong>${escapeHtml(day)}</strong></div>
    <div>Semanas: <strong>${weeksCount}</strong></div>
    <div>Semana ativa: <strong>${escapeHtml(activeWeek)}</strong></div>
    <div>PRs: <strong>${prsCount}</strong></div>
    <div>Tela: <strong>${escapeHtml(screen)}</strong></div>
  `;
}

function renderPrsModal() {
  return `
    <div id="ui-prsModalBackdrop" class="ui-modalBackdrop" aria-hidden="true">
      <div class="ui-modal" role="dialog" aria-modal="true" aria-labelledby="ui-prsModalTitle">
        <div class="ui-modalHeader">
  <h2 id="ui-prsModalTitle" class="ui-modalTitle">PRs</h2>
  <div class="ui-tableActions">
    <button class="ui-btn" data-action="prs:import-file" title="Importar de arquivo JSON">
      📁 Arquivo
    </button>
    <button class="ui-btn" data-action="prs:export">Exportar</button>
    <button class="ui-btn" data-action="prs:import">Colar JSON</button>
    <button class="ui-btn" data-action="prs:close">Fechar</button>
  </div>
</div>


        <div class="ui-modalBody">
          <div class="ui-formRow">
            <input id="ui-prsNewName" class="ui-input" type="text" placeholder="Exercício (ex: BACK SQUAT)" />
            <input id="ui-prsNewValue" class="ui-input" type="number" step="0.5" placeholder="PR (kg)" />
            <button class="ui-btn ui-btnGood" data-action="prs:add">Adicionar</button>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top:10px;">
            <input id="ui-prsSearch" class="ui-input" type="search" placeholder="Buscar PR..." style="flex:1; min-width: 220px;" />
            <span id="ui-prsCount" class="ui-pill">0 PRs</span>
          </div>

          <div class="ui-scrollArea">
            <div id="ui-prsTable"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderPrsTable(state) {
  const prs = (state?.prs && typeof state.prs === 'object') ? state.prs : {};
  const entries = Object.entries(prs)
    .map(([name, value]) => [String(name), Number(value)])
    .filter(([name, value]) => name.trim().length > 0 && Number.isFinite(value))
    .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));

  if (!entries.length) {
    return `
      <table class="ui-table">
        <thead>
          <tr>
            <th style="width: 55%;">Exercício</th>
            <th style="width: 25%;">PR (kg)</th>
            <th style="width: 20%; text-align:right;">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="3" class="ui-muted">Nenhum PR cadastrado.</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  const rows = entries.map(([name, value]) => {
    const safe = escapeHtml(name);
    return `
      <tr data-pr-row="${safe}">
        <td><strong>${safe}</strong></td>
        <td>
          <input class="ui-input" data-action="prs:editValue" data-exercise="${safe}" type="number" step="0.5" value="${escapeHtml(value)}" />
        </td>
        <td style="text-align:right;">
          <div class="ui-tableActions">
            <button class="ui-btn" data-action="prs:save" data-exercise="${safe}">Salvar</button>
            <button class="ui-btn" data-action="prs:remove" data-exercise="${safe}">Remover</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <table class="ui-table">
      <thead>
        <tr>
          <th style="width: 55%;">Exercício</th>
          <th style="width: 25%;">PR (kg)</th>
          <th style="width: 20%; text-align:right;">Ações</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}
