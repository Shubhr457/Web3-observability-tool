import { Schema, model, Document, Types } from 'mongoose';

export type AlertType     = 'failed_tx_spike' | 'no_events' | 'gas_spike';
export type AlertSeverity = 'low' | 'medium' | 'high';

export interface IAlert extends Document {
  _id: Types.ObjectId;
  contractId: Types.ObjectId;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    contractId: { type: Schema.Types.ObjectId, index: true },
    type:       { type: String, required: true, enum: ['failed_tx_spike', 'no_events', 'gas_spike'] },
    severity:   { type: String, required: true, enum: ['low', 'medium', 'high'] },
    message:    { type: String, required: true },
    metadata:   { type: Object, default: {} },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

alertSchema.index({ contractId: 1, createdAt: -1 });
alertSchema.index({ severity: 1, createdAt: -1 });

export const AlertModel = model<IAlert>('Alert', alertSchema);
