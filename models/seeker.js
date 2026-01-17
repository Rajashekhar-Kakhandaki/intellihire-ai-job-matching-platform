const  mongoose  = require("mongoose");
const Application = require("./application");

const seekerSchema = new mongoose.Schema({
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
    required:true,
    match:/^[6-9]\d{9}$/
  },
  password: {
    type: String,
    required: true
  },
  skills: [String],
  education: String,
  experience: String,
  resume: String,
  learningRoadmaps: [
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job"
    },
    missingSkills: [String],
    roadmap: Object,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
]
});
seekerSchema.post("findOneAndDelete", async function (seeker) {
  if (seeker) {
    await Application.deleteMany({ seeker: seeker._id });
    console.log("✅ Applications deleted for seeker:", seeker._id);
  }
});
const Seeker=mongoose.model("Seeker",seekerSchema)
module.exports=Seeker;