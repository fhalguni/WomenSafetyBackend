const express = require("express");
const feedbackController = require("../controllers/feedbackController");

const router = express.Router();

router.route("/sendFeedback").post(feedbackController.createFeedback);
router.route("/getAllFeedback").get(feedbackController.getAllFeedback);

module.exports = router;
