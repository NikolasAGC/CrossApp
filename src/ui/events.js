export function bindAppEvents({ pushEventLine, rerender, toast }) {
  if (!window.__APP__?.on) {
    pushEventLine('EventBus indisponível (window.__APP__.on não encontrado).');
    return () => {};
  }

  const on = window.__APP__.on;

  const handlers = [
    ['app:ready', (data) => {
      pushEventLine('App pronto');
      rerender();
    }],

    ['pdf:uploading', (data) => {
      pushEventLine(`Enviando PDF: ${data?.fileName || ''}`.trim());
      toast('Enviando PDF…');
    }],

    ['pdf:uploaded', (data) => {
      pushEventLine(`PDF enviado (${data?.weeksCount ?? '?'} semanas)`);
      toast('PDF carregado');
      rerender();
    }],

    ['pdf:error', (data) => {
      pushEventLine(`Erro PDF: ${data?.error || 'desconhecido'}`);
      toast(data?.error || 'Erro no PDF');
      rerender();
    }],

    ['week:changed', (data) => {
      pushEventLine(`Semana mudou para ${data?.weekNumber ?? '?'}`);
      rerender();
    }],

    ['day:changed', (data) => {
      pushEventLine(`Dia mudou para ${data?.dayName ?? '?'}`);
      rerender();
    }],

    ['workout:loaded', (data) => {
      pushEventLine(`Treino carregado (${data?.workout?.day || 'dia'}) semana ${data?.week ?? '?'}`);
      rerender();
    }],

    ['pr:updated', (data) => {
      pushEventLine(`PR atualizado: ${data?.exercise ?? '?'} = ${data?.load ?? '?'}`);
      rerender();
    }],

    ['prs:imported', (data) => {
      pushEventLine(`PRs importados: ${data?.imported ?? '?'}`);
      rerender();
    }],
  ];

  handlers.forEach(([eventName, handler]) => on(eventName, handler));

  // eventBus atual não expõe "off"; então retorna no-op.
  // Se futuramente existir off(), dá pra implementar cleanup real aqui.
  return () => {};
}
