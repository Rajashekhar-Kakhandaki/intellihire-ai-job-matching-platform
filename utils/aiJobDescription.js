const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async function generateJobDescription({
  title,
  skills,
  experience,
  companyName
}) {
  try {
    // Ensure skills is text
    const skillsText = Array.isArray(skills)
      ? skills.join(", ")
      : skills;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
Write a SHORT and CLEAR job description for a job portal.

Rules:
- Keep it under 120 words
- Use simple language
- No company history
- No marketing tone
- Use bullet points
- Suitable for students and early professionals

Job Details:
Job Title: ${title}
Company: ${companyName}
Experience: ${experience} years
Required Skills: ${skillsText}

Format exactly like this:

Job Title – Company Name

Short 1-line intro.

Skills Required:
- skill 1
- skill 2
- skill 3

Responsibilities:
- point 1
- point 2
- point 3

End with:
"Apply now to grow your career with us."
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text;

  } catch (err) {
    console.error("GEMINI ERROR:", err);
    throw err;
  }
};