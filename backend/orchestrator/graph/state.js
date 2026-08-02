import { Annotation } from "@langchain/langgraph";

export const ChatState = Annotation.Root({

    workspace: Annotation(),

    userId: Annotation(),

    chatId: Annotation(),

    prompt: Annotation(),

    messages: Annotation(),

    response: Annotation(),

    onToken: Annotation()

});

export const AgentState = ChatState;