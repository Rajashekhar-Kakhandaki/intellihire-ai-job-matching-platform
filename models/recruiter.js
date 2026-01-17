const mongoose = require("mongoose");
const Job = require("./job");
const Application = require("./application");

// Recruiter Schema
const recruiterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
   phone:{
    type:String,
    required:false,
    match:/^[6-9]\d{9}$/
  },
  password: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  companyWebsite: String
});
recruiterSchema.post("findOneAndDelete", async (recruiter) => {
  if (!recruiter) return;

  const jobs = await Job.find(
    { recruiter: recruiter._id },
    { _id: 1 }   // fetch only IDs
  );

  const jobIds = jobs.map(j => j._id);

  await Application.deleteMany({ job: { $in: jobIds } });
  await Job.deleteMany({ recruiter: recruiter._id });
});

// Discriminators
const Recruiter=mongoose.model("Recruiter",recruiterSchema);

module.exports = Recruiter ;
