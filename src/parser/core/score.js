/**
 * Score - Pontuação de exercícios
 */

export function scoreExercise(exercise, prs) {
  if (!exercise) return 0;
  if (prs?.[exercise]) return 100;
  return 10;
}
