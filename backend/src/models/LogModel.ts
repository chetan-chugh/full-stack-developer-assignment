import mongoose, { Schema, Types } from "mongoose";

export interface ILogModel {
  user: Types.ObjectId | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

const logModelSchema = new Schema<ILogModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true },
    details: { type: String, default: null },
    ipAddress: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

logModelSchema.index({ createdAt: -1 });

const LogModel = mongoose.model<ILogModel>("LogModel", logModelSchema);

export default LogModel;
