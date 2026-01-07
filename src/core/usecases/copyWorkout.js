/**
 * Use-case: Copiar treino formatado
 */

import { calculateLoads } from './calculateLoads.js';
import { isValidWorkout } from '../services/workoutService.js';
import { getFullDayDescription } from '../utils/date.js';

export function copyWorkout(workout, prs, preferences = {}, options = {}) {
  const defaults = {
    includeHeader: true,
    includeDate: true,
    includeEmoji: preferences.showEmojis !== false,
    skipWarnings: false
  };

  const opts = { ...defaults, ...options };

  if (!isValidWorkout(workout)) {
    return {
      success: false,
      error: 'Treino inválido',
      text: ''
    };
  }

  let text = '';

  if (opts.includeHeader) {
    const emoji = opts.includeEmoji ? '💪 ' : '';
    text += `${emoji}TREINO - ${workout.day.toUpperCase()}\n`;

    if (opts.includeDate) {
      text += `${getFullDayDescription()}\n`;
    }

    text += '\n';
  }

  // 🔥 converte treino inteiro em texto cru
  const rawText = workout.sections
    .flatMap(section => section.lines || [])
    .join('\n');

  const results = calculateLoads(rawText, prs, preferences);

  results.forEach(r => {
    if (!r.line) return;

    if (r.success && r.loadFormatted) {
      text += `${r.line} → ${r.loadFormatted}\n`;
    } else {
      text += `${r.line}\n`;
    }
  });

  return {
    success: true,
    text: text.trim()
  };
}
