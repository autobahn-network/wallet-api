import { Document } from "mongoose";
import {
  AnyBalance,
  BalanceModel,
  Erc1155Balance,
  TransferModel,
} from "../models";
import { TokenType, ZERO_ADDRESS } from "../constants";
import { AnyTransfer } from "../parser/types";
import {
  add,
  addIfNotIncludes,
  allExcept,
  allExceptIndex,
  findBalance,
  indexOf,
  push,
  replaceAtIndex,
  subtract,
  ZERO,
} from "./utils";
import {
  ERC1155_TRANSFER_BATCH_NAME,
  ERC1155_TRANSFER_SINGLE_NAME,
} from "../abis";

enum BalanceChangeType {
  Add = "Add",
  Subtract = "Subtract",
}

const setTransferProcessed = async (transfer) => {
  return TransferModel.updateOne(
    { _id: transfer._id },
    { $set: { processed: true } }
  );
};

const handleErc1155BalanceChange = (
  balance: Document & Erc1155Balance,
  tokenId: string,
  value: string,
  type: BalanceChangeType
) => {
  let tokenIndex = indexOf(balance.tokenIds, tokenId);
  const oldValue = tokenIndex === -1 ? "0" : balance.values[tokenIndex];
  const newValue =
    type === BalanceChangeType.Subtract
      ? subtract(oldValue, value)
      : add(oldValue, value);

  // no balance of the token ID anymore
  if (newValue.lte(ZERO)) {
    balance.set("tokenIds", allExceptIndex(balance.tokenIds, tokenIndex));
    balance.set("values", allExceptIndex(balance.values, tokenIndex));
  } else {
    if (type === BalanceChangeType.Add) {
      balance.set("tokenIds", addIfNotIncludes(balance.tokenIds, tokenId));
      tokenIndex = indexOf(balance.tokenIds, tokenId);
    }

    if (tokenIndex >= balance.values.length) {
      balance.set("values", push(balance.values, newValue.toString()));
    } else {
      balance.set(
        "values",
        replaceAtIndex(balance.values, tokenIndex, newValue.toString())
      );
    }
  }

  return balance;
};

const createEmptyBalance = (transfer) =>
  new BalanceModel({
    holder: transfer.to,
    contract: transfer.contract,
    name: transfer.name,
    symbol: transfer.symbol,
    type: transfer.type,
    // we need this to satisfy typescript
    decimals: undefined,
    value: undefined,
    tokenIds: undefined,
    values: undefined,
  });

export const buildHolders = async () => {
  for await (const transfer of TransferModel.find({
    processed: false,
  })
    .sort({ _id: 1 })
    .cursor()) {
    let [fromBalance, toBalance] = await Promise.all([
      findBalance(transfer.from, transfer.contract),
      findBalance(transfer.to, transfer.contract),
    ]);

    // minting to new address
    if (transfer.from === ZERO_ADDRESS && !toBalance) {
      let balanceModel = createEmptyBalance(transfer);
      switch (transfer.type) {
        case TokenType.Erc20:
          balanceModel.set("decimals", transfer.decimals);
          balanceModel.set("value", transfer.value);
          break;
        case TokenType.Erc721:
          balanceModel.set("tokenIds", [transfer.tokenId]);
          break;
        case TokenType.Erc1155:
          if (transfer.eventName === ERC1155_TRANSFER_SINGLE_NAME) {
            balanceModel.set("tokenIds", [transfer.tokenId]);
            balanceModel.set("values", [transfer.value]);
          } else if (transfer.eventName === ERC1155_TRANSFER_BATCH_NAME) {
            balanceModel.set("tokenIds", transfer.tokenIds);
            balanceModel.set("values", transfer.values);
          }
          break;
      }
      await Promise.all([balanceModel.save(), setTransferProcessed(transfer)]);
      continue;
    }

    // Reducing/adding balance assumes balance change is according to events. We might need to fetch balances after transfers
    // in the future to check real state change. Okay for now.

    if (fromBalance) {
      switch (transfer.type) {
        case TokenType.Erc20:
          fromBalance.set(
            "value",
            subtract(fromBalance.value, transfer.value, fromBalance.decimals)
          );
          break;
        case TokenType.Erc721:
          fromBalance.set(
            "tokenIds",
            allExcept(fromBalance.tokenIds, transfer.tokenId)
          );
          break;
        case TokenType.Erc1155:
          if (transfer.eventName === ERC1155_TRANSFER_SINGLE_NAME) {
            handleErc1155BalanceChange(
              fromBalance,
              transfer.tokenId,
              transfer.value,
              BalanceChangeType.Subtract
            );
          } else if (transfer.eventName === ERC1155_TRANSFER_BATCH_NAME) {
            transfer.tokenIds.forEach((tokenId, index) => {
              handleErc1155BalanceChange(
                fromBalance,
                tokenId,
                transfer.values[index],
                BalanceChangeType.Subtract
              );
            });
          }
          break;
        default:
        // do nothing
      }
    }

    if (!toBalance) {
      // @ts-ignore todo fix
      toBalance = createEmptyBalance(transfer);
    }

    switch (transfer.type) {
      case TokenType.Erc20:
        toBalance.set(
          "value",
          add(toBalance.value || "0", transfer.value, toBalance.decimals)
        );
        break;
      case TokenType.Erc721:
        toBalance.set("tokenIds", push(toBalance.tokenIds, transfer.tokenId));
        break;
      case TokenType.Erc1155:
        if (transfer.eventName === ERC1155_TRANSFER_SINGLE_NAME) {
          handleErc1155BalanceChange(
            toBalance,
            transfer.tokenId,
            transfer.value,
            BalanceChangeType.Add
          );
        } else if (transfer.eventName === ERC1155_TRANSFER_BATCH_NAME) {
          transfer.tokenIds.forEach((tokenId, index) => {
            handleErc1155BalanceChange(
              toBalance,
              tokenId,
              transfer.values[index],
              BalanceChangeType.Add
            );
          });
        }
        break;
    }

    await Promise.all([
      fromBalance ? fromBalance.save() : async () => null,
      toBalance ? toBalance.save() : async () => null,
      setTransferProcessed(transfer),
    ]);
  }
};
