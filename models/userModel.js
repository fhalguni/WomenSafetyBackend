const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmPassword: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: "Passwords do not match",
    },
  },
  message_template: {
    type: String,
  },
  guardian: [
    {
      name: {
        type: String,
      },
      phoneNumber: {
        type: String,
      },
    },
  ],

  isPhoneVerified: {
    type: Boolean,
    default: false,
  },

  verificationToken: String,

  otp: Number,

  role: {
    type: String,
    required: true,
    enum: ["gurdian", "user"],
  },

  feedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Feedback",
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
