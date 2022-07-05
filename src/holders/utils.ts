import { BigNumber, ethers } from "ethers";
import { BalanceModel } from "../models";

export const ZERO = BigNumber.from("0");

export const findBalance = async (holder: string, contract: string) =>
  BalanceModel.findOne({ holder, contract });

export const add = (oldValue: string, newValue: string, decimals: number = 0) =>
  ethers.utils
    .parseUnits(oldValue, decimals)
    .add(ethers.utils.parseUnits(newValue, decimals));

export const subtract = (
  oldValue: string,
  newValue: string,
  decimals: number = 0
) =>
  ethers.utils
    .parseUnits(oldValue, decimals)
    .sub(ethers.utils.parseUnits(newValue, decimals));

export const push = (arr: string[], val: string) =>
  [].concat(arr).concat([val]);

export const allExcept = (arr: string[], val: string) =>
  arr.filter((el) => el !== val);

export const allExceptIndex = (arr: string[], index: number) =>
  arr.filter((_, i) => i !== index);

export const addIfNotIncludes = (arr: string[], val: string) => {
  if (arr.includes(val)) {
    return arr;
  }

  return [].concat(arr).concat([val]);
};

export const replaceAtIndex = (arr: string[], index: number, newVal: string) =>
  arr.map((val, i) => (i === index ? newVal : val));

export const indexOf = (arr: string[], val: string) =>
  arr.findIndex((el) => el === val);
