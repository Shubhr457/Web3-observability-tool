import { Schema, model, Document, Types } from 'mongoose';

export interface IEvent extends Document {
  _id: Types.ObjectId;
  contractId: Types.ObjectId;
  txHash: string;
  blockNumber: number;
  eventName: string;
  decodedData: Record<string, unknown>;
  timestamp: Date;
}

const eventSchema = new Schema<IEvent>({
  contractId:  { type: Schema.Types.ObjectId, required: true, index: true },
  txHash:      { type: String, required: true },
  blockNumber: { type: Number, required: true, index: true },
  eventName:   { type: String, required: true },
  decodedData: { type: Object, default: {} },
  timestamp:   { type: Date, required: true, index: true },
});

eventSchema.index({ contractId: 1, timestamp: -1 });
eventSchema.index({ txHash: 1 });

export const EventModel = model<IEvent>('Event', eventSchema);
