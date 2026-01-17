const Seeker = require("../models/seeker");
const Recruiter = require("../models/recruiter");
const Job = require("../models/job");
const Application = require("../models/application");
const ExpressError = require("../utils/ExpressError");
const wrapAsync = require("../utils/wrapAsync");
const extractApplicantFeatures = require("../utils/extractApplicantFeatures");
const calculateFitScore = require("../utils/calculateFitScore");
const createNotification = require("../utils/createNotification");
const sendEmail = require("../utils/sendEmail");
const generateJobDescription = require("../utils/aiJobDescription");
const generateMatchExplanation = require("../utils/aiMatchExplanation");
const generateInterviewQuestions = require("../utils/aiInterviewQuestions");
const isValidPracticeQuestions = require("../utils/isValidPracticeQuestions");


// ✅ Recruiter home page
module.exports.recruiterHomePageRoute = wrapAsync(async (req, res) => {
  if (req.session.role !== "recruiter") {
    throw new ExpressError("Access denied", 403);
  }

  // 1️⃣ Get recruiter
  const user = await Recruiter.findById(req.session.userId);
  if (!user) throw new ExpressError("User not found", 404);

  // 2️⃣ Get recruiter jobs
  const recruiterJobs = await Job.find({ recruiter: user._id }).select("_id");

  const jobIds = recruiterJobs.map(job => job._id);

  // 3️⃣ Counts
  const jobCount = recruiterJobs.length;

  const applicantCount = await Application.countDocuments({
    job: { $in: jobIds }
  });

  const shortlistedCount = await Application.countDocuments({
    job: { $in: jobIds },
    status: "Under Review"
  });

  const hiredCount = await Application.countDocuments({
    job: { $in: jobIds },
    status: "Accepted"
  });

  // 4️⃣ Render dashboard
  res.render("./users/index/recruiter", {
    user,
    jobCount,
    applicantCount,
    shortlistedCount,
    hiredCount,
    pageCss: "recruiter"
  });
});


// ✅ Job posting form (GET)
module.exports.jobPostingGetRoute = (req, res) => {
  res.render("./jobs/newPost", { pageCss: "newPost" });
};

// ✅ Post new job (POST)
module.exports.jobPostingPostRoute = async (req, res) => {
  const {
    title,
    companyName,
    companyWebsite,
    requiredSkills,
    experience,
    salaryRange,
    location,
    description
  } = req.body;

  let minExperience = 0;
  let maxExperience = null;

  if (experience) {
    let exp = experience.toLowerCase().replace(/years?|yrs?/g, "").trim();

    if (exp === "0" || exp === "fresher") {
      minExperience = 0;
      maxExperience = 0;
    } else if (/^\d+-\d+$/.test(exp)) {
      [minExperience, maxExperience] = exp.split("-").map(Number);
    } else if (/^\d+\+$/.test(exp)) {
      minExperience = Number(exp.replace("+", ""));
    } else if (/^\d+$/.test(exp)) {
      minExperience = maxExperience = Number(exp);
    }
  }

  await Job.create({
    title,
    companyName,
    companyWebsite,
    requiredSkills: requiredSkills
      ? requiredSkills.split(",").map(s => s.trim().toLowerCase())
      : [],
    experienceRequired: experience,
    minExperience,
    maxExperience,
    salaryRange,
    location,
    description,
    recruiter: req.session.userId
  });

  req.flash("success", "Job posted successfully!");
  res.redirect("/index/recruiter");
};

// ✅ Show all jobs
// ✅ My jobs only
module.exports.myJobsRoute = wrapAsync(async (req, res) => {
  const recruiterId = req.session.userId;

  // 1️⃣ Get recruiter's jobs
  const jobs = await Job.find({ recruiter: recruiterId }).lean();

  // 2️⃣ Get all applications for these jobs
  const jobIds = jobs.map(job => job._id);

  const applications = await Application.aggregate([
    { $match: { job: { $in: jobIds } } },
    {
      $group: {
        _id: { job: "$job", status: "$status" },
        count: { $sum: 1 }
      }
    }
  ]);

  // 3️⃣ Map counts to jobs
  const jobStats = {};

  applications.forEach(app => {
    const jobId = app._id.job.toString();
    if (!jobStats[jobId]) {
      jobStats[jobId] = {
        total: 0,
        underReview: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0
      };
    }

    jobStats[jobId].total += app.count;

    if (app._id.status === "Under Review") jobStats[jobId].underReview += app.count;
    if (app._id.status === "Accepted") jobStats[jobId].accepted += app.count;
    if (app._id.status === "Rejected") jobStats[jobId].rejected += app.count;
    if (app._id.status === "Withdrawn") jobStats[jobId].withdrawn += app.count;
  });

  res.render("./users/myPosts", {
    jobs,
    jobStats,
    view: "mine",
    filters: {},
    pageCss: "myPosts"
  });
});


