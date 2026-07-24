const MODELS = {

    chat: {
        provider: "google",
        model: "gemini-2.5-flash"
    },

    coding: {
        provider: "groq",
        model: "deepseek-r1-distill-llama-70b"
    },

    pdf: {
        provider: "google",
        model: "gemini-2.5-flash"
    },

    ppt: {
        provider: "google",
        model: "gemini-2.5-flash"
    },

    image: {
        provider: "huggingface",
        model: "black-forest-labs/FLUX.1-dev"
    }

};

export default MODELS;