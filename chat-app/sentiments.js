// Kindness indicators - positive words and phrases
const kindnessIndicators = {
  positive: [
    "thank",
    "thanks",
    "please",
    "welcome",
    "kind",
    "nice",
    "good",
    "great",
    "awesome",
    "appreciate",
    "helpful",
    "happy",
    "glad",
    "wonderful",
    "love",
    "care",
    "sweet",
    "hope",
    "enjoy",
    "pleasure",
    "beautiful",
    "friend",
    "support",
    "understand",
    "bless",
    "blessing",
    "blessings",
    "blessed",
    "blessings",
    "blessings",
    "blessings",
  ],
  negative: [
    "hate",
    "stupid",
    "dumb",
    "ugly",
    "shit",
    "idiot",
    "fool",
    "bad",
    "worst",
    "terrible",
    "awful",
    "horrible",
    "useless",
    "shut up",
    "waste",
    "poor",
    "pathetic",
    "fuck off",
    "fuck you",
  ],
  polite: [
    "would you",
    "could you",
    "may i",
    "please",
    "thank you",
    "thanks",
    "pardon",
    "excuse",
    "sorry",
    "appreciate",
  ],
};

function analyzeKindness(text) {
  text = text.toLowerCase();

  let score = 0;
  let analysis = {
    score: 0,
    isKind: false,
    details: {
      positiveWords: [],
      negativeWords: [],
      politeExpressions: [],
    },
  };

  // Check for positive words
  kindnessIndicators.positive.forEach((word) => {
    if (text.includes(word)) {
      score += 1;
      analysis.details.positiveWords.push(word);
    }
  });

  // Check for negative words
  kindnessIndicators.negative.forEach((word) => {
    if (text.includes(word)) {
      score -= 2; // Negative words have more weight
      analysis.details.negativeWords.push(word);
    }
  });

  // Check for polite expressions
  kindnessIndicators.polite.forEach((phrase) => {
    if (text.includes(phrase)) {
      score += 1.5; // Politeness has extra weight
      analysis.details.politeExpressions.push(phrase);
    }
  });

  // Additional contextual analysis
  if (text.includes("!")) {
    if (score > 0) score += 0.5; // Enthusiasm in positive context
    if (score < 0) score -= 0.5; // Aggression in negative context
  }

  // Normalize score between -1 and 1
  score = Math.max(-1, Math.min(1, score / 5));

  analysis.score = score;
  analysis.isKind = score > 0;

  return analysis;
}

// Get a color based on kindness score
function getKindnessColor(score) {
  if (score > 0.5) return "#2ecc71"; // Very kind - Green
  if (score > 0) return "#27ae60"; // Kind - Darker green
  if (score === 0) return "#95a5a6"; // Neutral - Gray
  if (score > -0.5) return "#e74c3c"; // Unkind - Light red
  return "#c0392b"; // Very unkind - Dark red
}

// Get a description of the message's kindness
function getKindnessDescription(score) {
  if (score > 0.5) return "Very Kind";
  if (score > 0) return "Kind";
  if (score === 0) return "Neutral";
  if (score > -0.5) return "Unkind";
  return "Very Unkind";
}
