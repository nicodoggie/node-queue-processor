export interface PublishMessageType {
    type: string;
};

export interface PublishMessage {
    data: Buffer,
    attributes: PublishMessageType
};