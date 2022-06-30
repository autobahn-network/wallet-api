import {
  Balance,
  Erc20Balance,
  Erc721Balance,
  Erc1155Balance,
  BalanceModel,
  TransferModel,
} from "../models";
import { TokenType } from "../constants";
import {
  Erc1155TransferBatch,
  Erc1155TransferSingle,
  Erc20Transfer,
  Erc721Transfer,
} from "../parser/types";

const transferModelQuery = {
  processed: false,
};

export const buildHolders = async () => {
  for await (const transfer of TransferModel.find(transferModelQuery)
    .sort({ _id: 1 })
    .cursor()) {
    const [fromBalance, toBalance] = await Promise.all([
      BalanceModel.findOne({
        holder: transfer.from,
        contract: transfer.contract,
      }),
      BalanceModel.findOne({
        holder: transfer.to,
        contract: transfer.contract,
      }),
    ]);

    // minting
    if (!fromBalance && !toBalance) {
      let balanceModelData:
        | Balance
        | Erc20Balance
        | Erc721Balance
        | Erc1155Balance = {
        holder: transfer.to,
        contract: transfer.contract,
        name: transfer.name,
        symbol: transfer.symbol,
        type: transfer.type,
      };
      switch (transfer.type) {
        case TokenType.Erc20:
          balanceModelData = {
            ...balanceModelData,
            decimals: (transfer as Erc20Transfer).decimals,
            value: (transfer as Erc20Transfer).value,
          };
          break;
        case TokenType.Erc721:
          balanceModelData = {
            ...balanceModelData,
            tokenIds: [(transfer as Erc721Transfer).tokenId],
          };
          break;
        case TokenType.Erc1155:
          if (transfer.eventName === "TransferSingle") {
            balanceModelData = {
              ...balanceModelData,
              tokenIds: [(transfer as Erc1155TransferSingle).tokenId],
              values: [(transfer as Erc1155TransferSingle).value],
            };
          } else {
            balanceModelData = {
              ...balanceModelData,
              tokenIds: (transfer as Erc1155TransferBatch).tokenIds,
              values: (transfer as Erc1155TransferBatch).values,
            };
          }
          break;
      }
      await Promise.all([
        new BalanceModel(balanceModelData).save(),
        TransferModel.updateOne(
          { _id: transfer._id },
          { $set: { processed: true } }
        ),
      ]);
    }
  }
};
