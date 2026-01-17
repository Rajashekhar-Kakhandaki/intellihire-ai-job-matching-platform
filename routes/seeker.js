const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware");
const seekerController=require("../controllers/seeker");

const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

router.get("/index/seeker", isAuthenticated,seekerController.seekerHomePage );


router.get("/seekers/exploreJob", isAuthenticated, seekerController.jobExploreRoute);


router.get("/recommendations/:id", isAuthenticated, seekerController.recommendationRoute);


// router.get("/job/:id", isAuthenticated, seekerListings.recommendationJobDetailsRoute);


router.get("/jobs/:id", isAuthenticated, seekerController.jobDetailsRoute);


router.post("/apply/:jobId", isAuthenticated, seekerController.jobApplyRoute);


router.get("/myapplications", seekerController.myApplicationRoute);

router.post("/application/withdraw/:id", isAuthenticated,seekerController.applicationWithdrawRoute);


router.get("/seeker/edit", isAuthenticated,seekerController.profileEditGetRoute);

router.post("/seeker/edit", isAuthenticated, upload.single("resume"),seekerController.profileEditPostRoute);

router.get("/seeker/profile", isAuthenticated,seekerController.profileRoute );

router.get("/jobs/:id/practice-interview", seekerController.practiceInterviewRoute);
module.exports=router;