import { Annotation } from "@langchain/langgraph";

export const ChatState = Annotation.Root({

    workspace: Annotation(),

    provider: Annotation(),

    model: Annotation(),

    apiKey: Annotation(),

    userId: Annotation(),

    chatId: Annotation(),

    prompt: Annotation(),

    messages: Annotation(),

    searchResults: Annotation(),

    artifact: Annotation(),

    response: Annotation()

});
