const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const { Twilio } = require("twilio");

const accountSID = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;

// @ Create client

const client = new Twilio(accountSID, authToken);

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECERT, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // @ Creating cookies with jwt token

  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  res.cookie("jwt", token, cookieOption);

  //   Return the response

  res.status(statusCode).json({
    status: statusCode,
    message: "User logged In",
    token,
    data: {
      user,
    },
  });
};

const sendOTp = async (phoneNumber, otp) => {
  const message = `Your verification code is ${otp}`;

  try {
    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_NUMBER,
      to: `+91${phoneNumber}`,
    });

    console.log(`Message sent with SID: ${response.sid}`);
    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    return false;
  }
};

exports.signUp = async (req, res, next) => {
  try {
    const { phone_number } = req.body;

    // Check if the user already exists
    const existingAccount = await User.findOne({ phone_number });

    if (existingAccount && !existingAccount.isPhoneVerified) {
      return res.status(400).json({
        status: "error",
        message:
          "Phone number is already in use, please verify your phone number",
      });
    }

    // Generate 6-digit OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCase: false,
      specialChars: false,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
    });

    // Send OTP
    const otpSent = await sendOTp(phone_number, otp);

    if (!otpSent) {
      // If OTP failed to send, respond and stop further processing
      return res.status(500).json({
        status: "error",
        message: "Failed to send OTP.",
      });
    }

    // If no existing user or phone verification needed, create new user
    const newUser = await User.create(req.body);

    // Generate JWT token for the new user
    const token = signToken(newUser._id);

    // Set OTP and verification token to the user model
    newUser.verificationToken = token;
    newUser.otp = otp;

    await newUser.save({ validateBeforeSave: false });

    // If everything is successful, send a success response
    res.status(200).json({
      status: "success",
      message: "Otp has been sent. Please verify the account.",
    });
  } catch (err) {
    return res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone_number, otp } = req.body;

    const user = await User.findOne({ phone_number });

    if (user.otp === otp) {
      user.isPhoneVerified = true;
      user.otp = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(200).json({
        status: "success",
        message: "Otp is verified",
      });
    } else {
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP",
      });
    }
  } catch (err) {
    return res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.resendotp = async (req, res, next) => {
  try {
    const { phone_number } = req.params;
    const user = await User.findOne({ phone_number });

    if (user.isPhoneVerified) {
      return res.status(500).json({
        status: "error",
        message: "User is already verified",
      });
    }

    // Generate 6-digit OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCase: false,
      specialChars: false,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
    });

    // Send OTP
    const otpSent = await sendOTp(phone_number, otp);

    if (otpSent) {
      user.otp = otp;
      await user.save({ validateBeforeSave: false });

      return res.status(200).json({
        status: "success",
        message: "Otp has been sent. Please verify the account.",
      });
    } else {
      return res.status(500).json({
        status: "error",
        message: "Failed to send OTP.",
      });
    }
  } catch (err) {
    return res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.logIn = async (req, res, next) => {
  try {
    const { phone_number, password } = req.body;

    if (!phone_number || !password) {
      return res.status(400).json({
        status: "error",
        message: "Enter email or password",
      });
    }

    const user = await User.findOne({ phone_number });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "No user found",
      });
    }

    if (!user.isPhoneVerified) {
      return res.status(400).json({
        status: "error",
        message: "Phone Number is not verified\nPlease verify the number",
      });
    }

    user.confirmPassword = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "User logged In successfully",
      data: user,
    });
  } catch (err) {
    return res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.createNewUser = async (req, res, next) => {
  try {
    const newUser = new User(req.body); // Create a new instance of User

    if (!newUser) {
      return res.status(404).json({
        status: "error",
        message: "User not created",
      });
    }

    await newUser.save(); // Save the newUser to the database

    res.status(201).json({
      status: "success",
      data: newUser,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const users = await User.find({
      user_id: userId,
    });

    if (!users) {
      res.status(404).json({
        status: "error",
        message: "No user to this account",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User founded",
      length: users.length,
      data: users,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const updateUser = await User.findByIdAndUpdate(
      req.params.userId,
      req.body,
      {
        new: true,
      }
    );

    if (!updateUser) {
      return res.status(404).json({
        status: "fail",
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Updated the transaction",
      data: updateUser,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const deleteData = await User.findByIdAndDelete(userId);
    if (!deleteData) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }
    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
exports.updateGuardian = async (req, res, next) => {
  try {
    const { name, phoneNumber, email, guardian } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      {
        name: name,
        email: email,
        phoneNumber: phoneNumber,
        $addToSet: { guardian: { $each: guardian } },
      },
      { new: true }
    );

    console.log(guardian);

    if (!updatedUser) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }
    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.deleteGuardian = async (req, res, next) => {
  try {
    const { userId } = req.params; // Extract userId from the URL
    const { guardianId } = req.body; // Extract guardianId from the request body

    // Validate input
    if (!userId || !guardianId) {
      return res.status(400).json({
        status: "error",
        message: "User ID and Guardian ID are required",
      });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Check if the guardian exists in the user's guardian list
    const guardianExists = user.guardian.some(
      (guardian) => guardian._id.toString() === guardianId
    );
    if (!guardianExists) {
      return res.status(404).json({
        status: "error",
        message: "Guardian not found",
      });
    }

    // Remove the guardian from the user's guardian array
    user.guardian = user.guardian.filter(
      (guardian) => guardian._id.toString() !== guardianId
    );

    // Save the updated user document
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Guardian deleted successfully",
      data: user, // Optionally return updated user data
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Server error: " + err.message,
    });
  }
};
