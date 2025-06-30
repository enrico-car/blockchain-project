const express = require("express");

const User = require("../../models/User");

const getUserInfo = async (req, res) => {
  const address = req.params.address;

  const userByAddress = await User.findOne({
    wallet: address,
  });

  if (!userByAddress) {
    return res.status(400).json({ message: "No corresponding user" });
  }

  const user = userByAddress;

  // Convert mongoose doc to plain JS object
  const userObj = user.toObject();

  // Return the full user object (with all fields)
  return res.status(200).json({ user: userObj, message: "success" });
};

const getAllUserInfo = async (req, res) => {
  try {
    const users = await User.find({});

    // Mappa ogni prodotto e converte in plain object + immagine base64
    const userObjs = users.map((user) => {
      const obj = user.toObject();

      return obj;
    });

    return res.status(200).json({ users: userObjs, message: "success" });
  } catch (err) {
    console.error("Error in getAllUserInfo:", err);
    return res.status(500).json({ message: "Error in user retrival" });
  }
};

const addUser = async (req, res) => {
  try {
    const allowedFields = [
      "wallet",
      "realName",
      "location",
      "type",
    ];

    const userData = {};

    // Parse fields from req.body; parse JSON strings for array fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        userData[field] = req.body[field];
      }
    }

    const existing = await User.findOne({ wallet: userData.wallet });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User(userData);
    await user.save();

    return res.status(201).json({ message: "success" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "database error" });
  }
};

const deleteUser = async (req, res) => {
  const address = req.params.address;

  try {
    // try to delete by id
    let deletedUser = await User.findOneAndDelete({ wallet: address });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = function () {
  const router = express.Router();

  router.get("/info/:address", getUserInfo);
  router.get("/all", getAllUserInfo);
  router.delete("/delete/:address", deleteUser);
  router.post("/create", addUser);

  return router;
};