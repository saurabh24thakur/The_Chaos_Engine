import express from "express";
import User from "../models/user.model.js";
import { decryptSecret, encryptSecret, maskSecret } from "../utils/crypto.js";

const router = express.Router();

const SUPPORTED_PROVIDERS = [
  "google",
  "openai",
  "openrouter",
  "groq",
  "huggingface",
];

function getUserId(req) {
  return (
    req.body?.userId ||
    req.query?.userId ||
    req.headers["x-user-id"] ||
    ""
  )
    .toString()
    .trim();
}

function normalizeProvider(provider) {
  return String(provider || "").trim().toLowerCase();
}

function buildProviderState(credentials = {}) {
  return SUPPORTED_PROVIDERS.map((provider) => {
    const current = credentials?.[provider] || {};

    return {
      provider,
      configured: Boolean(current.configured),
      maskedKey: current.maskedKey || "",
    };
  });
}

async function loadUser(userId) {
  return User.findById(userId);
}

async function saveCredential(userId, provider, apiKey) {
  const encryptedKey = encryptSecret(apiKey);
  const maskedKey = maskSecret(apiKey);

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        [`providerCredentials.${provider}`]: {
          encryptedKey,
          maskedKey,
          configured: true,
          updatedAt: new Date(),
        },
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return user?.providerCredentials?.[provider] || {
    encryptedKey,
    maskedKey,
    configured: true,
  };
}

router.get("/providers", async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const user = await loadUser(userId);

    return res.json({
      providers: buildProviderState(user?.providerCredentials),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load provider settings.",
      error: error.message,
    });
  }
});

router.get("/providers/:provider/key", async (req, res) => {
  try {
    const internalToken = req.headers["x-internal-token"] || "";
    const expectedToken =
      process.env.INTERNAL_SERVICE_TOKEN || "chaos-engine-internal-dev";

    if (!internalToken || internalToken !== expectedToken) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const userId = getUserId(req);
    const provider = normalizeProvider(req.params.provider);

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      return res.status(400).json({ message: "Unsupported provider." });
    }

    const user = await loadUser(userId);
    const credential = user?.providerCredentials?.[provider];

    if (!credential?.configured || !credential.encryptedKey) {
      return res.status(404).json({ message: "Provider key not configured." });
    }

    return res.json({
      provider,
      apiKey: decryptSecret(credential.encryptedKey),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to load provider key.",
      error: error.message,
    });
  }
});

router.post("/providers", async (req, res) => {
  try {
    const userId = getUserId(req);
    const provider = normalizeProvider(req.body?.provider);
    const apiKey = String(req.body?.apiKey || "").trim();

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    if (!provider) {
      return res.status(400).json({ message: "provider is required." });
    }

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      return res.status(400).json({ message: "Unsupported provider." });
    }

    if (!apiKey) {
      return res.status(400).json({ message: "apiKey is required." });
    }

    const credential = await saveCredential(userId, provider, apiKey);

    return res.status(200).json({
      provider,
      configured: true,
      maskedKey: credential.maskedKey || maskSecret(apiKey),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to save provider key.",
      error: error.message,
    });
  }
});

router.put("/providers/:provider", async (req, res) => {
  try {
    const userId = getUserId(req);
    const provider = normalizeProvider(req.params.provider);
    const apiKey = String(req.body?.apiKey || "").trim();

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    if (!provider) {
      return res.status(400).json({ message: "provider is required." });
    }

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      return res.status(400).json({ message: "Unsupported provider." });
    }

    if (!apiKey) {
      return res.status(400).json({ message: "apiKey is required." });
    }

    const credential = await saveCredential(userId, provider, apiKey);

    return res.json({
      provider,
      configured: true,
      maskedKey: credential.maskedKey || maskSecret(apiKey),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update provider key.",
      error: error.message,
    });
  }
});

router.delete("/providers/:provider", async (req, res) => {
  try {
    const userId = getUserId(req);
    const provider = normalizeProvider(req.params.provider);

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      return res.status(400).json({ message: "Unsupported provider." });
    }

    await User.findByIdAndUpdate(
      userId,
      {
        $unset: {
          [`providerCredentials.${provider}`]: 1,
        },
      }
    );

    return res.json({
      provider,
      configured: false,
      maskedKey: "",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete provider key.",
      error: error.message,
    });
  }
});

export default router;

