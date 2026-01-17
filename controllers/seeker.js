const Seeker = require("../models/seeker");
const Recruiter = require("../models/recruiter");
const Application = require("../models/application");
const Job = require("../models/job");
const ExpressError = require("../utils/ExpressError");
const wrapAsync = require("../utils/wrapAsync");
const calculateJobMatchScore = require("../utils/jobMatchScore");
const generateSkillRoadmap = require("../utils/aiSkillGapRoadmap");
const generateInterviewQuestions = require("../utils/aiInterviewQuestions");
const isValidPracticeQuestions = require("../utils/isValidPracticeQuestions");
// 🏠 Seeker Homepage
// 🏠 Seeker Homepage
module.exports.seekerHomePage = wrapAsync(async (req, res) => {
  if (req.session.role !== "seeker") {
    throw new ExpressError("Access denied", 403);
  }

  const user = await Seeker.findById(req.session.userId);
  if (!user) throw new ExpressError("User not found", 404);

  const seekerId = req.session.userId;

  // ✅ COUNTS BASED ON STATUS
  const [
    appliedCount,
    underReviewCount,
    acceptedCount,
    rejectedCount,
    withdrawnCount
  ] = await Promise.all([
    Application.countDocuments({ seeker: seekerId }),
    Application.countDocuments({ seeker: seekerId, status: "Under Review" }),
    Application.countDocuments({ seeker: seekerId, status: "Accepted" }),
    Application.countDocuments({ seeker: seekerId, status: "Rejected" }),
    Application.countDocuments({ seeker: seekerId, status: "Withdrawn" }),
  ]);

  res.render("./users/index/seekers", {
    user,
    appliedCount,
    underReviewCount,
    acceptedCount,
    rejectedCount,
    withdrawnCount,
    pageCss: "seekers",
  });
});


// 🔍 Explore all jobs
module.exports.jobExploreRoute = wrapAsync(async (req, res) => {
  const { keyword, location, skills, experience } = req.query;

  let query = {};

  // 🔍 Keyword search
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

  // 🧠 Skills filter
  if (skills) {
    const skillArray = skills
      .split(",")
      .map(s => s.trim().toLowerCase());

    query.requiredSkills = { $in: skillArray };
  }

  // ================================
  // 💼 EXPERIENCE FILTER (ADD HERE)
  // ================================
  if (experience !== undefined && experience !== "") {

    const exp = Number(experience); // seeker selected value

    query.$and = [
      { minExperience: { $lte: exp } },
      {
        $or: [
          { maxExperience: { $gte: exp } },
          { maxExperience: null } // handles "3+ years"
        ]
      }
    ];
  }

  const jobs = await Job.find(query);

  res.render("./jobs/jobListForSeeker", {
    jobs,
    filters: req.query,
    pageCss: "jobListForSeeker"
  });
});



// 💡 Recommendations based on skills
module.exports.recommendationRoute = wrapAsync(async (req, res) => {
  const seeker = await Seeker.findById(req.session.userId);
  if (!seeker) throw new ExpressError("Seeker not found", 404);

  const jobs = await Job.find();

  const scoredJobs = jobs
    .map(job => {
      const scoreData = calculateJobMatchScore({ seeker, job });

      return {
        ...job.toObject(),
        matchScore: scoreData.totalScore,
        matchedSkills: scoreData.matchedSkills,
        missingSkills: scoreData.missingSkills
      };
    })
    // 🚫 REMOVE 0-MATCH JOBS
    .filter(job => job.matchScore > 0 && job.matchedSkills.length>0)
    // 🔥 BEST MATCH FIRST
    .sort((a, b) => b.matchScore - a.matchScore);

  res.render("./jobs/recommendations", {
    seeker,
    jobs: scoredJobs,
    pageCss: "recommendations"
  });
});



// Job details (works for both explore & recommendations)



module.exports.jobDetailsRoute = wrapAsync(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ExpressError("Job not found", 404);

  const from = req.query.from || "explore"; // ✅ DEFAULT

  let seeker = null;
  let matched = [];
  let missing = [];
  let roadmap = null;

  if (req.session.role === "seeker") {
    seeker = await Seeker.findById(req.session.userId);

    if (seeker) {
      matched = job.requiredSkills.filter(skill =>
        seeker.skills.includes(skill)
      );

      missing = job.requiredSkills.filter(
        skill => !seeker.skills.includes(skill)
      );

      const existingRoadmap = seeker.learningRoadmaps.find(
        r => r.job.toString() === job._id.toString()
      );

      if (existingRoadmap) {
        roadmap = existingRoadmap.roadmap;
      } else if (missing.length > 0) {
        roadmap = await generateSkillRoadmap({
          jobTitle: job.title,
          missingSkills: missing
        });

        seeker.learningRoadmaps.push({
          job: job._id,
          missingSkills: missing,
          roadmap
        });

        await seeker.save();
      }
    }
  }

  res.render("jobs/jobDetails", {
    job,
    seeker,
    matched,
    missing,
    roadmap,
    from ,// ✅ PASS TO EJS
    pageCss:"jobDetails"
  });
});



