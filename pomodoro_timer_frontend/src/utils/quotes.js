const focusQuotes = [
  "Grow silently. Let your work be the leaves.",
  "Deep roots allow tall trees.",
  "Focus: one ring, one leaf, one moment.",
  "Small steps become forests.",
  "Breathe in calm, breathe out distraction.",
  "The forest doesn’t hurry, yet everything is accomplished.",
  "Tend to your attention like a garden.",
  "Stay present. You are planting your future.",
  "Quiet the noise; hear the wind in the leaves.",
];

const breakQuotes = [
  "Rest is part of growth.",
  "Let your mind wander like leaves on a breeze.",
  "Unwind. The forest watches over you.",
  "Breathe. You are enough.",
  "Stretch gently. Roots deepen in stillness.",
  "Sip water like rain on soil.",
  "Relax shoulders; soften the gaze.",
  "The pause nourishes the next step.",
];

/**
 * PUBLIC_INTERFACE
 * randomQuote
 * Returns a random quote string based on mode ('focus' or 'break').
 */
export function randomQuote(mode = 'focus') {
  const list = mode === 'break' ? breakQuotes : focusQuotes;
  return list[Math.floor(Math.random() * list.length)];
}
