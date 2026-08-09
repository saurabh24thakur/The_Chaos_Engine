class BaseProvider {

    constructor(name) {
        this.name = name;
    }

    async generate() {
        throw new Error("generate() not implemented");
    }

    async stream() {
        throw new Error("stream() not implemented");
    }

}

export default BaseProvider;