// ✅ All companies jobs (read-only)
module.exports.allJobsRoute = wrapAsync(async (req, res) => {
  const { keyword, location } = req.query;

  let query = {};

  // 🔍 Keyword search (job title OR company)
  if (keyword) {
    query.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { companyName: { $regex: keyword, $options: "i" } }
    ];
  }

  // 📍 Location filter
  if (location) {
    query.location = { $regex: location, $options: "i" };
  }

  const jobs = await Job.find(query);

  res.render("./users/myPosts", {
    jobs,
    view: "all",         // 🔑 IMPORTANT
    filters: req.query,  // 🔑 retain form values
    pageCss: "myPosts"
  });
});

// ✅ Show applicants for recruiter's jobs
module.exports.applicantsRoute = async (req, res) => {
  try {
    const recruiterId = req.session.userId;

    // 1️⃣ Get recruiter's jobs
    const jobs = await Job.find({ recruiter: recruiterId }).select("_id");
    const jobIds = jobs.map(j => j._id);``

    if (jobIds.length === 0) {
      return res.render("users/applicants", {
        applications: [],
        pageCss: "applicants"
      });
    }

    // 2️⃣ Fetch applications
    const applications = await Application.find({
      job: { $in: jobIds }
    })
      .populate("job")
      .populate("seeker");

    const finalApplications = [];

    for (const app of applications) {
      if (!app.job || !app.seeker) continue;
      if (typeof app.aiExplanationStatus === "undefined") {
        app.aiExplanationStatus = null;
      }
      const features = extractApplicantFeatures({
        seeker: app.seeker,
        job: app.job
      });
      const scoreData = calculateFitScore(features);
      if (scoreData.fitScore <= 0) continue;
      if (app.fitScore !== scoreData.fitScore) {
        app.fitScore = scoreData.fitScore;
        await app.save();
      }
      const seekerSkills = app.seeker.skills || [];
      const jobSkills = app.job.requiredSkills || [];
      const matchedSkills = jobSkills.filter(skill =>
        seekerSkills.includes(skill)
      );
      const missingSkills = jobSkills.filter(skill =>
        !seekerSkills.includes(skill)
      );
      const shouldGenerateAI =
        app.aiExplanationStatus !== "generated" &&
        (
          !app.aiExplanation ||
          app.aiExplanation ===
            "AI explanation is currently unavailable due to API limits."
        );
      if (shouldGenerateAI) {
        try {
          const explanation = await generateMatchExplanation({
            seekerName: app.seeker.name,
            jobTitle: app.job.title,
            skillMatchPercent: features.skillMatchPercent,
            experienceMatch: features.experienceMatch,
            resumeQuality: features.resumeQuality,
            matchedSkills,
            missingSkills
          });
          app.aiExplanation = explanation;
          app.aiExplanationStatus = "generated";
          await app.save();
        } catch (err) {
          console.error("AI explanation error:", err.message);
          app.aiExplanation =
            "AI explanation is currently unavailable due to API limits.";
          app.aiExplanationStatus = null;
          await app.save();
        }
      }
      finalApplications.push({
        ...app.toObject(),
        fitScore: scoreData.fitScore,
        skillMatchPercent: features.skillMatchPercent,
        experienceMatch: features.experienceMatch,
        resumeQuality: features.resumeQuality,
        resumeAnalysis: features.resumeAnalysis,
        explanation:
          app.aiExplanationStatus === "generated"
            ? app.aiExplanation
            : "AI explanation is being prepared."
      });
    }

    // 8️⃣ Sort by best score
    finalApplications.sort((a, b) => b.fitScore - a.fitScore);

    res.render("users/applicants", {
      applications: finalApplications,
      pageCss: "applicants"
    });

  } catch (err) {
    console.error("APPLICANTS ROUTE ERROR:", err);
    req.flash("error", "Failed to load applicants");
    res.redirect("/index/recruiter");
  }
};



