import { Schema, model, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  txHash: string;
  contractId: Types.ObjectId;
  status: 'success' | 'failed';
  gasUsed: string;
  gasPrice: string;
  from: string;
  to: string;
  blockNumber: number;
  errorReason: string;
  timestamp: Date;
}

const transactionSchema = new Schema<ITransaction>({
  txHash:      { type: String, required: true, unique: true, index: true },
  contractId:  { type: Schema.Types.ObjectId, index: true },
  status:      { type: String, required: true, enum: ['success', 'failed'] },
  gasUsed:     { type: String, default: '0' },
  gasPrice:    { type: String, default: '0' },
  from:        { type: String, default: '' },
  to:          { type: String, default: '' },
  blockNumber: { type: Number, index: true },
  errorReason: { type: String, default: '' },
  timestamp:   { type: Date, index: true },
});

transactionSchema.index({ contractId: 1, timestamp: -1 });
transactionSchema.index({ status: 1, timestamp: -1 });

export const TransactionModel = model<ITransaction>('Transaction', transactionSchema);
