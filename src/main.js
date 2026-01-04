/**
 * Entry point da aplicação
 * Registra Service Worker e inicializa app
 */

import { init } from './app.js';

// Registra Service Worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => console.log('✅ Service Worker registrado:', reg.scope))
      .catch(err => console.error('❌ Erro no Service Worker:', err));
  });
}

// Inicializa aplicação
init().then(result => {
  if (result.success) {
    console.log('✅ App pronto para uso');
    renderPlaceholder();
  } else {
    console.error('❌ Falha na inicialização:', result.error);
    renderError(result.error);
  }
});

/**
 * Renderiza placeholder enquanto UI não está pronta
 */
function renderPlaceholder() {
  const state = window.__APP__.getState();
  
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = `
    <div style="padding: 2rem; font-family: system-ui; max-width: 800px; margin: 0 auto;">
      <h1>✅ PWA Multi-Semana Pronto</h1>
      
      <div style="background: #f0f0f0; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
        <h2>📊 Estado Atual</h2>
        <ul>
          <li><strong>Dia:</strong> ${state.currentDay || 'Não definido'}</li>
          <li><strong>Semanas carregadas:</strong> ${state.weeks?.length || 0}</li>
          <li><strong>Semana ativa:</strong> ${state.activeWeekNumber || 'Nenhuma'}</li>
          <li><strong>PRs cadastrados:</strong> ${Object.keys(state.prs).length}</li>
          <li><strong>Tela ativa:</strong> ${state.ui.activeScreen}</li>
          <li><strong>Treino:</strong> ${state.workout ? `✅ ${state.workout.day} (${state.workout.blocks?.length || 0} blocos)` : '⏳ Aguardando PDF'}</li>
        </ul>
      </div>
      
      <div style="background: #e3f2fd; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
        <h2>🧪 Teste Multi-Semana no Console</h2>
        <pre style="background: #fff; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.9rem;">
// 1. Ver estado completo
__APP__.debugState()

// 2. Upload PDF com múltiplas semanas
const input = document.createElement('input');
input.type = 'file';
input.accept = 'application/pdf';
input.onchange = async (e) => {
  const result = await __APP__.uploadMultiWeekPdf(e.target.files[0]);
  console.log('Upload:', result);
  console.log('Semanas:', __APP__.getWeeks());
  console.log('Semana ativa:', __APP__.getActiveWeek());
};
input.click();

// 3. Trocar semana (após upload)
__APP__.selectWeek(19)
__APP__.selectWeek(18)

// 4. Adicionar PRs
__APP__.addPR('BACK SQUAT', 100)
__APP__.addPR('DEADLIFT', 150)
__APP__.addPR('BENCH PRESS', 80)

// 5. Listar PRs
__APP__.listPRs()

// 6. Copiar treino (após upload)
await __APP__.copyWorkout()

// 7. Exportar treino
__APP__.exportWorkout()

// 8. Exportar/Importar PRs
__APP__.exportPRs()

const prsJson = '{"BACK SQUAT": 120, "DEADLIFT": 160}';
__APP__.importPRs(prsJson);

// 9. Info do PDF
__APP__.getPdfInfo().then(info => console.log('PDF info:', info));
        </pre>
      </div>
      
      <div style="background: #fff3cd; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
        <h2>⚡ Eventos em Tempo Real</h2>
        <p>Escute eventos do sistema:</p>
        <pre style="background: #fff; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.9rem;">
__APP__.on('pdf:uploaded', (data) => {
  console.log('PDF enviado:', data);
});

__APP__.on('week:changed', (data) => {
  console.log('Semana mudou:', data.weekNumber);
});

__APP__.on('pr:updated', (data) => {
  console.log('PR atualizado:', data.exercise, data.load);
});

__APP__.on('workout:loaded', (data) => {
  console.log('Treino carregado:', data.workout.day, 'Semana:', data.week);
});
        </pre>
      </div>
      
      <div style="margin-top: 2rem; padding: 1rem; background: #d4edda; border-radius: 8px;">
        <p style="margin: 0;">
          <strong>✅ Arquitetura limpa e funcional:</strong><br>
          Multi-week parseado, persistência automática, event-driven.<br>
          <strong>Próximo passo:</strong> UI de seleção de semana + renderização de treinos.
        </p>
      </div>
      
      ${renderWeeksDebug(state)}
    </div>
  `;
}

/**
 * Renderiza debug de semanas carregadas
 */
function renderWeeksDebug(state) {
  if (!state.weeks || state.weeks.length === 0) {
    return '';
  }
  
  const weeksHtml = state.weeks.map(week => {
    const isActive = week.weekNumber === state.activeWeekNumber;
    const days = week.workouts?.map(w => w.day).join(', ') || 'Nenhum';
    
    return `
      <div style="padding: 0.5rem; background: ${isActive ? '#e8f5e9' : '#fff'}; border-left: 3px solid ${isActive ? '#4caf50' : '#ccc'}; margin-bottom: 0.5rem;">
        <strong>Semana ${week.weekNumber}</strong> ${isActive ? '✅ ATIVA' : ''}
        <br>
        <small>Dias: ${days}</small>
      </div>
    `;
  }).join('');
  
  return `
    <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
      <h2>📅 Semanas Carregadas</h2>
      ${weeksHtml}
    </div>
  `;
}

/**
 * Renderiza erro de inicialização
 */
function renderError(errorMsg) {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = `
    <div style="padding: 2rem; font-family: system-ui; max-width: 600px; margin: 0 auto; text-align: center;">
      <h1 style="color: #d32f2f;">❌ Erro ao Inicializar</h1>
      <p style="background: #ffebee; padding: 1rem; border-radius: 8px; color: #d32f2f;">
        ${errorMsg}
      </p>
      <button onclick="location.reload()" style="padding: 0.75rem 1.5rem; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;">
        🔄 Recarregar Página
      </button>
      
      <div style="margin-top: 2rem; padding: 1rem; background: #fff3cd; border-radius: 8px; text-align: left;">
        <h3>🔧 Possíveis soluções:</h3>
        <ul style="text-align: left;">
          <li>Verifique se o navegador suporta localStorage/IndexedDB</li>
          <li>Limpe o cache do navegador</li>
          <li>Verifique o console para mais detalhes</li>
          <li>Tente usar modo anônimo para descartar extensões</li>
        </ul>
      </div>
    </div>
  `;
}
