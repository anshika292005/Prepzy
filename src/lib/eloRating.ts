/**
 * Elo rating system logic for tracking and updating student skill scores.
 */

const DIFFICULTY_ELO = { Easy: 1000, Medium: 1200, Hard: 1500 };
const K_FACTORS = { Easy: 16, Medium: 24, Hard: 32 };

/**
 * Calculates the expected win probability (score) for a student against a specific question based on Elo rating system.
 * @param studentScore The student's current skill score.
 * @param questionDifficulty The question's assigned difficulty rating in Elo format.
 * @returns The expected probability of the student answering correctly (between 0 and 1).
 */
export function expectedScore(studentScore: number, questionDifficulty: number): number {
  return 1 / (1 + Math.pow(10, (questionDifficulty - studentScore) / 400));
}

/**
 * Updates a student's skill score based on their performance on a single question.
 * @param currentScore The student's current skill score.
 * @param isCorrect Whether the student answered the question correctly.
 * @param difficulty The difficulty tier of the question.
 * @returns The newly updated, clamped, and rounded integer skill score.
 */
export function updateSkillScore(
  currentScore: number,
  isCorrect: boolean,
  difficulty: 'Easy' | 'Medium' | 'Hard'
): number {
  const diffElo = DIFFICULTY_ELO[difficulty];
  const kFactor = K_FACTORS[difficulty];
  const actual = isCorrect ? 1 : 0;
  
  const expected = expectedScore(currentScore, diffElo);
  
  let newScore = currentScore + kFactor * (actual - expected);
  
  newScore = Math.max(600, Math.min(2000, newScore));
  
  return Math.round(newScore);
}

/**
 * Maps a numerical skill score to a descriptive user-facing label.
 * @param score The student's skill score.
 * @returns A descriptive string rating label.
 */
export function getSkillLabel(score: number): string {
  if (score < 1000) return 'Beginner';
  if (score < 1200) return 'Developing';
  if (score < 1400) return 'Intermediate';
  if (score < 1600) return 'Advanced';
  if (score < 1800) return 'Advanced'; // Following the prompt specifications strictly
  return 'Expert';
}

/**
 * Derives the optimal question difficulty grouping for a given skill score.
 * @param score The student's current skill score.
 * @returns The difficulty tier string to target.
 */
export function getDifficultyFromScore(score: number): 'Easy' | 'Medium' | 'Hard' {
  if (score < 1100) return 'Easy';
  if (score < 1300) return 'Medium';
  return 'Hard';
}

/**
 * Processes a chunk or batch of session results, applying the Elo algorithm cumulatively to return the final resultant score.
 * @param currentScore The student's starting skill score for the session.
 * @param results An array of the answers provided in the session containing correctness and difficulty level.
 * @returns The new cumulative score.
 */
export function processSessionResults(
  currentScore: number,
  results: Array<{ isCorrect: boolean; difficulty: string }>
): number {
  return results.reduce((accScore, result) => {
    // We enforce cast to match the constrained keys if passing string
    const diff = result.difficulty as 'Easy' | 'Medium' | 'Hard';
    return updateSkillScore(accScore, result.isCorrect, diff);
  }, currentScore);
}
