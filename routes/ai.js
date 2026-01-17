const express = require("express");
const router = express.Router();
const generateJobDescription = require("../utils/aiJobDescription");
const aiController=require("../controllers/ai");

router.post("/job-description",aiController.generateJobDescription);

module.exports = router;