/**
 * PDF Parser
 * Transforma texto bruto em estrutura utilizável
 * Complementa o workoutService com limpeza específica de PDF
 */

import { normalizeSpaces, removeEmptyLines } from '../../core/utils/text.js';

/**
 * Limpa texto extraído de PDF (remove artefatos comuns)
 * @param {string} rawText - Texto bruto do PDF
 * @returns {string} Texto limpo
 */
export function cleanPdfText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }
  
  let cleaned = rawText;
  
  // Remove headers/footers comuns de PDF
  cleaned = removeCommonArtifacts(cleaned);
  
  // Normaliza quebras de linha
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\r/g, '\n');
  
  // Remove espaços extras
  cleaned = cleaned
    .split('\n')
    .map(line => normalizeSpaces(line))
    .join('\n');
  
  // Remove linhas vazias excessivas
  cleaned = removeEmptyLines(cleaned);
  
  // Remove caracteres de controle invisíveis
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  
  return cleaned.trim();
}

/**
 * Remove artefatos comuns de PDFs (URLs, emails, CPF, etc)
 * @param {string} text - Texto
 * @returns {string} Texto limpo
 */
function removeCommonArtifacts(text) {
  let cleaned = text;
  
  // Remove linhas com URLs
  cleaned = cleaned
    .split('\n')
    .filter(line => !line.includes('http://') && !line.includes('https://'))
    .join('\n');
  
  // Remove linhas com emails
  cleaned = cleaned
    .split('\n')
    .filter(line => !/@gmail\.com|@hotmail\.com|@yahoo\.com/.test(line))
    .join('\n');
  
  // Remove linhas com "Licensed to"
  cleaned = cleaned
    .split('\n')
    .filter(line => !line.includes('Licensed to'))
    .join('\n');
  
  // Remove linhas com CPF/CNPJ
  cleaned = cleaned
    .split('\n')
    .filter(line => !/^\d{3}\.\d{3}\.\d{3}/.test(line))
    .join('\n');
  
  // Remove linhas com # (hashtags/comentários)
  cleaned = cleaned
    .split('\n')
    .filter(line => !line.trim().startsWith('#'))
    .join('\n');
  
  return cleaned;
}

/**
 * Detecta formato/estrutura do PDF
 * @param {string} text - Texto do PDF
 * @returns {Object} Informações sobre formato
 */
export function detectPdfFormat(text) {
  if (!text || typeof text !== 'string') {
    return {
      valid: false,
      reason: 'Texto vazio',
    };
  }
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  if (lines.length < 10) {
    return {
      valid: false,
      reason: 'Texto muito curto (menos de 10 linhas)',
    };
  }
  
  // Detecta dias da semana
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const foundDays = days.filter(day => 
    text.toUpperCase().includes(day.toUpperCase())
  );
  
  // Detecta blocos de treino
  const hasWodBlocks = /WOD|AMRAP|FOR TIME|EMOM/i.test(text);
  
  // Detecta exercícios (palavras em maiúscula)
  const hasExercises = /\b[A-Z]{2,}(\s+[A-Z]{2,})+\b/.test(text);
  
  // Detecta percentuais
  const hasPercentages = /@\d+%/.test(text);
  
  return {
    valid: foundDays.length > 0,
    daysFound: foundDays.length,
    days: foundDays,
    hasWodBlocks: hasWodBlocks,
    hasExercises: hasExercises,
    hasPercentages: hasPercentages,
    totalLines: lines.length,
    estimatedFormat: foundDays.length >= 5 ? 'weekly_program' : 'single_workout',
  };
}

/**
 * Valida se texto contém treino válido
 * @param {string} text - Texto do PDF
 * @returns {Object} Resultado da validação
 */
export function validateWorkoutText(text) {
  const format = detectPdfFormat(text);
  
  if (!format.valid) {
    return {
      valid: false,
      error: format.reason || 'Formato inválido',
      suggestions: [
        'Certifique-se de que o PDF contém dias da semana',
        'Verifique se há exercícios em MAIÚSCULAS',
        'Confirme que o PDF não está vazio',
      ],
    };
  }
  
  if (format.daysFound === 0) {
    return {
      valid: false,
      error: 'Nenhum dia da semana encontrado no PDF',
      suggestions: [
        'O PDF deve conter nomes de dias (Segunda, Terça, etc)',
      ],
    };
  }
  
  if (!format.hasExercises) {
    return {
      valid: false,
      error: 'Nenhum exercício detectado',
      suggestions: [
        'Exercícios devem estar em MAIÚSCULAS (ex: BACK SQUAT)',
      ],
    };
  }
  
  return {
    valid: true,
    format: format,
  };
}

/**
 * Extrai resumo do PDF
 * @param {string} text - Texto do PDF
 * @returns {Object} Resumo
 */
export function extractSummary(text) {
  const format = detectPdfFormat(text);
  const lines = text.split('\n').filter(Boolean);
  
  // Conta exercícios únicos
  const exerciseMatches = text.match(/\b([A-Z][A-Z\s]+)\b/g) || [];
  const uniqueExercises = new Set(exerciseMatches.map(e => e.trim()));
  
  // Conta percentuais
  const percentMatches = text.match(/@(\d+)%/g) || [];
  
  return {
    totalLines: lines.length,
    daysFound: format.daysFound,
    days: format.days,
    uniqueExercises: uniqueExercises.size,
    percentageUsage: percentMatches.length,
    estimatedType: format.estimatedFormat,
    hasStructure: format.hasWodBlocks,
  };
}

/**
 * Converte texto do PDF para formato padronizado
 * @param {string} rawText - Texto bruto
 * @returns {string} Texto padronizado
 */
export function normalizePdfText(rawText) {
  let normalized = cleanPdfText(rawText);
  
  // Normaliza dias da semana (primeira letra maiúscula)
  const days = {
    'SEGUNDA': 'Segunda',
    'TERÇA': 'Terça',
    'QUARTA': 'Quarta',
    'QUINTA': 'Quinta',
    'SEXTA': 'Sexta',
    'SÁBADO': 'Sábado',
    'DOMINGO': 'Domingo',
  };
  
  Object.entries(days).forEach(([upper, proper]) => {
    const regex = new RegExp(`\\b${upper}\\b`, 'gi');
    normalized = normalized.replace(regex, proper);
  });
  
  return normalized;
}

/**
 * Retorna informações do parser
 * @returns {Object}
 */
export function getInfo() {
  return {
    name: 'PDF Parser',
    capabilities: [
      'Limpeza de artefatos',
      'Detecção de formato',
      'Validação de conteúdo',
      'Normalização de texto',
    ],
  };
}