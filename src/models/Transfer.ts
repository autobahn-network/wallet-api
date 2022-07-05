import { model, Schema } from "mongoose";
import { AnyTransfer } from "../parser/types";
import { TokenType } from "../constants";

const transferSchema = new Schema<AnyTransfer>({
  eventName: { type: String, required: true },
  contract: { type: String, required: true },
  type: { type: String, required: true, enum: Object.values(TokenType) },
  from: { type: String, required: true },
  to: { type: String, required: true },
  name: { type: String },
  symbol: { type: String },
  value: { type: String },
  decimals: { type: Number },
  tokenId: { type: String },
  tokenIds: { type: [String] },
  values: { type: [String] },
  processed: { type: Boolean, required: true, default: false },
});

export const TransferModel = model<AnyTransfer>("Transfer", transferSchema);
