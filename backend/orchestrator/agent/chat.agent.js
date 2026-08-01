import ProviderManager from "../provider/provider.manager.js";

export async function chatNode(state) {

    const { provider, model } =
        ProviderManager.getProvider(state.workspace);

    const answer = await provider.generate({

        model,

        messages: state.messages

    });

    return {

        ...state,

        response: answer

    };

}