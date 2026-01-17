const generateJobDescription = require("../utils/aiJobDescription");
const wrapAsync = require("../utils/wrapAsync");

module.exports.generateJobDescription=wrapAsync( async (req, res) => {
  try {
    const { title, skills, experience, companyName } = req.body;

    if (!title || !skills || !experience) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const description = await generateJobDescription({
      title,
      skills,
      experience,
      companyName
    });

    res.json({ description });

  } catch (err) {
    console.error("AI ROUTE ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});