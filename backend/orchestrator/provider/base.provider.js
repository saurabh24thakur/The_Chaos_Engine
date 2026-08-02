class BaseProvider {

    constructor(name) {
        this.name = name;
    }

    async generate({ model, messages }) {
        throw new Error(
            `${this.name} must implement generate().`
        );
    }

    async *stream({ model, messages }) {
        throw new Error(
            `${this.name} must implement stream().`
        );
    }

}

export default BaseProvider;