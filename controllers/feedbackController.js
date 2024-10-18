const FeedBack = require("../models/feedbackModel");
const { notifyClientsNewFeedback } = require("../webSocket/feedback_websocket");

exports.createFeedback = async (req, res, next) => {
  try {
    const feedback = await FeedBack.create(req.body);

    if (!feedback) {
      return res.status(500).json({
        success: "Failed",
        message: "Error while creating feedback ",
      });
    }

    notifyClientsNewFeedback(feedback);

    res.status(200).json({
      success: "Success",
      data: feedback,
    });
  } catch (error) {
    return res.status(404).json({
      status: "fail",
      message: error.message,
    });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await FeedBack.find();

    if (!feedbacks || feedbacks.length === 0) {
      return res.status(404).json({
        success: "Failed",
        message: "No Feedback Found",
      });
    }

    return res.status(200).json({
      success: "Success",
      data: feedbacks,
    });
  } catch (error) {
    return res.status(500).json({
      success: "Failed",
      message: error.message,
    });
  }
};

exports.getAllFeedbackForWebSocket = async () => {
  const feedbacks = await FeedBack.find();

  if (!feedbacks) {
    throw new Error("Not able to fetch feedbacks");
  }
  return feedbacks;
};
