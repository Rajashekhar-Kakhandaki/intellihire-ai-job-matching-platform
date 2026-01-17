const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function generateMatchExplanation({
  seekerName,
  jobTitle,
  skillMatchPercent,
  experienceMatch,
  resumeQuality,
  matchedSkills,
  missingSkills
}) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are an AI recruitment assistant.

Explain in 3–4 simple sentences why the candidate matches or does not match the job.

Candidate Name: ${seekerName}
Job Title: ${jobTitle}
Skill Match Percentage: ${skillMatchPercent}%
Experience Match: ${experienceMatch ? "Yes" : "No"}
Resume Quality: ${resumeQuality}

Matched Skills: ${matchedSkills.join(", ") || "None"}
Missing Skills: ${missingSkills.join(", ") || "None"}

Rules:
- Use simple professional English
- Do NOT mention percentages explicitly
- Highlight strengths first
- Mention missing skills gently
`;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
};