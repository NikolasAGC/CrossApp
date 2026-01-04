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

// ========== IMPORTS ==========

// State & Events
import { getState, setState, subscribe, debugState } from './core/state/store.js';
import { on, emit } from './core/events/eventBus.js';

// Use-cases
import { calculateLoads } from './core/usecases/calculateLoads.js';
import { copyWorkout } from './core/usecases/copyWorkout.js';
import { exportWorkout } from './core/usecases/exportWorkout.js';
import { exportPRs } from './core/usecases/exportPRs.js';
import { importPRs } from './core/usecases/importPRs.js';
import { addOrUpdatePR, removePR, listAllPRs } from './core/usecases/managePRs.js';

// Adapters
import {
  saveMultiWeekPdf,
  loadParsedWeeks,
  getPdfInfo
} from './adapters/pdf/pdfRepository.js';

import { getWorkoutFromWeek } from './adapters/pdf/customPdfParser.js';
import { createStorage } from './adapters/storage/storageFactory.js';
import { isPdfJsAvailable } from './adapters/pdf/pdfReader.js';

// Utils
import { getDayName, isRestDay } from './core/utils/date.js';

console.log('📦 Imports OK');

// ========== STORAGES ==========

const prsStorage = createStorage('prs', 5000);
const prefsStorage = createStorage('preferences', 1000);
const activeWeekStorage = createStorage('active-week', 100);

// ========== INICIALIZAÇÃO ==========

/**
 * Inicializa aplicação
 */
