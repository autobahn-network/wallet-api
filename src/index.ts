import { ethers } from "ethers";
import { config } from "./config";
import { connect } from "./db";
import { LastBlockModel, TransferModel } from "./models";
import { parse } from "./parser";
import { buildHolders } from "./holders";
import { sleep } from "./utils";
import "./api";

const provider = new ethers.providers.JsonRpcProvider(config.rpc);

const processBlocks = async (current: number, last: number) => {
  if (current > last) {
    return;
  }

  console.info(`Gathering data for block number ${current}`);
  const block = await provider.getBlockWithTransactions(current);
  if (block.transactions.length > 0) {
    // there will always be only one tx
    const tx = block.transactions[0];
    const txReceipt = await provider.getTransactionReceipt(tx.hash);
    const transfers = await parse(provider, txReceipt);
    if (transfers.length > 0) {
      await TransferModel.insertMany(
        transfers.map((t) => new TransferModel(t))
      );
      await LastBlockModel.updateOne(
        {},
        { $set: { no: current } },
        { upsert: true }
      );
    }
  }

  return await processBlocks(current + 1, last);
};

const setupProcessBlocks = async () => {
  try {
    let lastBlockNumber = 0;
    const lastPersistedBlock = await LastBlockModel.findOne({});
    if (lastPersistedBlock) {
      lastBlockNumber = lastPersistedBlock.no + 1;
    }
    const latestBlock = await provider.getBlock("latest");

    await processBlocks(lastBlockNumber, latestBlock.number);
    await sleep(1000);
    await setupProcessBlocks();
  } catch (err) {
    console.error("Something went wrong in setupProcessBlocks", err);
    await sleep(10000);
    await setupProcessBlocks();
  }
};

const setupBuildHolders = async () => {
  try {
    await buildHolders();
    await sleep(1000);
    await setupBuildHolders();
  } catch (err) {
    console.error("Something went wrong in setupBuildHolders", err);
    setTimeout(setupBuildHolders, 10000);
  }
};

const run = async () => {
  await connect();

  // these will run forever
  await Promise.all([setupProcessBlocks(), setupBuildHolders()]);
};

run()
  .then(() => {
    console.log("Process ended");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Process failed", err);
    process.exit(1);
  });
