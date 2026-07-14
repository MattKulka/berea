export type Sm2State = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
};

// Standard SM-2 spaced repetition, with quality on the classic 0-5 scale.
// Simplified UI maps four buttons to q = 1 (Again), 3 (Hard), 4 (Good), 5 (Easy).
export function nextReview(state: Sm2State, quality: number): Sm2State & { dueAt: Date } {
  let { easeFactor, intervalDays, repetitions } = state;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + intervalDays);

  return { easeFactor, intervalDays, repetitions, dueAt };
}
