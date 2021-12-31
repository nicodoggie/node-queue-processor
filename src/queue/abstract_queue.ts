import { Message } from '../message';

abstract class QueueModel {
    abstract pull(): Promise<any>
    abstract push(type:string, data:object): Promise<any>
}

export { QueueModel };