/**
 * PDF Repository
 * Gerencia persistência de PDFs usando storage adapter
 */

import { createStorage } from '../storage/storageFactory.js';
import { extractTextFromFile, validatePdfFile, extractMetadata } from './pdfReader.js';
import { cleanPdfText, validateWorkoutText } from './pdfParser.js';
import { getTimestamp } from '../../core/utils/date.js';

const PDF_KEY = 'workout-pdf';
const METADATA_KEY = 'workout-pdf-metadata';

/**
 * Salva PDF (extrai texto e persiste)
 * @param {File} file - Arquivo PDF
 * @returns {Promise<Object>} Resultado
 */
export async function savePdf(file) {
  // Valida arquivo
  const validation = validatePdfFile(file);
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }
  
  try {
    // Extrai texto
    const rawText = await extractTextFromFile(file);
    
    if (!rawText || rawText.length < 50) {
      return {
        success: false,
        error: 'PDF vazio ou com muito pouco texto',
      };
    }
    
    // Limpa texto
    const cleanedText = cleanPdfText(rawText);
    
    // Valida conteúdo
    const contentValidation = validateWorkoutText(cleanedText);
    
    if (!contentValidation.valid) {
      return {
        success: false,
        error: contentValidation.error,
        suggestions: contentValidation.suggestions,
      };
    }
    
    // Extrai metadados (opcional, não bloqueia se falhar)
    let metadata = null;
    try {
      metadata = await extractMetadata(file);
    } catch {
      // Ignora erro de metadata
    }
    
    // Escolhe storage apropriado baseado em tamanho
    const storage = createStorage(PDF_KEY, cleanedText.length);
    
    // Salva texto
    await storage.set(PDF_KEY, cleanedText);
    
    // Salva metadados
    const metadataToSave = {
      uploadedAt: getTimestamp(),
      fileName: file.name,
      fileSize: file.size,
      textLength: cleanedText.length,
      format: contentValidation.format,
      pdfMetadata: metadata,
    };
    
    const metaStorage = createStorage(METADATA_KEY, 1000);
    await metaStorage.set(METADATA_KEY, metadataToSave);
    
    console.log('✅ PDF salvo:', {
      file: file.name,
      size: validation.sizeFormatted,
      textLength: cleanedText.length,
      storage: storage.getInfo().name,
    });
    
    return {
      success: true,
      data: {
        text: cleanedText,
        metadata: metadataToSave,
      },
      storageName: storage.getInfo().name,
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao processar PDF: ' + error.message,
    };
  }
}

/**
 * Carrega PDF salvo
 * @returns {Promise<Object>} Resultado
 */
export async function loadPdf() {
  try {
    // Tenta localStorage primeiro (mais rápido)
    const storage = createStorage(PDF_KEY, 0);
    const text = await storage.get(PDF_KEY);
    
    if (!text) {
      return {
        success: false,
        error: 'Nenhum PDF salvo',
        data: null,
      };
    }
    
    // Carrega metadados
    const metaStorage = createStorage(METADATA_KEY, 0);
    const metadata = await metaStorage.get(METADATA_KEY);
    
    return {
      success: true,
      data: {
        text: text,
        metadata: metadata || null,
      },
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao carregar PDF: ' + error.message,
      data: null,
    };
  }
}

/**
 * Verifica se há PDF salvo
 * @returns {Promise<boolean>}
 */
export async function hasSavedPdf() {
  try {
    const storage = createStorage(PDF_KEY, 0);
    return await storage.has(PDF_KEY);
  } catch {
    return false;
  }
}

/**
 * Remove PDF salvo
 * @returns {Promise<void>}
 */
export async function removePdf() {
  try {
    const storage = createStorage(PDF_KEY, 0);
    await storage.remove(PDF_KEY);
    
    const metaStorage = createStorage(METADATA_KEY, 0);
    await metaStorage.remove(METADATA_KEY);
    
    console.log('✅ PDF removido');
  } catch (error) {
    console.warn('Erro ao remover PDF:', error);
  }
}

