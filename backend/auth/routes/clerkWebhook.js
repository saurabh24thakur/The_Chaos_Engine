import express from "express";
import { Webhook } from "svix";
import User from "../models/user.model.js";

const router = express.Router();

router.post("/clerk", express.raw({ type: "application/json" }), async (req, res) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    return res.status(500).json({ message: "CLERK_WEBHOOK_SECRET is not set" });
  }

  const payload = req.body?.toString?.() ?? "";
  const headers = {
    "svix-id": req.headers["svix-id"],
    "svix-timestamp": req.headers["svix-timestamp"],
    "svix-signature": req.headers["svix-signature"],
  };

  let event;

  try {
    event = new Webhook(secret).verify(payload, headers);
  } catch (error) {
    return res.status(400).json({ message: "Invalid Clerk webhook signature" });
  }

  const { type, data } = event;

  try {
    if (type === "user.created" || type === "user.updated") {
      const primaryEmail =
        data.email_addresses?.find(
          (email) => email.id === data.primary_email_address_id
        )?.email_address || data.email_addresses?.[0]?.email_address;

      if (!primaryEmail) {
        return res.status(400).json({ message: "No email found on Clerk user" });
      }

      await User.findOneAndUpdate(
        { clerkId: data.id },
        {
          clerkId: data.id,
          firstName: data.first_name ?? "",
          lastName: data.last_name ?? "",
          username: data.username ?? "",
          email: primaryEmail,
          imageUrl: data.image_url ?? "",
          lastLogin: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    if (type === "user.deleted") {
      await User.findOneAndDelete({ clerkId: data.id });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to sync Clerk user",
      error: error.message,
    });
  }
});

export default router;
