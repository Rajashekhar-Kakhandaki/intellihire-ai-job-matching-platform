module.exports = function calculateJobMatchScore({ seeker, job }) {

  const seekerSkills = (seeker.skills || []).map(s => s.toLowerCase());
  const jobSkills = (job.requiredSkills || []).map(s => s.toLowerCase());

  const matchedSkills = jobSkills.filter(skill =>
    seekerSkills.includes(skill)
  );

  const missingSkills = jobSkills.filter(skill =>
    !seekerSkills.includes(skill)
  );

  // 🚫 HARD BLOCK — NO SKILL MATCH = NO RECOMMENDATION
  if (matchedSkills.length === 0) {
    return {
      totalScore: 0,
      matchedSkills: [],
      missingSkills,
      excluded: true
    };
  }

  // ✅ Skill score
  const skillScore = (matchedSkills.length / jobSkills.length) * 100;

  // ✅ Simple experience match
  const experienceScore =
    seeker.experience >= (job.minExperience || 0) ? 100 : 0;

  // ✅ Resume score
  const resumeScore = seeker.resume ? 100 : 0;

  // ⚖️ Weights
  const totalScore = Math.round(
    skillScore * 0.6 +
    experienceScore * 0.25 +
    resumeScore * 0.15
  );

  return {
    totalScore,
    matchedSkills,
    missingSkills
  };
};