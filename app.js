require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");

const Recruiter = require("./models/recruiter");
const Seeker = require("./models/seeker");

const ejsMate = require("ejs-mate");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");

const users = require("./routes/users");
const recruiter = require("./routes/recruiter");
const seeker = require("./routes/seeker");
const aiRoutes = require("./routes/ai");

const ExpressError = require("./utils/ExpressError");
const Notification = require("./models/notification");
const notificationMiddleware = require("./middlewares/notificationMiddleware");

// -------------------- BASIC SETUP --------------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

// -------------------- SESSION --------------------
app.use(
  session({
    secret: "secretkey123",
    resave: false,
    saveUninitialized: true
  })
);

app.use(flash());

// -------------------- DATABASE --------------------
mongoose
  .connect("mongodb+srv://rajashekharkakhandaki8_db_user:pZowyG3IZtpJLi3P@cluster0.ekm46kn.mongodb.net/?appName=Cluster0")
  .then(() => console.log("connected successfully"))
  .catch(err => console.error(err));

// -------------------- GLOBAL USER --------------------
app.use(async (req, res, next) => {
  if (req.session.userId && req.session.role) {
    res.locals.user =
      req.session.role === "seeker"
        ? await Seeker.findById(req.session.userId)
        : await Recruiter.findById(req.session.userId);
  } else {
    res.locals.user = null;
  }
  next();
});

// -------------------- FLASH --------------------
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// -------------------- NOTIFICATION COUNT --------------------
app.use(async (req, res, next) => {
  if (req.session.userId && req.session.role) {
    res.locals.unreadNotifications = await Notification.countDocuments({
      user: req.session.userId,
      userModel: req.session.role === "seeker" ? "Seeker" : "Recruiter",
      isRead: false
    });
  } else {
    res.locals.unreadNotifications = 0;
  }
  next();
});

app.use(notificationMiddleware);

// -------------------- ROUTES --------------------
app.get("/",(req,res)=>{
  res.render("./users/home", { pageCss: "home" });
})
app.use("/ai", aiRoutes);
app.use("/", users);
app.use("/", recruiter);
app.use("/", seeker);

// -------------------- ERROR HANDLING --------------------
app.use((req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  res.status(statusCode).render("error", { err });
});

// -------------------- SERVER --------------------
app.listen(3000, () => {
  console.log("app is listening at 3000 port");
});