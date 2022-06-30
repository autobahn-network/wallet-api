import { ethers } from "ethers";
import {
  Balance,
  BalanceModel,
  Erc1155Balance,
  Erc20Balance,
  Erc721Balance,
} from "../models";
import { TokenType } from "../constants";
import { Document } from "mongoose";

const cleanBalances = (balances: Balance[]) => {
  return balances.map((b) => {
    if (b.type !== TokenType.Erc1155) {
      delete (b as Erc1155Balance).tokenIds;
      delete (b as Erc1155Balance).values;
    }
    if (b.type !== TokenType.Erc721) {
      delete (b as Erc721Balance).tokenIds;
    }
    if (b.type !== TokenType.Erc20) {
      delete (b as Erc20Balance).decimals;
    }
    // We don't need the mongo fields in the res
    delete (b as unknown as Document)._id;
    delete (b as unknown as Document).__v;
    return b;
  });
};

export const getBalances = async (req, res) => {
  const { address } = req.params;
  const resData = {
    address,
  };

  if (!address) {
    return res.status(400).json({ msg: 'Missing arg "address"' });
  }
  if (typeof address !== "string") {
    return res.status(400).json({ msg: "Holder must be of type string" });
  }
  if (!ethers.utils.isAddress(address)) {
    return res.status(400).json({ msg: "Holder is no valid address" });
  }
  const checksumAddress = ethers.utils.getAddress(address);
  const balances = await BalanceModel.find({ holder: checksumAddress });

  return res.status(200).json({
    ...resData,
    balances: cleanBalances(balances.map((b) => b.toObject())),
  });
};
