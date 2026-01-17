const mongoose = require("mongoose");
const Job = require("./models/job");

mongoose.connect("mongodb://127.0.0.1:27017/smartJobHireDb");

(async () => {
  const jobs = await Job.find();

  for (let job of jobs) {
    const exp = job.experienceRequired?.toLowerCase();

    let min = 0;
    let max = null;

    if (!exp) continue;

    // 0-2, 1-3, 2-5 years
    if (exp.includes("-")) {
      const nums = exp.match(/\d+/g);
      if (nums && nums.length === 2) {
        min = Number(nums[0]);
        max = Number(nums[1]);
      }
    }

    // 3+ years
    else if (exp.includes("+")) {
      min = Number(exp.match(/\d+/)[0]);
      max = null;
    }

    // fresher
    else if (exp.includes("fresher") || exp.includes("0")) {
      min = 0;
      max = 0;
    }

    job.minExperience = min;
    job.maxExperience = max;
    await job.save();

    console.log(`✅ Updated ${job.title}: ${min}-${max}`);
  }

  console.log("🎉 Experience migration completed");
  mongoose.disconnect();
})();
