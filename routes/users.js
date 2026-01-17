const express=require("express");
const router=express.Router();
const userController=require("../controllers/users")

const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const { isAuthenticated } = require("../middleware");


router.get("/home", userController.homeRoute);


router.get("/signup", userController.signUpGetRoute);

router.post("/signup", upload.single("resume"),userController.signUpPostRoute);

router.get("/login", userController.loginGetRoute);

router.post("/login",userController.loginPostRoute);


router.get("/logout", isAuthenticated, userController.logOut);

router.post("/account/delete", isAuthenticated, userController.accountDeleteRoute);

router.get("/notifications", isAuthenticated,userController.notificationGetRoute);
router.post("/notifications/:id/read", userController.notificationPostRoute);
router.post("/notifications/:id/delete", isAuthenticated, userController.notificationDeleteRoute);
module.exports=router;