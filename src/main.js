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
    
    // Renderiza UI básica (será substituído por UI real depois)
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
      <h1>✅ Core + Adapters Integrados</h1>
      
      <div style="background: #f0f0f0; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
        <h2>📊 Estado Atual</h2>
        <ul>
          <li><strong>Dia:</strong> ${state.currentDay}</li>
          <li><strong>PDF carregado:</strong> ${state.pdfText ? '✅ Sim' : '❌ Não'}</li>
          <li><strong>PRs cadastrados:</strong> ${Object.keys(state.prs).length}</li>
          <li><strong>Tela ativa:</strong> ${state.ui.activeScreen}</li>
          <li><strong>Treino:</strong> ${state.workout ? '✅ Processado' : '⏳ Aguardando PDF'}</li>
        </ul>
      </div>
      
      <div style="background: #e3f2fd; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
        <h2>🧪 Testes no Console</h2>
        <pre style="background: #fff; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.9rem;">
// Ver estado
__APP__.debugState()

// Upload de PDF (cria input file)
const input = document.createElement('input');
input.type = 'file';
input.accept = 'application/pdf';
input.onchange = (e) => {
  __APP__.uploadPdf(e.target.files[0]);
};
input.click();

// Adicionar PR
__APP__.addPR('BACK SQUAT', 100)
__APP__.addPR('DEADLIFT', 150)

// Listar PRs
__APP__.listPRs()

// Exportar PRs
__APP__.exportPRs()

// Copiar treino (após upload)
__APP__.copyWorkout()

// Ver info do PDF
__APP__.getPdfInfo()
        </pre>
      </div>
      
      <div style="background: #fff3cd; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
        <h2>⚡ Eventos</h2>
        <p>Escute eventos do sistema:</p>
        <pre style="background: #fff; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.9rem;">
__APP__.on('pdf:uploaded', (data) => {
  console.log('PDF enviado:', data);
});

__APP__.on('pr:updated', (data) => {
  console.log('PR atualizado:', data);
});

__APP__.on('workout:loaded', (data) => {
  console.log('Treino carregado:', data);
});
        </pre>
      </div>
      
      <div style="margin-top: 2rem; padding: 1rem; background: #d4edda; border-radius: 8px;">
        <p style="margin: 0;"><strong>✅ Próximo passo:</strong> Implementar UI (components + screens)</p>
      </div>
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
      <p style="background: #ffebee; padding: 1rem; border-radius: 8px;">${errorMsg}</p>
      <button onclick="location.reload()" style="padding: 0.5rem 1rem; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Recarregar Página
      </button>
    </div>
  `;
}
