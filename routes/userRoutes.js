const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router({ mergeParams: true });

router.route("/createUser").post(userController.createNewUser);

router.route("/getUser/:userId").get(userController.getUser);

router.route("/updateUser/:userId").patch(userController.updateUser);

router.route("/allUsers").get(userController.getAllUsers);

router.route("/deleteUser/:userId").delete(userController.deleteUser);

router.route("/signUp").post(userController.signUp);
router.route("/verifyOtp").post(userController.verifyOtp);
router.route("/resendOtp/:phoneNumber").get(userController.resendotp);

router.route("/logIn").post(userController.logIn);
module.exports = router;
