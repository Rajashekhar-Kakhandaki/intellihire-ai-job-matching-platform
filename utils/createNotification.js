const Notification = require("../models/notification");

module.exports = async function createNotification({
  userId,
  userModel,
  message,
  link = null
}) {
    if(!userId || !userModel || !message) return;
  await Notification.create({
    user: userId,
    userModel,
    message,
    link
  });
};