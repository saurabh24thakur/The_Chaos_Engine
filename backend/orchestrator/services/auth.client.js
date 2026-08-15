import axios from "axios";
import env from "../config/env.js";

function getBaseUrl() {
    if (!env.AUTH_SERVICE_URL) {
        throw new Error("AUTH_SERVICE_URL is not configured.");
    }
    return env.AUTH_SERVICE_URL.replace(/\/$/, "");
}

export async function getProviderApiKey(clerkId, provider) {
    if (!clerkId) {
        throw new Error("clerkId is required.");
    }
    if (!provider) {
        throw new Error("provider is required.");
    }

    try {
        const response = await axios.get(
            `${getBaseUrl()}/api/settings/providers/${provider.toLowerCase()}/key`,
            {
                params: { clerkId },
                headers: {
                    "x-internal-token": env.INTERNAL_SERVICE_TOKEN,
                },
            }
        );
        return response.data?.apiKey || "";
    } catch (error) {
        if (error.response?.status === 404) {
            return "";
        }
        throw new Error(
            error.response?.data?.message ||
            error.message ||
            "Failed to retrieve provider API key"
        );
    }
}

const authClient = {
    getProviderApiKey,
};

export default authClient;
