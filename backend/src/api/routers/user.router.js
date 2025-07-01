const express = require("express");

const User = require("../../models/User");

/**
 * Endpoint to obtain the info of a user based on the User model
 * @param {*} req contains the address of the user wallet
 * @param {*} res will return the corresponding response with a given code
 * @returns 200 and the user info, 404 if no user has been found
 */
const getUserInfo = async (req, res) => {
  const address = req.params.address;

  const userByAddress = await User.findOne({ wallet: address });

  if (!userByAddress) {
    return res.status(404).json({ message: "No corresponding user" });
  }

  //convert mongoose doc to plain JS object
  const userObj = userByAddress.toObject();

  //return the full user object (with all fields)
  return res.status(200).json({ user: userObj, message: "success" });
};

/**
 * Endpoint to obtain the info of all users
 * @param {*} req
 * @param {*} res will return the corresponding response with a given code
 * @returns 200 and the users info, 500 for any error
 */
const getAllUserInfo = async (req, res) => {
  try {
    const users = await User.find({});

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

/**
 * Endpoint to add a new user by following the User model
 * @param {*} req contains the user infos
 * @param {*} res will return a message based on the outcome
 * @returns 200 if the user has been saved, 500 otherwise
 */
const addUser = async (req, res) => {
  try {
    //list of all the fileds accepted
    const allowedFields = [
      "wallet",
      "realName",
      "location",
      "type",
    ];

    const userData = {};

    //parse fields from req.body; parse JSON strings for array fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        userData[field] = req.body[field];
      }
    }

    const existing = await User.findOne({ wallet: userData.wallet });

    if (existing) {
      return res.status(500).json({ message: "User already exists" });
    }

    const user = new User(userData);
    await user.save();

    return res.status(200).json({ message: "success" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "database error" });
  }
};

/**
 * Endpoint to delete a user
 * @param {*} req contains the user wallet
 * @param {*} res will return a message based on the outcome
 * @returns 200 if the user has been deleted, 404 if not found, 500 otherwise
 */
const deleteUser = async (req, res) => {
  const address = req.params.address;

  try {
    // try to delete by wallet
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