// 📝 Apply for a job
module.exports.jobApplyRoute = wrapAsync(async (req, res) => {
  if (req.session.role !== "seeker") {
    throw new ExpressError("Only seekers can apply", 403);
  }

  const seekerId = req.session.userId;
  const jobId = req.params.jobId;
  const { from } = req.body;

  const job = await Job.findById(jobId);
  if (!job) {
    req.flash("error", "Job no longer exists");
    return res.redirect("/seekers/exploreJob");
  }

  const existingApp = await Application.findOne({
    job: jobId,
    seeker: seekerId,
  });

  if (existingApp) {
    req.flash("error", "You already applied");
    return res.redirect(`/jobs/${jobId}?from=${from}`);
  }

  await Application.create({
  job: jobId,
  seeker: seekerId,
  status: "Applied",
  statusHistory: [
    {
      status: "Applied",
      date: new Date()
    }
  ]
});


  req.flash("success", "Application submitted successfully!");

  // ✅ SMART REDIRECT
  if (from === "recommendations") {
    return res.redirect(`/recommendations/${seekerId}`);
  }

  res.redirect("/seekers/exploreJob");
});

// 📂 My Applications
module.exports.myApplicationRoute = wrapAsync(async (req, res) => {
  const seekerId = req.session.userId;

  // 1️⃣ Find applications
  let applications = await Application.find({ seeker: seekerId })
    .populate("job");

  // 2️⃣ Remove applications whose job is deleted
  const orphanApps = applications.filter(app => app.job === null);

  if (orphanApps.length > 0) {
    const orphanIds = orphanApps.map(app => app._id);
    await Application.deleteMany({ _id: { $in: orphanIds } });

    // Reload after cleanup
    applications = await Application.find({ seeker: seekerId })
      .populate("job");
  }

  res.render("./users/myApplication", {
    applications,
    pageCss: "myApplication",
  });
});


// 🔙 Withdraw application
module.exports.applicationWithdrawRoute = wrapAsync(async (req, res) => {

  // 1️⃣ Role check
  if (req.session.role !== "seeker") {
    throw new ExpressError("Only seekers can withdraw applications", 403);
  }

  const application = await Application.findById(req.params.id)
    .populate("job");

  // 2️⃣ Application exists?
  if (!application) {
    req.flash("error", "Application not found");
    return res.redirect("/myapplications");
  }

  // 3️⃣ Ownership check
  if (application.seeker.toString() !== req.session.userId) {
    throw new ExpressError("Unauthorized action", 403);
  }

  // 4️⃣ Business rule: cannot withdraw after acceptance
  if (application.status === "Accepted") {
    req.flash("error", "You cannot withdraw an accepted application");
    return res.redirect("/myapplications");
  }

  // 5️⃣ Safe delete
  await Application.findByIdAndDelete(application._id);

  req.flash(
    "success",
    `Application withdrawn${application.job ? ` for ${application.job.title}` : ""}`
  );

  res.redirect("/myapplications");
});


module.exports.profileEditGetRoute=wrapAsync(async (req, res) => {
  const seeker = await Seeker.findById(req.session.userId);
  res.render("./users/index/seekeredit", { seeker,pageCss:"seekeredit" });
});


module.exports.profileEditPostRoute=wrapAsync( async (req, res) => {
  try {
    const { name, email,phone, skills, education, experience } = req.body;

    const updateData = {
      name,
      email,
      phone,
      education,
      experience,
      skills: skills
        ? skills.split(",").map(s => s.trim().toLowerCase())
        : []
    };

    // ✅ If new resume uploaded
    if (req.file) {
      updateData.resume = req.file.path;
    }

    await Seeker.findByIdAndUpdate(req.session.userId, updateData);

    req.flash("success", "Profile updated successfully");
    res.redirect("/index/seeker");

  } catch (err) {
    console.error(err);
    req.flash("error", "Profile update failed");
    res.redirect("/seeker/edit");
  }
});
module.exports.profileRoute=async (req, res) => {
  if (req.session.role !== "seeker") {
    return res.status(403).send("Access denied");
  }

  const seeker = await Seeker.findById(req.session.userId);
  res.render("./users/index/seekerProfile", { seeker,pageCss:"seekerProfile" });
}







module.exports.practiceInterviewRoute = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ExpressError("Job not found", 404);

  // ✅ THIS IS THE KEY LOGIC
  const needsGeneration =
    !job.practiceQuestions ||
    !Array.isArray(job.practiceQuestions) ||
    job.practiceQuestions.length === 0 ||
    !isValidPracticeQuestions(job.practiceQuestions);

  if (needsGeneration) {
    try {
      const generated = await generateInterviewQuestions({
        jobTitle: job.title,
        requiredSkills: job.requiredSkills,
        experienceLevel: job.experienceRequired
      });

      if (!isValidPracticeQuestions(generated)) {
        throw new Error("Invalid AI interview question format");
      }

      job.practiceQuestions = generated;
      await job.save();

    } catch (err) {
      console.error("Interview question generation failed:", err.message);
    }
  }

  res.render("users/interviewPreparation", {
    job,
    questions: job.practiceQuestions,
    pageCss: "interviewPreparation"
  });
};