import { Schema, model, Document, Types } from 'mongoose';

export interface IContract extends Document {
  _id: Types.ObjectId;
  address: string;
  chain: string;
  abi: object[];
  name: string;
  createdAt: Date;
}

const contractSchema = new Schema<IContract>(
  {
    address: { type: String, required: true },
    chain:   { type: String, required: true },
    abi:     { type: [Object], default: [] },
    name:    { type: String, default: '' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

contractSchema.index({ address: 1, chain: 1 }, { unique: true });

export const ContractModel = model<IContract>('Contract', contractSchema);
