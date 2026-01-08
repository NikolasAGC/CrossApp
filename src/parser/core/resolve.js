/**
 * Resolve - Resolução de exercícios
 */

export function resolveExercise({ extracted, context, prs }) {
  if (extracted && prs?.[extracted]) return extracted;
  if (context && prs?.[context]) return context;
  return extracted || context || null;
}
