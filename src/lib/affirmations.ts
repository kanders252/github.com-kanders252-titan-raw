export const AFFIRMATIONS = [
  "Every bite of living food is an act of abundance.",
  "Eat the rainbow today. Your cells are celebrating.",
  "Fresh, whole, alive: you are nourished on every level.",
  "There's always room for more fruit, more greens, more joy.",
  "Hydration is your first gift to yourself each morning.",
  "Seasonal produce is nature's perfect timing on your plate.",
  "Sprouts, seeds and sunshine: you're fuelled by life itself.",
  "Generous portions of plants make a generous spirit.",
  "Your plate is a garden. Fill it with color.",
  "Enzymes intact, energy abundant. Keep it raw and radiant.",
] as const;

export function randomAffirmation(): string {
  return AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
}
