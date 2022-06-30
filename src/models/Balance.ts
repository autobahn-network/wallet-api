import { model, Schema } from "mongoose";
import { TokenType } from "../constants";

export interface Balance {
  holder: string; // just the address
  contract: string;
  name?: string;
  symbol?: string;
  type: TokenType;
}

export interface Erc20Balance extends Balance {
  decimals: number;
  value: string;
}

export interface Erc721Balance extends Balance {
  tokenIds: string[];
}

export interface Erc1155Balance extends Erc721Balance {
  values: string[];
}

const balanceSchema = new Schema<Erc721Balance | Erc1155Balance | Erc20Balance>(
  {
    holder: { type: String, required: true },
    contract: { type: String, required: true },
    name: { type: String },
    symbol: { type: String },
    decimals: { type: Number },
    value: { type: String },
    tokenIds: { type: [String] },
    values: { type: [String] },
    type: { type: String, required: true, enum: Object.values(TokenType) },
  }
);

balanceSchema.index({ holder: 1, contract: 1 }, { unique: true, sparse: true });

export const BalanceModel = model<
  Erc721Balance | Erc1155Balance | Erc20Balance
>("Balance", balanceSchema);
