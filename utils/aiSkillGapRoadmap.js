const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function generateSkillRoadmap({
  jobTitle,
  missingSkills
}) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
You are an AI career mentor.

A candidate is applying for the role: "${jobTitle}"

They are missing these skills:
${missingSkills.join(", ")}

TASK:
For EACH missing skill, generate a beginner-friendly learning roadmap.

STRICT RULES:
- Output ONLY valid JSON
- No markdown
- No explanations
- No extra text
- Simple English
- Beginner friendly

JSON FORMAT (ARRAY ONLY):

[
  {
    "skill": "Skill name",
    "steps": [
      {
        "title": "Learning step title",
        "topics": ["topic 1", "topic 2", "topic 3"],
        "videos": ["YouTube video title 1", "YouTube video title 2"]
      }
    ]
  }
]
`;

    const result = await model.generateContent(prompt);

    let text = result.response.text();

    // 🔥 CRITICAL: Clean Gemini output
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const roadmap = JSON.parse(text);

    // 🔐 Safety check
    if (!Array.isArray(roadmap)) {
      throw new Error("Invalid roadmap format");
    }

    return roadmap;

  } catch (err) {
    console.error("AI ROADMAP ERROR:", err);

    // 🛡️ FALLBACK (never break UI)
    return missingSkills.map(skill => ({
      skill,
      steps: [
        {
          title: `Learn basics of ${skill}`,
          topics: [
            `${skill} fundamentals`,
            `${skill} core concepts`,
            `${skill} hands-on practice`
          ],
          videos: [
            `${skill} tutorial for beginners`,
            `${skill} full course`
          ]
        }
      ]
    }));
  }
};