const bcrypt = require("bcrypt");
const Seeker = require("../models/seeker");
const Recruiter = require("../models/recruiter");
const ExpressError = require("../utils/ExpressError");
const wrapAsync = require("../utils/wrapAsync");
const Application = require("../models/application");
const Notification=require("../models/notification");
// 🏠 Home page
module.exports.homeRoute = (req, res) => {
  res.render("./users/home", { pageCss: "home" });
};

// 📝 Signup form (GET)
module.exports.signUpGetRoute = (req, res) => {
  const role = req.query.role || "seeker";
  res.render("./users/signup", { pageCss: "signup" , role });
};

// 📝 Signup form (POST)
module.exports.signUpPostRoute = wrapAsync(async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    role,
    skills,
    education,
    experience,
    companyName,
    companyWebsite,
  } = req.body;

  if (!name || !email || !password || !role) {
    throw new ExpressError("Missing required fields", 400);
  }


  // 🚫 Prevent duplicate email
  const emailExists =
    (await Seeker.findOne({ email })) ||
    (await Recruiter.findOne({ email }));

  if (emailExists) {
    throw new ExpressError("Email already registered", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let newUser;

  if (role === "seeker") {
    if (!phone || phone.length < 10) {
     throw new ExpressError("Valid phone number required", 400);
    }
    const resumeUrl = req.file ? req.file.path : null;
    const skillsArray = skills
      ? skills.split(",").map((s) => s.trim().toLowerCase())
      : [];

    newUser = await Seeker.create({
      name,
      email,
      phone,
      password: hashedPassword,
      skills: skillsArray,
      education,
      experience,
      resume: resumeUrl,
    });
  } else if (role === "recruiter") {
    newUser = await Recruiter.create({
      name,
      email,
      phone,
      password: hashedPassword,
      companyName,
      companyWebsite,
    });
  } else {
    throw new ExpressError("Invalid role", 400);
  }

  // ✅ AUTO LOGIN (SESSION SET)
  req.session.userId = newUser._id;
  req.session.role = role;

  req.flash("success", "Account created successfully!");

  // ✅ ROLE-BASED REDIRECT
  if (role === "seeker") {
    res.redirect("/index/seeker");
  } else {
    res.redirect("/index/recruiter");
  }
});


// 🔑 Login form (GET)
module.exports.loginGetRoute = (req, res) => {
  const role = req.query.role || "seeker";
  res.render("./users/login", { pageCss: "login",role });
};

// 🔑 Login form (POST)
module.exports.loginPostRoute = wrapAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ExpressError("Email and password are required", 400);
  }

  // Try seeker first
  let user = await Seeker.findOne({ email });
  let role = "seeker";

  // If not found, try recruiter
  if (!user) {
    user = await Recruiter.findOne({ email });
    role = "recruiter";
  }

  // If still not found
  if (!user) {
    req.flash("error","Invalid email or password");
    return res.redirect("/login");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    req.flash("error","Invalid Password");
    return res.redirect("/login");
  }

  // Store in session
  req.session.userId = user._id;
  req.session.role = role;

  // Redirect based on role
  req.flash("success", "Logged in successfully");
  if (role === "seeker") {
    res.redirect("/index/seeker");
  } else {
    res.redirect("/index/recruiter");
  }
});

// 🚪 Logout
module.exports.logOut = (req, res) => {
  req.flash("success", "Logged out successfully");
  req.session.destroy((err) => {
    if (err) console.error("Session destroy error:", err);
    res.redirect("/home");
  });
};

module.exports.accountDeleteRoute=async (req, res) => {
  const role = req.session.role;
  const userId = req.session.userId;

  if (role === "seeker") {
    await Application.deleteMany({ seeker: userId });
    await Seeker.findByIdAndDelete(userId);
  }

  if (role === "recruiter") {
    await Recruiter.findByIdAndDelete(userId);
  }

  req.session.destroy();
  res.redirect("/home");
};

module.exports.notificationGetRoute=wrapAsync(async (req, res) => {
  const notifications = await Notification.find({
    user: req.session.userId,
    userModel: req.session.role === "seeker" ? "Seeker" : "Recruiter"
  }).sort({ createdAt: -1 });

  res.render("users/notifications", {
    notifications,
    pageCss: "notifications"
  });
});

module.exports.notificationPostRoute=wrapAsync(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    isRead: true
  });
  res.redirect("/notifications");
});

module.exports.notificationDeleteRoute = async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.redirect("/notifications");
};
