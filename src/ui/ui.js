import { renderAppShell, renderAll } from './render.js';
import { setupActions } from './actions.js';
import { bindAppEvents } from './events.js';

export function mountUI({ root }) {
  if (!root) throw new Error('mountUI: root é obrigatório');

  ensureStylesheet('./src/ui/styles.css');
  ensureBg();

  root.innerHTML = renderAppShell();

  const subtitleEl = root.querySelector('#ui-subtitle');
  const weekBadgeEl = root.querySelector('#ui-weekBadge');
  const dayBadgeEl = root.querySelector('#ui-dayBadge');
  const weekChipsEl = root.querySelector('#ui-weekChips');
  const mainEl = root.querySelector('#ui-main');
  const stateEl = root.querySelector('#ui-state');
  const eventsEl = root.querySelector('#ui-events');

  const { toast } = ensureToast();

  const pushEventLine = createEventLog(eventsEl);

  const rerender = () => {
    const state = safeGetState();
    const view = renderAll(state);

    subtitleEl.textContent = view.subtitle;
    weekBadgeEl.textContent = view.weekBadge;
    dayBadgeEl.textContent = view.dayBadge;

    weekChipsEl.innerHTML = view.weekChipsHtml;
    mainEl.innerHTML = view.mainHtml;
    stateEl.innerHTML = view.stateHtml;
  };

  setupActions({ root, toast, rerender });

  bindAppEvents({
    pushEventLine,
    rerender,
    toast,
  });

  // Render inicial (sem assumir que app:ready foi emitido antes do mount)
  pushEventLine('UI montada');
  rerender();

  // API mínima (opcional) para debug/manual refresh
  return { rerender };
}

function safeGetState() {
  try {
    return window.__APP__?.getState ? window.__APP__.getState() : {};
  } catch {
    return {};
  }
}

function ensureStylesheet(href) {
  const id = 'ui-styles-link';
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function ensureBg() {
  // UI pode aplicar fundo sem tocar no index.html.
  document.documentElement.classList.add('ui-bg');
  document.body.classList.add('ui-bg');
}

function ensureToast() {
  let el = document.getElementById('ui-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ui-toast';
    el.className = 'ui-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }

  let timeout = null;

  const toast = (message) => {
    el.textContent = String(message ?? '');
    el.classList.add('ui-toastShow');
    clearTimeout(timeout);
    timeout = setTimeout(() => el.classList.remove('ui-toastShow'), 2200);
  };

  return { el, toast };
}

function createEventLog(containerEl) {
  const lines = [];

  const push = (msg) => {
    const time = new Date().toLocaleTimeString('pt-BR');
    lines.unshift(`${time}: ${msg}`);
    if (lines.length > 10) lines.pop();

    if (containerEl) {
      containerEl.innerHTML = lines.map((l) => `<div>${escapeHtml(l)}</div>`).join('');
    }
  };

  return push;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}
