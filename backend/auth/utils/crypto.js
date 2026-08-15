import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getSecret() {
  return (
    process.env.PROVIDER_CREDENTIALS_SECRET ||
    process.env.INTERNAL_SERVICE_TOKEN ||
    process.env.CLERK_SECRET_KEY ||
    "chaos-engine-provider-secret"
  );
}

function getKey() {
  return crypto.createHash("sha256").update(getSecret()).digest();
}

export function encryptSecret(value) {
  if (!value) {
    return "";
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(
    ":"
  );
}

export function decryptSecret(payload) {
  if (!payload) {
    return "";
  }

  const [ivHex, tagHex, encryptedHex] = String(payload).split(":");

  if (!ivHex || !tagHex || !encryptedHex) {
    return "";
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function maskSecret(value) {
  const raw = String(value || "");

  if (!raw) {
    return "";
  }

  return `********${raw.slice(-4)}`;
}

