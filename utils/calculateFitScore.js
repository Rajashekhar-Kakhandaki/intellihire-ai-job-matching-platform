module.exports = function calculateFitScore(features) {

  const { skillMatchPercent, experienceMatch, resumeScore } = features;

  // ❌ Hard guard
  if (skillMatchPercent === 0) {
    return { fitScore: 0 };
  }

  const skill = (skillMatchPercent / 100) * 60; // 60%
  const experience = experienceMatch ? 25 : 0; // 25%
  const resume = resumeScore * 15;              // 15%

  const fitScore = Math.round(skill + experience + resume);

  return { fitScore };
};