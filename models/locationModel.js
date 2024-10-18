// models/locationModel.js
const mongoose = require("mongoose");

// Define schema for location
const locationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Location = mongoose.model("Location", locationSchema);

module.exports = Location;
