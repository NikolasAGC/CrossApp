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
          </div>
        </div>

        <div class="ui-actions">
          <button class="ui-btn ui-btnPrimary" data-action="pdf:pick">Upload PDF (multi-semana)</button>

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
          <button class="ui-btn" data-action="workout:export">Exportar treino</button>
          <button class="ui-btn" data-action="prs:export">Exportar PRs</button>
        </div>

        <div id="ui-weekChips" class="ui-weekChips" aria-label="Seleção de semana"></div>
      </header>

      <div class="ui-grid">
        <section class="ui-panel">
          <div id="ui-main"></div>
        </section>

        <aside class="ui-panel">
          <div class="ui-card">
            <h3 class="ui-cardTitle">Estado</h3>
            <div id="ui-state" class="ui-muted" style="font-size:13px; line-height:1.45;"></div>
          </div>

          <div class="ui-sep"></div>

          <div class="ui-card">
            <h3 class="ui-cardTitle">Eventos</h3>
            <div id="ui-events" class="ui-muted" style="font-size:13px; line-height:1.45;"></div>
          </div>
        </aside>
      </div>
    </div>
  `;
}

export function renderAll(state) {
  const day = state?.currentDay || '—';
  const activeWeek = state?.activeWeekNumber ?? '—';
  const screen = state?.ui?.activeScreen || 'welcome';
  const weeks = normalizeWeeks(state?.weeks);
  const prsCount = state?.prs ? Object.keys(state.prs).length : 0;

  const subtitle = buildSubtitle({ weeksCount: weeks.length, activeWeek, day, screen });

  return {
    subtitle,
    weekBadge: `Semana: ${activeWeek}`,
    dayBadge: `Dia: ${day}`,
    weekChipsHtml: renderWeekChips({ weeks, activeWeek }),
    mainHtml: renderMain({ state, screen, weeks }),
    stateHtml: renderStatePanel({ day, prsCount, activeWeek, screen, weeksCount: weeks.length }),
  };
}

function buildSubtitle({ weeksCount, activeWeek, day, screen }) {
  if (!weeksCount) return 'Aguardando PDF multi-semana…';
  return `Semanas: ${weeksCount} • Semana ativa: ${activeWeek} • Dia: ${day} • Tela: ${screen}`;
}

function normalizeWeeks(weeks) {
  if (!Array.isArray(weeks)) return [];
  return weeks
    .map((w) => ({
      ...w,
      weekNumber: w?.weekNumber ?? w?.week,
    }))
    .filter((w) => Number.isFinite(Number(w.weekNumber)))
    .sort((a, b) => Number(a.weekNumber) - Number(b.weekNumber));
}

function renderWeekChips({ weeks, activeWeek }) {
  if (!weeks.length) return `<span class="ui-muted">Semanas: nenhuma (faça upload do PDF)</span>`;

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
        <h3 class="ui-cardTitle">Upload do PDF</h3>
        <p class="ui-muted" style="margin:0 0 10px 0;">
          Envie um PDF com múltiplas semanas para carregar a seleção de semanas e o treino do dia.
        </p>
        <button class="ui-btn ui-btnPrimary" data-action="pdf:pick">Selecionar PDF</button>
      </div>
    `;
  }

  const workout = normalizeWorkout(state?.workout);

  if (!workout) {
    return `
      <div class="ui-card">
        <h3 class="ui-cardTitle">Sem treino encontrado</h3>
        <p class="ui-muted" style="margin:0;">
          Nenhum treino para <strong>${escapeHtml(state?.currentDay || 'hoje')}</strong> na semana ativa.
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
        <span class="ui-kpi">Semana ativa: ${escapeHtml(state?.activeWeekNumber ?? '—')}</span>
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

function renderBlock(block, idx) {
  const title = block?.title || block?.name || `Bloco ${idx + 1}`;
  const lines = Array.isArray(block?.lines) ? block.lines : [];

  return `
    <div class="ui-block">
      <h4 class="ui-blockTitle">${escapeHtml(title)}</h4>
      ${lines.length ? lines.map(renderLine).join('') : `<div class="ui-muted">Sem linhas</div>`}
    </div>
  `;
}

function renderLine(line) {
  if (typeof line === 'string') {
    return `
      <div class="ui-line">
        <div>${escapeHtml(line)}</div>
        <div></div>
      </div>
    `;
  }

  if (!line || typeof line !== 'object') {
    return `
      <div class="ui-line">
        <div>${escapeHtml(String(line))}</div>
        <div></div>
      </div>
    `;
  }

  const raw =
    line.raw ??
    line.text ??
    line.line ??
    line.original ??
    '';

  const calculated =
    line.calculatedText ??
    line.calculated ??
    line.loadText ??
    line.load ??
    '';

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

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}
