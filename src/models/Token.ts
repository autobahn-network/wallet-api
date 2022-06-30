import { model, Schema } from "mongoose";
import { TokenType } from "../constants";

export interface Token {
  contract: string;
  decimals?: number;
  symbol?: string;
  name?: string;
  type: TokenType;
}

const tokenSchema = new Schema<Token>({
  contract: { type: String, required: true, unique: true },
  decimals: { type: Number },
  name: { type: String },
  symbol: { type: String },
  type: { type: String, enum: Object.values(TokenType) },
});

export const TokenModel = model<Token>("Token", tokenSchema);
