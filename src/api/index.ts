import express from "express";
import cors from "cors";
import { getBalances } from "./holders";

const app = express();
app.use(express.json());
app.use(cors());

app.get("/balances/:address", getBalances);

app.listen(process.env.PORT || 1338, () => {});
