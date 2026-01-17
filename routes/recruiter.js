const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware")
const recruiterController=require("../controllers/recruiter")


// Recruiter dashboard
router.get("/index/recruiter", isAuthenticated, recruiterController.recruiterHomePageRoute);

// Post job
router.get("/job/post", isAuthenticated, recruiterController.jobPostingGetRoute);
router.post("/job/post", isAuthenticated, recruiterController.jobPostingPostRoute);

// ✅ Recruiter job views
router.get("/recruiter/jobs", isAuthenticated, recruiterController.myJobsRoute);
router.get("/recruiter/jobs/all", isAuthenticated, recruiterController.allJobsRoute);

// Applicants
router.get("/applicants", isAuthenticated, recruiterController.applicantsRoute);
router.post("/application/:id/update-status", recruiterController.statusUpdateRoute);

// Profile
router.get("/recruiter/profile", isAuthenticated, recruiterController.profileRoute);
router.get("/recruiter/edit", isAuthenticated, recruiterController.profileEditGetRoute);
router.post("/recruiter/edit", isAuthenticated, recruiterController.profileEditPostRoute);

// Job edit/delete
router.get("/job/:id/edit", isAuthenticated, recruiterController.jobEditGetRoute);
router.put("/job/:id", isAuthenticated, recruiterController.jobEditPostRoute);
router.delete("/job/:id", isAuthenticated, recruiterController.deleteJobRoute);

router.post("/applicants/auto-shortlist",isAuthenticated,recruiterController.autoShortlistRoute);

router.get("/applications/:id/interview-questions",
  recruiterController.generateInterviewForApplication
);


module.exports = router;