module.exports.statusUpdateRoute = wrapAsync(async (req, res) => {
  const { status } = req.body;

  const application = await Application.findById(req.params.id)
    .populate("job")
    .populate("seeker");

  if (!application) {
    req.flash("error", "Application not found");
    return res.redirect("/applicants");
  }

  // Update status
  application.status = status;
  application.statusHistory.push({
    status,
    date: new Date()
  });
  await application.save();

  // Notification message
  let message = null;

  if (status === "Under Review") {
    message = `Your application for "${application.job.title}" is under review.`;
    await sendEmail({
      to: application.seeker.email,
      subject: "⏳Application Status Update – IntelliHire",
      text: `Dear ${application.seeker.name},

      Your application for the position of "${application.job.title}" at ${application.job.companyName}
      is currently under review.

      We appreciate your patience. You will be notified once a final decision
      is made.

      Best regards,
      IntelliHire Recruitment Team`
    });
  } else if (status === "Accepted") {
    message = `🎉 Congratulations! You have been selected for "${application.job.title}".`;
    // 1️⃣ Send email to seeker
    await sendEmail({
      to: application.seeker.email,
      subject: "🎉 Application Selected - IntelliHire",
      text: `Dear ${application.seeker.name},

      Congratulations!

      We are pleased to inform you that your application for the position of 
      "${application.job.title}" at ${application.job.companyName} has been successfully shortlisted.

      Our recruitment team will contact you shortly using your registered 
      email or phone number to discuss the next steps.

      Thank you for your interest in joining our organization.

      Best regards,
      IntelliHire Recruitment Team

      (This is an automated message. Please do not reply.)`
    });
  } else if (status === "Rejected") {
    message = `Your application for "${application.job.title}" was rejected.`;
    await sendEmail({
      to: application.seeker.email,
      subject: "❌Application Update – IntelliHire",
      text: `Dear ${application.seeker.name},

      Thank you for your interest in the "${application.job.title}" position at ${application.job.companyName}.

      After careful consideration, we regret to inform you that your application
      was not selected at this time.

      We encourage you to apply for future opportunities that match your skills.

      Best regards,
      IntelliHire Recruitment Team`
    });
  }

  // Create notification
  if (message) {
    await createNotification({
      userId: application.seeker._id,
      userModel: "Seeker",
      message,
      link: "/myapplications"
    });
  }

  req.flash("success", "Status updated & notification sent");
  res.redirect("/applicants");
});
module.exports.profileEditGetRoute = wrapAsync(async (req, res) => {
  const recruiter = await Recruiter.findById(req.session.userId);
  res.render("./users/index/recruiteredit", { recruiter, pageCss: "recruiteredit" });
});

module.exports.profileEditPostRoute = wrapAsync(async (req, res) => {
  const { name, email, phone, companyName, companyWebsite } = req.body;
  await Recruiter.findByIdAndUpdate(req.session.userId, {
    name,
    email,
    phone,
    companyName,
    companyWebsite
  });
  req.flash("success", "Profile updated successfully!");
  res.redirect("/index/recruiter");
});

module.exports.jobEditGetRoute = wrapAsync(async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).send("Job not found");

    res.render("./jobs/editJob", {
      job,
      pageCss: "editJob" // load specific CSS
    });
  } catch (err) {
    console.error("Error loading job edit form:", err);
    res.status(500).send("Server error");
  }
});

module.exports.jobEditPostRoute = wrapAsync(async (req, res) => {

  const {
    title,
    companyName,
    companyWebsite,
    requiredSkills,
    experienceRequired,
    salaryRange,
    location,
    description
  } = req.body;

  // ✅ SAFE PARSING
  const { minExperience, maxExperience } = parseExperience(experienceRequired);

  await Job.findByIdAndUpdate(req.params.id, {
    title,
    companyName,
    companyWebsite,
    requiredSkills: requiredSkills
      ? requiredSkills.split(",").map(s => s.trim().toLowerCase())
      : [],
    experienceRequired,
    minExperience,
    maxExperience,
    salaryRange,
    location,
    description
  });

  req.flash("success", "Job updated successfully!");
  res.redirect("/recruiter/jobs");
});


module.exports.deleteJobRoute = wrapAsync(async (req, res) => {
  try {
    const recruiterId = req.session.userId;
    const job = await Job.findById(req.params.id);

    if (!job) {
      req.flash("error", "Job not found!");
      return res.redirect("/recruiter/jobs");
    }

    // ✅ Only owner can delete
    if (job.recruiter.toString() !== recruiterId.toString()) {
      req.flash("error", "Unauthorized action!");
      return res.redirect("/recruiter/jobs");
    }

    // 🗑️ Delete job
    await Job.findByIdAndDelete(req.params.id);

    // (Optional) if hook exists, you can remove this
    // await Application.deleteMany({ job: req.params.id });

    req.flash("success", "Job deleted successfully!");
    res.redirect("/recruiter/jobs"); // ✅ ABSOLUTE PATH
  } catch (err) {
    console.error("Error deleting job:", err);
    req.flash("error", "Error deleting job!");
    res.redirect("/recruiter/jobs"); // ✅ ABSOLUTE PATH
  }
});

module.exports.profileRoute = async (req, res) => {
  if (req.session.role !== "recruiter") {
    return res.status(403).send("Access denied");
  }

  const recruiter = await Recruiter.findById(req.session.userId);
  res.render("./users/index/recruiterProfile", { recruiter, pageCss: "recruiterProfile" });
};


