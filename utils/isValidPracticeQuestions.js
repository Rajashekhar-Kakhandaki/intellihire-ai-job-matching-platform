module.exports = function isValidPracticeQuestions(data) {
  if (!Array.isArray(data) || data.length === 0) return false;

  for (const section of data) {
    if (!section.category || typeof section.category !== "string") {
      return false;
    }

    if (!Array.isArray(section.questions) || section.questions.length === 0) {
      return false;
    }

    for (const q of section.questions) {
      if (!q.question || typeof q.question !== "string") {
        return false;
      }
    }
  }

  return true;
};