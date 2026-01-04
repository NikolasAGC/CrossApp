export function bindAppEvents({ pushEventLine, rerender, toast }) {
  if (!window.__APP__?.on) {
    pushEventLine('EventBus indisponível.');
    return () => {};
  }

  const on = window.__APP__.on;

  const handlers = [
    ['app:ready', () => {
      pushEventLine('App pronto');
      rerender();
    }],

    ['pdf:uploading', (data) => {
      pushEventLine(`Enviando PDF: ${data?.fileName || ''}`.trim());
      toast('Enviando PDF…');
    }],

    ['pdf:uploaded', (data) => {
      pushEventLine(`PDF carregado (${data?.weeksCount ?? '?'} semanas)`);
      toast('PDF carregado');
      rerender();
    }],

    ['pdf:error', (data) => {
      pushEventLine(`Erro PDF: ${data?.error || 'desconhecido'}`);
      toast(data?.error || 'Erro no PDF');
      rerender();
    }],

    ['week:changed', (data) => {
      pushEventLine(`Semana: ${data?.weekNumber ?? '?'}`);
      rerender();
    }],

    ['day:changed', (data) => {
      pushEventLine(`Dia: ${data?.dayName ?? '?'}`);
      rerender();
    }],

    ['workout:loaded', (data) => {
      pushEventLine(`Treino: ${data?.workout?.day || 'dia'} (semana ${data?.week ?? '?'})`);
      rerender();
    }],

    ['pr:updated', (data) => {
      pushEventLine(`PR: ${data?.exercise ?? '?'} = ${data?.load ?? '?'}`);
      rerender();
    }],

    ['pr:removed', (data) => {
      pushEventLine(`PR removido: ${data?.exercise ?? '?'}`);
      rerender();
    }],

    ['prs:imported', (data) => {
      pushEventLine(`PRs importados: ${data?.imported ?? '?'}`);
      rerender();
    }],

    ['prs:exported', (data) => {
      pushEventLine(`PRs exportados: ${data?.count ?? '?'}`);
    }],
  ];

  handlers.forEach(([eventName, handler]) => on(eventName, handler));

  return () => {};
}
