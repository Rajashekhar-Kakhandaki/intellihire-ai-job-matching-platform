const mongoose=require("mongoose");
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  }
});

const interviewQuestionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  questions: {
    type: [questionSchema],
    required: true
  }
});
const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  seeker: { type: mongoose.Schema.Types.ObjectId, ref: "Seeker", required: true },
  appliedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ["Applied", "Under Review", "Accepted", "Rejected","Withdrawn"], 
    default: "Applied" 
  },
  statusHistory: [
    {
      status: String,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  fitScore: {
    type: Number,
    default: 0
  },
  notifications: [
  {
    message: String,
    read: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
  }
],
  aiExplanation: {
    type: String,
    default: null
  },
  aiExplanationStatus: {
  type: String,
  enum: [ "generated"],
  default: null,
  interviewQuestions: {
    type: [interviewQuestionSchema],
    default: []
  }
}
});
applicationSchema.pre("find", async function () {
  await this.model.deleteMany({ job: { $exists: true, $eq: null } });
});


module.exports = mongoose.model("Application", applicationSchema);