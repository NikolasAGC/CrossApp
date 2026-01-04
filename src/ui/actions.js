export function setupActions({ root, toast, rerender }) {
  if (!root) throw new Error('setupActions: root é obrigatório');

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
          // rerender via eventos (pdf:*), mas mantém fallback:
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
          if (!result?.success) throw new Error(result?.error || 'Falha ao exportar treino');
          toast('Treino exportado');
          return;
        }

        case 'prs:export': {
          const result = window.__APP__.exportPRs();
          if (!result?.success) throw new Error(result?.error || 'Falha ao exportar PRs');
          toast('PRs exportados');
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

    input.onchange = (e) => {
      const file = e.target.files?.[0] || null;
      resolve(file);
    };

    input.click();
  });
}
