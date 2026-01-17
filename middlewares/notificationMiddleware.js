const Notification = require("../models/notification");

module.exports = async function notificationMiddleware(req, res, next) {
  try {
    if (!req.session.userId || !req.session.role) {
      res.locals.unreadNotifications = 0;
      return next();
    }

    const count = await Notification.countDocuments({
      user: req.session.userId,
      userModel: req.session.role === "seeker" ? "Seeker" : "Recruiter",
      isRead: false
    });

    res.locals.unreadNotifications = count;
    next();
  } catch (err) {
    console.error("Notification middleware error:", err);
    res.locals.unreadNotifications = 0;
    next();
  }
};