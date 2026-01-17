module.exports = function extractApplicantFeatures({ seeker, job }) {

  /* ================= SKILLS ================= */
  const seekerSkills = (seeker.skills || []).map(s => s.toLowerCase());
  const jobSkills = (job.requiredSkills || []).map(s => s.toLowerCase());

  const matchedSkills = jobSkills.filter(skill =>
    seekerSkills.includes(skill)
  );

  const skillMatchPercent =
    jobSkills.length === 0
      ? 0
      : Math.round((matchedSkills.length / jobSkills.length) * 100);

  /* ================= EXPERIENCE MATCH ================= */
  let experienceMatch = false;

  const seekerExp = parseSeekerExperience(seeker.experience);
  const minExp = job.minExperience !== undefined ? Number(job.minExperience) : null;
  const maxExp = job.maxExperience !== undefined ? Number(job.maxExperience) : null;

  if (minExp === 0 && maxExp === 0) {
    experienceMatch = seekerExp === 0;
  } else if (minExp !== null) {
    if (seekerExp >= minExp && (maxExp === null || seekerExp <= maxExp)) {
      experienceMatch = true;
    }
  }

  /* ================= RESUME QUALITY ================= */
  let resumeQuality = "Bad";
  let resumeScore = 0.2;
  let resumeAnalysis = [];

  if (seeker.resume) {
    if (seekerSkills.length >= 5) {
      resumeQuality = "Good";
      resumeScore = 0.9;
      resumeAnalysis.push("Strong skill section");
    } else if (seekerSkills.length >= 3) {
      resumeQuality = "Medium";
      resumeScore = 0.6;
      resumeAnalysis.push("Moderate skills listed");
    } else {
      resumeAnalysis.push("Limited skills listed");
    }

    if (seeker.education) {
      resumeAnalysis.push("Education section present");
    }

    if (seekerExp > 0) {
      resumeAnalysis.push("Experience mentioned");
    }
  } else {
    resumeAnalysis.push("No resume uploaded");
  }

  return {
    skillMatchPercent,
    experienceMatch,
    resumeQuality,
    resumeScore,
    resumeAnalysis
  };
};

function parseSeekerExperience(exp) {
  if (!exp) return 0;

  const str = exp.toString().toLowerCase();

  // 2-3 years
  if (/^\d+\s*-\s*\d+/.test(str)) {
    return Number(str.split("-")[0]);
  }

  // 3+ years
  if (/^\d+\+/.test(str)) {
    return Number(str.replace("+", ""));
  }

  // Single number
  if (/^\d+/.test(str)) {
    return Number(str.match(/\d+/)[0]);
  }

  return 0;
}