/**
 * App Initialization
 * Dependency Injection e orquestração de módulos
 * 
 * Responsabilidades:
 * - Inicializar state
 * - Conectar adapters
 * - Carregar dados persistidos
 * - Expor APIs para UI
 */
console.log('📦 app.js carregado');
import { getState, setState, subscribe, debugState } from './core/state/store.js';
import { on, emit } from './core/events/eventBus.js';

// Use-cases
import { getWorkoutOfDay } from './core/usecases/getWorkoutOfDay.js';
import { calculateLoads } from './core/usecases/calculateLoads.js';
import { copyWorkout } from './core/usecases/copyWorkout.js';
import { exportWorkout } from './core/usecases/exportWorkout.js';
import { exportPRs } from './core/usecases/exportPRs.js';
import { importPRs } from './core/usecases/importPRs.js';
import { addOrUpdatePR, removePR, listAllPRs } from './core/usecases/managePRs.js';

// Adapters
import { savePdf, loadPdf, hasSavedPdf, getPdfInfo } from './adapters/pdf/pdfRepository.js';
import { createStorage } from './adapters/storage/storageFactory.js';
import { isPdfJsAvailable } from './adapters/pdf/pdfReader.js';

// Utils
import { getDayName, getFullDayDescription, isRestDay } from './core/utils/date.js';
console.log('📦 Imports OK');

// Storage adapters
const prsStorage = createStorage('prs', 5000);
const prefsStorage = createStorage('preferences', 1000);

/**
 * Inicializa aplicação
 */
