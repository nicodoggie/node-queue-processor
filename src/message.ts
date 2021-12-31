class Message {
    private name: string;
    private data: object;
    constructor(name: string, data: object) {
        this.name = name;
        this.data = data;
    }

    getName() {
        return this.name;
    }

    getData() {
        return this.data;
    }
}

export { Message }