function parseExperience(experienceRequired) {
  let minExperience = 0;
  let maxExperience = null;

  if (!experienceRequired) {
    return { minExperience: 0, maxExperience: null };
  }

  // ✅ Normalize input
  let exp = experienceRequired
    .toString()
    .toLowerCase()
    .replace(/years?|yrs?/g, "") // remove "year", "years", "yr", "yrs"
    .replace(/\s+/g, "")         // remove spaces
    .trim();

  // -------------------------
  // Fresher
  // -------------------------
  if (exp === "0" || exp === "fresher") {
    minExperience = 0;
    maxExperience = 0;
  }

  // -------------------------
  // Range: 1-2, 2-4
  // -------------------------
  else if (/^\d+-\d+$/.test(exp)) {
    const [min, max] = exp.split("-").map(Number);
    minExperience = min;
    maxExperience = max;
  }

  // -------------------------
  // Plus: 3+
  // -------------------------
  else if (/^\d+\+$/.test(exp)) {
    minExperience = Number(exp.replace("+", ""));
    maxExperience = null;
  }

  // -------------------------
  // Single number: 1, 2, 3
  // -------------------------
  else if (/^\d+$/.test(exp)) {
    minExperience = Number(exp);
    maxExperience = Number(exp);
  }

  // -------------------------
  // Fallback safety
  // -------------------------
  else {
    minExperience = 0;
    maxExperience = null;
  }

  return { minExperience, maxExperience };
}


module.exports.autoShortlistRoute = async (req, res) => {
  try {
    const recruiterId = req.session.userId;
    const limit = Number(req.body.limit);

    if (!limit || limit < 1) {
      req.flash("error", "Invalid shortlist number");
      return res.redirect("/applicants");
    }

    // 1️⃣ Recruiter jobs
    const jobs = await Job.find({ recruiter: recruiterId }).select("_id");
    const jobIds = jobs.map(j => j._id);

    // 2️⃣ Eligible applications (ONLY score-based)
    const applications = await Application.find({
      job: { $in: jobIds },
      status: { $in: ["Applied", "Under Review"] },
      fitScore: { $gt: 0 } // 🔑 CRITICAL FIX
    })
      .sort({ fitScore: -1 }) // 🔥 DB-level sorting
      .populate("job")
      .populate("seeker");

    if (applications.length === 0) {
      req.flash("error", "No eligible applicants found");
      return res.redirect("/applicants");
    }

    const actualLimit = Math.min(limit, applications.length);

    const shortlisted = applications.slice(0, actualLimit);
    const rejected = applications.slice(actualLimit);
    const now = new Date();

    // 3️⃣ Bulk updates (FAST)
    await Application.updateMany(
      { _id: { $in: shortlisted.map(a => a._id) } },
      {
        $set: { status: "Under Review" },
        $push: { statusHistory: { status: "Under Review", date: now } }
      }
    );

    await Application.updateMany(
      { _id: { $in: rejected.map(a => a._id) } },
      {
        $set: { status: "Rejected" },
        $push: { statusHistory: { status: "Rejected", date: now } }
      }
    );

    // 4️⃣ Optional notifications (NO EMAIL HERE)
    for (const app of shortlisted) {
      await createNotification({
        userId: app.seeker._id,
        userModel: "Seeker",
        message: `Your application for "${app.job.title}" is under review.`,
        link: "/myapplications"
      });
    }

    for (const app of rejected) {
      await createNotification({
        userId: app.seeker._id,
        userModel: "Seeker",
        message: `Your application for "${app.job.title}" was rejected.`,
        link: "/myapplications"
      });
    }

    req.flash(
      "success",
      `Shortlisted ${shortlisted.length} applicants, rejected ${rejected.length}`
    );

    res.redirect("/applicants");

  } catch (err) {
    console.error("AUTO SHORTLIST ERROR:", err);
    req.flash("error", "Auto-shortlisting failed");
    res.redirect("/applicants");
  }
};

module.exports.generateDescriptionRoute = wrapAsync(async (req, res) => {
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







module.exports.generateInterviewForApplication = async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate("job")
    .populate("seeker");

  if (!application) {
    throw new ExpressError("Application not found", 404);
  }

  // ✅ CHECK IF GENERATION IS REQUIRED
  const needsGeneration =
    !application.interviewQuestions ||
    application.interviewQuestions.length === 0 ||
    !isValidPracticeQuestions(application.interviewQuestions);

  if (needsGeneration) {
    try {
      const generated = await generateInterviewQuestions({
        jobTitle: application.job.title,
        requiredSkills: application.job.requiredSkills,
        experienceLevel: application.job.experienceRequired
      });

      if (!isValidPracticeQuestions(generated)) {
        throw new Error("Invalid AI interview format");
      }

      application.interviewQuestions = generated;
      await application.save();

    } catch (err) {
      console.error("Interview generation failed:", err.message);
    }
  }

  res.render("users/interviewQuestions", {
    application,
    questions: application.interviewQuestions,
    pageCss: "interviewQuestions"
  });
};