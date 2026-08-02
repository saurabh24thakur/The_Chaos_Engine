import GoogleProvider from "./provider/google.provider.js";

const provider = new GoogleProvider();

const response = await provider.generate({

    model: "gemini-2.5-flash",

    messages: [

        {
            role: "user",
            content: "Who are you?"
        }

    ]

});

console.log(response);