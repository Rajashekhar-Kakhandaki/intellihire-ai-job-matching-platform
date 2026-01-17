const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function generateInterviewQuestions({
  jobTitle,
  requiredSkills,
  experienceLevel
}) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
Generate interview questions ONLY in valid JSON.

Job Title: ${jobTitle}
Experience Level: ${experienceLevel}
Skills: ${requiredSkills.join(", ")}

STRICT FORMAT:
{
  "technical": ["q1", "q2", "q3"],
  "hr": ["q1", "q2"],
  "scenario": ["q1"]
}

NO markdown
NO backticks
NO explanations
NO extra text
`;

  const result = await model.generateContent(prompt);

  let text = result.response.text().trim();

  // 🔥 REMOVE MARKDOWN SAFELY
  if (text.startsWith("```")) {
    text = text.replace(/```json|```/g, "").trim();
  }

  let aiData;
  try {
    aiData = JSON.parse(text);
  } catch (err) {
    console.error("AI RAW RESPONSE:\n", text);
    throw new Error("Invalid AI JSON response");
  }

  // ✅ TRANSFORM → DB SAFE FORMAT
  return [
    {
      category: "Technical & Role-Based",
      questions: (aiData.technical || []).map(q => ({ question: q }))
    },
    {
      category: "HR Questions",
      questions: (aiData.hr || []).map(q => ({ question: q }))
    },
    {
      category: "Scenario / Coding",
      questions: (aiData.scenario || []).map(q => ({ question: q }))
    }
  ];
};