/**
 * Retorna metadados do PDF salvo
 * @returns {Promise<Object|null>}
 */
export async function getPdfMetadata() {
  try {
    const metaStorage = createStorage(METADATA_KEY, 0);
    return await metaStorage.get(METADATA_KEY);
  } catch {
    return null;
  }
}

/**
 * Retorna informações sobre PDF salvo
 * @returns {Promise<Object>}
 */
export async function getPdfInfo() {
  const hasPdf = await hasSavedPdf();
  
  if (!hasPdf) {
    return {
      exists: false,
    };
  }
  
  const metadata = await getPdfMetadata();
  
  return {
    exists: true,
    uploadedAt: metadata?.uploadedAt || null,
    fileName: metadata?.fileName || 'Desconhecido',
    fileSize: metadata?.fileSize || 0,
    textLength: metadata?.textLength || 0,
    format: metadata?.format || null,
  };
}

/**
 * Atualiza PDF (substitui existente)
 * @param {File} file - Novo arquivo PDF
 * @returns {Promise<Object>} Resultado
 */
export async function updatePdf(file) {
  // Remove PDF antigo
  await removePdf();
  
  // Salva novo
  return await savePdf(file);
}
import { parseMultiWeekPdf, validateCustomPdfFormat, detectWeekNumbers } from './customPdfParser.js';

/**
 * Salva PDF com suporte a múltiplas semanas
 * @param {File} file - Arquivo PDF
 * @returns {Promise<Object>}
 */
export async function saveMultiWeekPdf(file) {
  const validation = validatePdfFile(file);
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }
  
  try {
    const rawText = await extractTextFromFile(file);
    
    if (!rawText || rawText.length < 50) {
      return {
        success: false,
        error: 'PDF vazio ou com muito pouco texto',
      };
    }
    
    const cleanedText = cleanPdfText(rawText);
    
    // Valida formato específico
    const formatValidation = validateCustomPdfFormat(cleanedText);
    
    if (!formatValidation.valid) {
      return {
        success: false,
        error: formatValidation.error,
      };
    }
    
    // Parse de múltiplas semanas
    const parsedWeeks = parseMultiWeekPdf(cleanedText);
    
    // Escolhe storage apropriado
    const storage = createStorage('multi-week-pdf', cleanedText.length);
    
    // Salva texto bruto
    await storage.set('multi-week-pdf-text', cleanedText);
    
    // Salva semanas parseadas
    await storage.set('multi-week-pdf-parsed', parsedWeeks);
    
    // Salva metadados
    const metadata = {
      uploadedAt: getTimestamp(),
      fileName: file.name,
      fileSize: file.size,
      textLength: cleanedText.length,
      weekNumbers: formatValidation.weekNumbers,
      weeksCount: formatValidation.weeksCount,
    };
    
    const metaStorage = createStorage('multi-week-metadata', 1000);
    await metaStorage.set('multi-week-metadata', metadata);
    
    console.log('✅ PDF multi-semana salvo:', {
      file: file.name,
      weeks: formatValidation.weekNumbers,
      storage: storage.getInfo().name,
    });
    
    return {
      success: true,
      data: {
        text: cleanedText,
        parsedWeeks: parsedWeeks,
        metadata: metadata,
      },
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao processar PDF: ' + error.message,
    };
  }
}

/**
 * Carrega semanas parseadas
 * @returns {Promise<Object>}
 */
export async function loadParsedWeeks() {
  try {
    const storage = createStorage('multi-week-pdf-parsed', 0);
    const parsedWeeks = await storage.get('multi-week-pdf-parsed');
    
    if (!parsedWeeks) {
      return {
        success: false,
        error: 'Nenhuma semana salva',
        data: null,
      };
    }
    
    const metaStorage = createStorage('multi-week-metadata', 0);
    const metadata = await metaStorage.get('multi-week-metadata');
    
    return {
      success: true,
      data: {
        weeks: parsedWeeks,
        metadata: metadata || null,
      },
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao carregar semanas: ' + error.message,
      data: null,
    };
  }
}
