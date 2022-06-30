import { ethers } from "ethers";
import {
  erc1155 as erc1155abi,
  erc20 as erc20abi,
  erc721 as erc721abi,
} from "../abis";
import { Transfer } from "./types";
import { Token, TokenModel } from "../models";
import { TokenType } from "../constants";

const handleNoMatchingEvent = (err) => {
  if (
    err.message.startsWith("no matching event") ||
    err.message.startsWith("data out-of-bounds")
  ) {
    return;
  }

  throw err;
};

const tokenTypes = [
  {
    type: TokenType.Erc20,
    abi: erc20abi,
  },
  {
    type: TokenType.Erc721,
    abi: erc721abi,
  },
  {
    type: TokenType.Erc1155,
    abi: erc1155abi,
  },
];

const call = async (contract, method) => {
  try {
    return await contract[method]();
  } catch (err) {
    // ignore err
  }
};

const fetchTokenInfo = async (
  provider: ethers.providers.Provider,
  address: string,
  abi: any
) => {
  const contract = new ethers.Contract(address, abi, provider);
  const methods = ["decimals", "name", "symbol"];
  const [decimals, name, symbol] = await Promise.all(
    methods.map((method) => call(contract, method))
  );
  return {
    decimals,
    name,
    symbol,
  };
};

const supportedEvents = ["Transfer", "TransferSingle", "TransferBatch"];

const parseLog = (abi, log) => {
  try {
    const parsed = new ethers.utils.Interface(abi).parseLog(log);
    if (supportedEvents.includes(parsed.name)) {
      return parsed;
    }
  } catch (err) {
    handleNoMatchingEvent(err);
  }

  return null;
};

let cachedTokenModels = new Map<string, Token>();

export const parse = async (
  provider: ethers.providers.Provider,
  txReceipt
): Promise<Transfer[]> => {
  let transfers = [];

  for (const log of txReceipt.logs) {
    let token: Token =
      cachedTokenModels.get(log.address) ||
      (await TokenModel.findOne({ contract: log.address }));

    if (!token) {
      const { decimals, name, symbol } = await fetchTokenInfo(
        provider,
        log.address,
        erc20abi
      );

      token = await new TokenModel({
        contract: log.address,
        decimals,
        name,
        symbol,
      }).save();
      cachedTokenModels.set(log.address, token);
    }

    for (const tokenType of tokenTypes) {
      const parsed = parseLog(tokenType.abi, log);
      if (!parsed) {
        continue;
      }
      const transferData = {
        eventName: parsed.name,
        contract: log.address,
        type: tokenType.type,
        from: parsed.args.from,
        to: parsed.args.to,
        name: token.name,
        symbol: token.symbol,
      };
      switch (tokenType.type) {
        case TokenType.Erc20:
          transfers.push({
            ...transferData,
            decimals: token.decimals,
            value: parsed.args.value,
          });
          break;
        case TokenType.Erc721:
          transfers.push({
            ...transferData,
            tokenId: parsed.args.tokenId,
          });
          break;
        case TokenType.Erc1155:
          if (parsed.name === "TransferSingle") {
            transfers.push({
              ...transferData,
              tokenId: parsed.args.id,
              value: parsed.args.value,
            });
          } else {
            transfers.push({
              ...transferData,
              tokenIds: parsed.args[3],
              values: parsed.args[4],
            });
          }
          break;
      }
    }
  }

  return transfers;
};