export async function init() {
  console.log('🚀 Iniciando aplicação...');
  exposeDebugAPIs();
console.log('🧪 __APP__ exposto');
  try {
    // 1. Verifica dependências
    checkDependencies();
    
    // 2. Carrega estado persistido
    await loadPersistedState();
    
    // 3. Atualiza dia atual
    updateCurrentDay();
    
    // 4. Carrega PDF salvo (se existir)
    await loadSavedPdf();
    
    // 5. Setup de eventos
    setupEventListeners();
    
    // 6. Expõe APIs globalmente para debug
    exposeDebugAPIs();
    
    // 7. Dispara evento de inicialização completa
    emit('app:ready', {
      timestamp: new Date().toISOString(),
      state: getState(),
    });
    
    console.log('✅ Aplicação inicializada com sucesso');
    console.log('💡 Use window.__APP__ para debug');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erro ao inicializar aplicação:', error);
    
    emit('app:error', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verifica se dependências necessárias estão disponíveis
 */
function checkDependencies() {
  // Verifica PDF.js
  if (!isPdfJsAvailable()) {
    console.warn('⚠️ PDF.js não disponível. Upload de PDF não funcionará.');
  }
  
  // Verifica localStorage/IndexedDB
  const storage = createStorage('test', 0);
  if (!storage.isAvailable()) {
    throw new Error('Nenhum storage disponível (localStorage e IndexedDB indisponíveis)');
  }
  
  console.log('✅ Dependências verificadas');
}

/**
 * Carrega estado persistido (PRs e preferências)
 */
async function loadPersistedState() {
  try {
    // Carrega PRs
    const savedPRs = await prsStorage.get('prs');
    if (savedPRs && typeof savedPRs === 'object') {
      setState({ prs: savedPRs });
      console.log(`📊 ${Object.keys(savedPRs).length} PRs carregados`);
    }
    
    // Carrega preferências
    const savedPrefs = await prefsStorage.get('preferences');
    if (savedPrefs && typeof savedPrefs === 'object') {
      setState({
        preferences: {
          ...getState().preferences,
          ...savedPrefs,
        },
      });
      console.log('⚙️ Preferências carregadas');
    }
    
  } catch (error) {
    console.warn('Erro ao carregar estado persistido:', error);
  }
}

/**
 * Atualiza dia atual no state
 */
function updateCurrentDay() {
  const dayName = getDayName();
  setState({ currentDay: dayName });
  console.log(`📅 Dia atual: ${dayName}`);
}

/**
 * Carrega PDF salvo (se existir)
 */
async function loadSavedPdf() {
  try {
    const hasPdf = await hasSavedPdf();
    
    if (!hasPdf) {
      console.log('📄 Nenhum PDF salvo');
      setState({
        ui: { activeScreen: 'welcome' },
      });
      return;
    }
    
    const result = await loadPdf();
    
    if (!result.success) {
      console.warn('Erro ao carregar PDF:', result.error);
      return;
    }
    
    const pdfText = result.data.text;
    const metadata = result.data.metadata;
    
    // Salva texto no state
    setState({ pdfText });
    
    console.log('📄 PDF carregado:', {
      file: metadata?.fileName || 'Desconhecido',
      size: metadata?.textLength || 0,
      uploadedAt: metadata?.uploadedAt || 'N/A',
    });
    
    // Processa treino do dia
    await processWorkout();
    
  } catch (error) {
    console.warn('Erro ao carregar PDF salvo:', error);
  }
}

/**
 * Processa treino do dia baseado no PDF carregado
 */
async function processWorkout() {
  const state = getState();
  
  if (!state.pdfText) {
    console.warn('Nenhum PDF carregado para processar');
    return;
  }
  
  try {
    // Obtém treino do dia
    const result = getWorkoutOfDay(state.pdfText, new Date());
    
    if (!result.success) {
      console.warn('Erro ao obter treino:', result.error);
      setState({
        ui: { activeScreen: 'welcome' },
      });
      return;
    }
    
    const workout = result.data;
    
    // Verifica se é dia de descanso
    if (isRestDay()) {
      setState({
        workout: null,
        ui: { activeScreen: 'rest' },
      });
      console.log('😴 Dia de descanso');
      return;
    }
    
    // Se não há treino para hoje
    if (!workout) {
      setState({
        workout: null,
        ui: { activeScreen: 'welcome' },
      });
      console.log('⚠️ Nenhum treino para hoje');
      return;
    }
    
    // Calcula cargas
    const loadResult = calculateLoads(workout, state.prs, state.preferences);
    
    // Atualiza state
    setState({
      workout: workout,
      ui: {
        activeScreen: 'workout',
        hasWarnings: loadResult.hasWarnings || false,
      },
    });
    
    console.log('💪 Treino processado:', {
      day: workout.day,
      sections: workout.sections?.length || 0,
      warnings: loadResult.hasWarnings,
      missingPRs: loadResult.missingPRs || [],
    });
    
    emit('workout:loaded', { workout, loadResult });
    
  } catch (error) {
    console.error('Erro ao processar treino:', error);
  }
}

/**
 * Setup de event listeners
 */
function setupEventListeners() {
  // Listener: Salvar PRs quando state mudar
  subscribe((newState, oldState) => {
    if (newState.prs !== oldState.prs) {
      savePRsToStorage(newState.prs);
    }
  });
  
  // Listener: Salvar preferências quando mudarem
  subscribe((newState, oldState) => {
    if (newState.preferences !== oldState.preferences) {
      savePreferencesToStorage(newState.preferences);
    }
  });
  
  // Listener: Reprocessar treino quando PRs mudarem
  subscribe((newState, oldState) => {
    if (newState.prs !== oldState.prs && newState.pdfText) {
      processWorkout();
    }
  });
  
  console.log('🎧 Event listeners configurados');
}

/**
 * Salva PRs no storage
 */
async function savePRsToStorage(prs) {
  try {
    await prsStorage.set('prs', prs);
    console.log('💾 PRs salvos:', Object.keys(prs).length);
  } catch (error) {
    console.warn('Erro ao salvar PRs:', error);
  }
}

/**
 * Salva preferências no storage
 */
async function savePreferencesToStorage(preferences) {
  try {
    await prefsStorage.set('preferences', preferences);
    console.log('💾 Preferências salvas');
  } catch (error) {
    console.warn('Erro ao salvar preferências:', error);
  }
}

/**
 * Expõe APIs para debug no console
 */
function exposeDebugAPIs() {
  window.__APP__ = {
    // State
    getState,
    setState,
    debugState,
    
    // Actions
    uploadPdf: handlePdfUpload,
    copyWorkout: handleCopyWorkout,
    exportWorkout: handleExportWorkout,
    addPR: handleAddPR,
    removePR: handleRemovePR,
    listPRs: handleListPRs,
    exportPRs: handleExportPRs,
    importPRs: handleImportPRs,
    
    // Info
    getPdfInfo,
    processWorkout,
    
    // Utils
    emit,
    on,
  };
}

// ========== PUBLIC ACTIONS (usadas por UI e debug) ==========

/**
 * Upload de PDF
 * @param {File} file - Arquivo PDF
 * @returns {Promise<Object>}
 */
export async function handlePdfUpload(file) {
  console.log('📤 Uploading PDF:', file.name);
  
  emit('pdf:uploading', { fileName: file.name });
  
  try {
    // Salva PDF
    const result = await savePdf(file);
    
    if (!result.success) {
      emit('pdf:error', { error: result.error });
      return result;
    }
    
    const pdfText = result.data.text;
    
    // Atualiza state
    setState({ pdfText });
    
    // Processa treino
    await processWorkout();
    
    emit('pdf:uploaded', { fileName: file.name });
    
    console.log('✅ PDF carregado com sucesso');
    
    return { success: true };
    
  } catch (error) {
    const errorMsg = error.message || 'Erro desconhecido';
    emit('pdf:error', { error: errorMsg });
    
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Copiar treino
 * @returns {Promise<Object>}
 */
export async function handleCopyWorkout() {
  const state = getState();
  
  if (!state.workout) {
    return {
      success: false,
      error: 'Nenhum treino carregado',
    };
  }
  
  try {
    const result = copyWorkout(state.workout, state.prs, state.preferences);
    
    if (!result.success) {
      return result;
    }
    
    // Copia para clipboard
    await navigator.clipboard.writeText(result.text);
    
    emit('workout:copied', { lineCount: result.lineCount });
    
    console.log('📋 Treino copiado');
    
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Exportar treino
 * @returns {Object}
 */
export function handleExportWorkout() {
  const state = getState();
  
  if (!state.workout) {
    return {
      success: false,
      error: 'Nenhum treino carregado',
    };
  }
  
  const result = exportWorkout(state.workout, {
    exportedBy: 'Treino do Dia PWA',
  });
  
  if (!result.success) {
    return result;
  }
  
  // Cria download
  downloadFile(result.json, result.filename, 'application/json');
  
  emit('workout:exported', { filename: result.filename });
  
  console.log('💾 Treino exportado:', result.filename);
  
  return { success: true };
}

/**
 * Adicionar/Atualizar PR
 * @param {string} exerciseName - Nome do exercício
 * @param {number} load - Carga máxima
 * @returns {Object}
 */
export function handleAddPR(exerciseName, load) {
  const state = getState();
  const result = addOrUpdatePR(state.prs, exerciseName, load);
  
  if (!result.success) {
    return result;
  }
  
  setState({ prs: result.data });
  
  emit('pr:updated', {
    exercise: exerciseName,
    load: load,
    isNew: result.isNew,
  });
  
  console.log(`💪 PR ${result.isNew ? 'adicionado' : 'atualizado'}:`, exerciseName, load);
  
  return { success: true };
}

/**
 * Remover PR
 * @param {string} exerciseName - Nome do exercício
 * @returns {Object}
 */
export function handleRemovePR(exerciseName) {
  const state = getState();
  const result = removePR(state.prs, exerciseName);
  
  if (!result.success) {
    return result;
  }
  
  setState({ prs: result.data });
  
  emit('pr:removed', { exercise: exerciseName });
  
  console.log('🗑️ PR removido:', exerciseName);
  
  return { success: true };
}

/**
 * Listar PRs
 * @returns {Object}
 */
export function handleListPRs() {
  const state = getState();
  return listAllPRs(state.prs);
}

/**
 * Exportar PRs
 * @returns {Object}
 */
export function handleExportPRs() {
  const state = getState();
  const result = exportPRs(state.prs);
  
  if (!result.success) {
    return result;
  }
  
  downloadFile(result.json, result.filename, 'application/json');
  
  emit('prs:exported', { count: result.count });
  
  console.log('💾 PRs exportados:', result.count);
  
  return { success: true };
}

/**
 * Importar PRs
 * @param {string} jsonString - JSON de PRs
 * @returns {Object}
 */
export function handleImportPRs(jsonString) {
  const state = getState();
  const result = importPRs(jsonString, state.prs, {
    merge: true,
    overwrite: true,
  });
  
  if (!result.success) {
    return result;
  }
  
  setState({ prs: result.data });
  
  emit('prs:imported', {
    imported: result.imported,
    total: result.total,
  });
  
  console.log('📥 PRs importados:', result.imported);
  
  return { success: true };
}

// ========== HELPERS ==========

/**
 * Cria download de arquivo
 * @param {string} content - Conteúdo do arquivo
 * @param {string} filename - Nome do arquivo
 * @param {string} mimeType - MIME type
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}
