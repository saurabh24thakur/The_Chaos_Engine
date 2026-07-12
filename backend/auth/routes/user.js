import express from "express";
import User from "../models/user.model.js";

const router = express.Router();

// Sync user details to MongoDB
router.post("/sync", async (req, res) => {
  const { clerkId, email, firstName, lastName, username, imageUrl } = req.body;

  if (!clerkId || !email) {
    return res.status(400).json({ message: "clerkId and email are required" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        clerkId,
        firstName: firstName ?? "",
        lastName: lastName ?? "",
        username: username ?? "",
        email,
        imageUrl: imageUrl ?? "",
        lastLogin: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to sync user to database",
      error: error.message,
    });
  }
});

export default router;
