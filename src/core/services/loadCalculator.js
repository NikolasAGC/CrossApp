import {
  calculatePercent,
  kgToLbs,
  roundToNearest,
  formatNumber
} from '../utils/math.js';

import { isValidPercent } from '../utils/validators.js';
import { getPR } from './prsService.js';

export function calculateLoad(exercise, percent, prs, options = {}) {
  const opts = {
    round: true,
    roundStep: 2.5,
    includeLbs: false,
    ...options
  };

  if (!exercise || !isValidPercent(percent)) {
    return { success: false };
  }

  const pr = getPR(prs, exercise);
  if (pr == null) {
    return {
      success: false,
      warning: true,
      missingPR: exercise
    };
  }

  let load = calculatePercent(pr, percent);
  if (opts.round) {
    load = roundToNearest(load, opts.roundStep);
  }

  const result = {
    success: true,
    exercise,
    percent,
    load,
    loadFormatted: `${formatNumber(load, 1)}kg`
  };

  if (opts.includeLbs) {
    const lbs = roundToNearest(kgToLbs(load), 5);
    result.lbsFormatted = `${formatNumber(lbs, 0)}lbs`;
  }

  return result;
}

export function formatLoadResult(result) {
  if (!result?.success) return '';
  return `→ ${result.loadFormatted}${result.lbsFormatted ? ` (${result.lbsFormatted})` : ''}`;
}
