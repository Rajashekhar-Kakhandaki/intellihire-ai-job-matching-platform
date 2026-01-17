const mongoose = require("mongoose");
const Application=require("../models/application");
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  }
});

const practiceQuestionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  questions: {
    type: [questionSchema],
    required: true
  }
});

const jobSchema = new mongoose.Schema({
  title: String,
  companyName: String,
  companyWebsite: String,
  requiredSkills: [String],
  minExperience: { type: Number, default: 0 },
  maxExperience: { type: Number, default: null },
  experienceRequired: String,
  salaryRange: String,
  location: String,
  description: String,
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "Recruiter" }, // ✅ changed from "Recruiter"
  createdAt: { type: Date, default: Date.now },
   practiceQuestions: {
    type: [practiceQuestionSchema],
    default: []
  }
});
jobSchema.post("findOneAndDelete", async (job) => {
  if (job) {
    await Application.deleteMany({ job: job._id });
  }
});

module.exports = mongoose.model("Job", jobSchema);