export async function init() {
  console.log('🚀 Iniciando aplicação...');

  try {
    checkDependencies();
    await loadPersistedState();
    updateCurrentDay();
    await loadSavedWeeks();
    setupEventListeners();
    exposeDebugAPIs();

    emit('app:ready', { state: getState() });
    console.log('✅ Aplicação inicializada');

    return { success: true };

  } catch (error) {
    console.error('❌ Erro ao inicializar:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verifica se dependências necessárias estão disponíveis
 */
function checkDependencies() {
  if (!isPdfJsAvailable()) {
    console.warn('⚠️ PDF.js não disponível. Upload de PDF não funcionará.');
  }

  const storage = createStorage('test', 0);
  if (!storage.isAvailable()) {
    throw new Error('Nenhum storage disponível');
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
 * Carrega semanas do PDF (fluxo multi-week)
 */
async function loadSavedWeeks() {
  const result = await loadParsedWeeks();

  if (!result.success) {
    console.log('📄 Nenhuma semana salva');
    setState({ ui: { activeScreen: 'welcome' } });
    return;
  }

  const { weeks, metadata } = result.data;
  setState({ weeks });

  const savedWeek = await activeWeekStorage.get('active-week');
  const activeWeek = savedWeek || weeks[0].weekNumber;

  await selectActiveWeek(activeWeek);

  console.log('📄 Semanas carregadas:', metadata?.weekNumbers || weeks.map(w => w.weekNumber));
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
    if (newState.prs !== oldState.prs && newState.activeWeekNumber) {
      const week = newState.weeks?.find(w => w.weekNumber === newState.activeWeekNumber);
      if (week) {
        processWorkoutFromWeek(week);
      }
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

// ========== MULTI-WEEK CORE ==========

/**
 * Seleciona semana ativa
 * @param {number} weekNumber - Número da semana
 * @returns {Promise<Object>}
 */
export async function selectActiveWeek(weekNumber) {
  const state = getState();
  const week = state.weeks?.find(w => w.weekNumber === weekNumber);

  if (!week) {
    return { success: false, error: `Semana ${weekNumber} não encontrada` };
  }

  setState({ activeWeekNumber: weekNumber });
  await activeWeekStorage.set('active-week', weekNumber);

  console.log(`📅 Semana ativa: ${weekNumber}`);

  await processWorkoutFromWeek(week);
  emit('week:changed', { weekNumber });

  return { success: true };
}

/**
 * Processa treino do dia de uma semana específica
 * @param {Object} week - Semana parseada
 */
async function processWorkoutFromWeek(week) {
  const state = getState();
  const dayName = state.currentDay;

  if (isRestDay()) {
    setState({
      workout: null,
      ui: { activeScreen: 'rest' },
    });
    console.log('😴 Dia de descanso');
    return;
  }

  const workout = getWorkoutFromWeek(week, dayName);

  if (!workout) {
    setState({
      workout: null,
      ui: { activeScreen: 'welcome' },
    });
    console.log(`⚠️ Nenhum treino para ${dayName} na semana ${week.weekNumber}`);
    return;
  }

  // Calcula cargas (adaptar se estrutura de workout mudar)
  let hasWarnings = false;
  
  // workout tem estrutura: { day, blocks: [{ type, lines }] }
  // Precisamos adaptar para o calculateLoads que espera { sections }
  const workoutForCalc = {
    day: workout.day,
    sections: workout.blocks || [],
  };

  try {
    const loadResult = calculateLoads(workoutForCalc, state.prs, state.preferences);
    hasWarnings = loadResult.hasWarnings || false;
  } catch (error) {
    console.warn('Erro ao calcular cargas:', error);
  }

  setState({
    workout,
    ui: {
      activeScreen: 'workout',
      hasWarnings: hasWarnings,
    },
  });

  console.log(`💪 Treino carregado:`, {
    day: dayName,
    week: week.weekNumber,
    blocks: workout.blocks?.length || 0,
  });

  emit('workout:loaded', { workout, week: week.weekNumber });
}

// ========== PUBLIC ACTIONS ==========

/**
 * Upload de PDF multi-semana
 * @param {File} file - Arquivo PDF
 * @returns {Promise<Object>}
 */
export async function handleMultiWeekPdfUpload(file) {
  console.log('📤 Uploading multi-week PDF:', file.name);

  emit('pdf:uploading', { fileName: file.name });

  try {
    const result = await saveMultiWeekPdf(file);

    if (!result.success) {
      emit('pdf:error', { error: result.error });
      return result;
    }

    const weeks = result.data.parsedWeeks;
    setState({ weeks });

    await selectActiveWeek(weeks[0].weekNumber);

    emit('pdf:uploaded', {
      fileName: file.name,
      weeksCount: weeks.length,
      weekNumbers: weeks.map(w => w.weekNumber),
    });

    console.log('✅ PDF multi-semana carregado:', weeks.map(w => w.weekNumber));

    return { success: true, weeks };

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
    // Adapta estrutura: workout tem blocks, copyWorkout espera sections
    const workoutForCopy = {
      day: state.workout.day,
      sections: state.workout.blocks || [],
    };

    const result = copyWorkout(workoutForCopy, state.prs, state.preferences);

    if (!result.success) {
      return result;
    }

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

  // Adapta estrutura
  const workoutForExport = {
    day: state.workout.day,
    sections: state.workout.blocks || [],
  };

  const result = exportWorkout(workoutForExport, {
    exportedBy: 'Treino do Dia PWA',
    weekNumber: state.activeWeekNumber,
  });

  if (!result.success) {
    return result;
  }

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

// ========== DEBUG APIs ==========

/**
 * Expõe APIs para debug no console
 */
function exposeDebugAPIs() {
  window.__APP__ = {
    // ===== STATE =====
    getState,
    debugState,
    getWeeks: () => getState().weeks || [],
    getActiveWeek: () => getState().activeWeekNumber,

    // ===== PDF =====
    uploadMultiWeekPdf: handleMultiWeekPdfUpload,

    // ===== SEMANA =====
    selectWeek: selectActiveWeek,

    // ===== WORKOUT =====
    copyWorkout: handleCopyWorkout,
    exportWorkout: handleExportWorkout,

    // ===== PRs =====
    addPR: handleAddPR,
    removePR: handleRemovePR,
    listPRs: handleListPRs,
    exportPRs: handleExportPRs,
    importPRs: handleImportPRs,

    // ===== EVENTS =====
    on,
    emit
  };

  console.log('🐛 Debug APIs expostas: window.__APP__');
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
