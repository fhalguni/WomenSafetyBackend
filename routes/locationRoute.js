const express = require("express");
const locationController = require("../controllers/locationController");

const router = express.Router();

// Get Live Location

router.route("/getLiveLocation").get(locationController.getUserLiveLocation);
