/**
 * Inicialização da aplicação
 * Dependency Injection acontece aqui
 */

import { getState, setState, debugState } from './core/state/store.js';
import { emit } from './core/events/eventBus.js';

export function init() {
  console.log('🚀 Iniciando aplicação...');
  
  // Expõe state globalmente para debug
  window.__STATE__ = { getState, setState, debugState };
  
  // Testa reatividade
  setState({ 
    currentDay: 'Segunda',
    ui: { activeScreen: 'welcome' }
  });
  
  // Testa event bus
  emit('app:ready', { timestamp: Date.now() });
  
  console.log('✅ Fundação carregada. Estado:', getState());
  console.log('💡 Teste no console: __STATE__.debugState()');
  
  // Renderiza placeholder
  document.getElementById('app').innerHTML = `
    <div style="padding: 2rem; font-family: system-ui;">
      <h1>✅ Fundação Reativa Funcionando</h1>
      <p>Abra o console e teste:</p>
      <pre style="background: #f5f5f5; padding: 1rem; border-radius: 8px;">
__STATE__.debugState()
__STATE__.setState({ currentDay: 'Terça' })
__EVENTS__.emit('test', { hello: 'world' })
      </pre>
    </div>
  `;
}
