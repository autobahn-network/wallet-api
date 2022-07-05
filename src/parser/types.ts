import { TokenType } from "../constants";

export interface TokenInfo {
  decimals?: number;
  name?: string;
  symbol?: string;
}

export interface Transfer {
  eventName: string;
  contract: string;
  type: TokenType;
  from: string;
  to: string;
  name: string;
  symbol: string;
  processed?: boolean;
}

export interface Erc20Transfer extends Transfer {
  value: string;
  decimals: number;
}

export interface Erc721Transfer extends Transfer {
  tokenId: string;
}

export interface Erc1155TransferSingle extends Transfer {
  tokenId: string;
  value: string;
}

export interface Erc1155TransferBatch extends Transfer {
  tokenIds: string[];
  values: string[];
}

export type AnyTransfer = Transfer &
  Erc20Transfer &
  Erc721Transfer &
  Erc1155TransferSingle &
  Erc1155TransferBatch;
