export function setupActions({ root, toast, rerender }) {
  if (!root) throw new Error('setupActions: root é obrigatório');

  const modalBackdrop = root.querySelector('#ui-prsModalBackdrop');

  root.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;

    const action = el.dataset.action;

    try {
      switch (action) {
        case 'pdf:pick': {
          const file = await pickPdfFile();
          if (!file) return;
          await window.__APP__.uploadMultiWeekPdf(file);
          rerender();
          return;
        }

        case 'week:select': {
          const week = Number(el.dataset.week);
          if (!Number.isFinite(week)) return;
          await window.__APP__.selectWeek(week);
          rerender();
          return;
        }

        case 'day:auto': {
          const result = await window.__APP__.resetDay();
          if (!result?.success) throw new Error(result?.error || 'Falha ao voltar para automático');
          toast(`Dia automático: ${result.day}`);
          rerender();
          return;
        }

        case 'workout:copy': {
          const result = await window.__APP__.copyWorkout();
          if (!result?.success) throw new Error(result?.error || 'Falha ao copiar');
          toast('Treino copiado');
          return;
        }

        case 'workout:export': {
          const result = window.__APP__.exportWorkout();
          if (!result?.success) throw new Error(result?.error || 'Falha ao exportar');
          toast('Exportado');
          return;
        }

        // PRs - modal
        case 'prs:open': {
          openModal(modalBackdrop);
          rerender();
          focusFirstPrInput(root);
          return;
        }

        case 'prs:close': {
          closeModal(modalBackdrop);
          return;
        }

        case 'prs:add': {
          const nameEl = root.querySelector('#ui-prsNewName');
          const valueEl = root.querySelector('#ui-prsNewValue');
          const rawName = (nameEl?.value || '').trim();
          const value = Number(valueEl?.value);

          if (!rawName) throw new Error('Informe o nome do exercício');
          if (!Number.isFinite(value) || value <= 0) throw new Error('Informe um PR válido');

          const exercise = rawName.toUpperCase();
          const result = window.__APP__.addPR(exercise, value);
          if (!result?.success) throw new Error(result?.error || 'Falha ao adicionar PR');

          if (nameEl) nameEl.value = '';
          if (valueEl) valueEl.value = '';

          toast('PR salvo');
          rerender();
          return;
        }

        case 'prs:save': {
          const ex = el.dataset.exercise;
          const input = root.querySelector(`input[data-action="prs:editValue"][data-exercise="${cssEscape(ex)}"]`);
          const value = Number(input?.value);

          if (!ex) return;
          if (!Number.isFinite(value) || value <= 0) throw new Error('PR inválido');

          const result = window.__APP__.addPR(ex, value);
          if (!result?.success) throw new Error(result?.error || 'Falha ao salvar PR');

          toast('PR atualizado');
          rerender();
          return;
        }

        case 'prs:remove': {
          const ex = el.dataset.exercise;
          if (!ex) return;

          const ok = confirm(`Remover PR de "${ex}"?`);
          if (!ok) return;

          const result = window.__APP__.removePR(ex);
          if (!result?.success) throw new Error(result?.error || 'Falha ao remover PR');

          toast('PR removido');
          rerender();
          return;
        }

        case 'prs:export': {
          const result = window.__APP__.exportPRs();
          if (!result?.success) throw new Error(result?.error || 'Falha ao exportar PRs');
          toast('PRs exportados');
          return;
        }

        case 'prs:import': {
          const json = prompt('Cole aqui o JSON de PRs (ex: {"BACK SQUAT":120})');
          if (!json) return;

          const result = window.__APP__.importPRs(json);
          if (!result?.success) throw new Error(result?.error || 'Falha ao importar PRs');

          toast('PRs importados');
          rerender();
          return;
        }

        default:
          return;
      }
    } catch (err) {
      toast(err?.message || 'Erro');
      console.error(err);
    }
  });

  root.addEventListener('change', async (e) => {
    const el = e.target.closest('[data-action="day:set"]');
    if (!el) return;

    const dayName = el.value;
    if (!dayName) return;

    try {
      const result = await window.__APP__.setDay(dayName);
      if (!result?.success) throw new Error(result?.error || 'Falha ao definir dia');

      toast(`Dia manual: ${result.day}`);
      el.value = '';
      rerender();
    } catch (err) {
      toast(err?.message || 'Erro');
      console.error(err);
    }
  });

  // Fechar modal ao clicar fora
  modalBackdrop?.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal(modalBackdrop);
  });

  // Esc fecha modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen(modalBackdrop)) closeModal(modalBackdrop);
  });

  // Busca na tabela de PRs (filtro client-side)
  root.addEventListener('input', (e) => {
    const el = e.target;
    if (!el || el.id !== 'ui-prsSearch') return;
    filterPrRows(root, el.value);
  });
}

function pickPdfFile() {
  return new Promise((resolve) => {
    let input = document.getElementById('ui-pdf-input');

    if (!input) {
      input = document.createElement('input');
      input.id = 'ui-pdf-input';
      input.type = 'file';
      input.accept = 'application/pdf';
      input.hidden = true;
      document.body.appendChild(input);
    }

    input.value = '';
    input.onchange = (e) => resolve(e.target.files?.[0] || null);
    input.click();
  });
}

function openModal(backdrop) {
  if (!backdrop) return;
  backdrop.classList.add('isOpen');
  backdrop.setAttribute('aria-hidden', 'false');
}

function closeModal(backdrop) {
  if (!backdrop) return;
  backdrop.classList.remove('isOpen');
  backdrop.setAttribute('aria-hidden', 'true');
}

function isModalOpen(backdrop) {
  if (!backdrop) return false;
  return backdrop.classList.contains('isOpen');
}

function filterPrRows(root, query) {
  const q = String(query || '').trim().toUpperCase();
  const rows = Array.from(root.querySelectorAll('tr[data-pr-row]'));

  let visible = 0;
  rows.forEach((row) => {
    const key = (row.getAttribute('data-pr-row') || '').toUpperCase();
    const show = !q || key.includes(q);
    row.style.display = show ? '' : 'none';
    if (show) visible += 1;
  });

  const countEl = root.querySelector('#ui-prsCount');
  if (countEl) countEl.textContent = `${visible} PRs`;
}

function focusFirstPrInput(root) {
  const search = root.querySelector('#ui-prsSearch');
  if (search) search.focus();
}

function cssEscape(value) {
  // Escape mínimo para querySelector de atributo (evita quebrar com aspas)
  return String(value || '').replace(/"/g, '\\"');
}
