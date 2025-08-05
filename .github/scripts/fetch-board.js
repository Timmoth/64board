import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Constants
const ROWS = 8;
const COLS = 8;
const BATCH_SIZE = 4;
const ROW_DELAY_MS = 1000;

// Smart Contract (Base Mainnet)
const CONTRACT_ADDRESS = "0x11e89363322EB8B12AdBFa6745E3AA92de6ddCD0";
const ABI = [
  "function getCell(uint256 row, uint256 col) view returns (string content, uint256 value, address lastUpdater, uint256 lockedUntil)",
];

// RPC and output
const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";
const OUTPUT_PATH = path.resolve("grid.json");

const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchCell(contract, row, col) {
  try {
    const [content, value, lastUpdater, lockedUntil] = await contract.getCell(row, col);
    return {
      content,
      value: value.toString(),
      lastUpdater,
      lockedUntil: Number(lockedUntil),
    };
  } catch (err) {
    console.error(`Error fetching cell (${row}, ${col}):`, err.reason || err.message || err);
    return null;
  }
}

async function fetchRow(contract, row) {
  const rowData = [];

  for (let i = 0; i < COLS; i += BATCH_SIZE) {
    const batch = [];

    for (let j = i; j < i + BATCH_SIZE && j < COLS; j++) {
      batch.push(fetchCell(contract, row, j));
    }

    const batchResults = await Promise.all(batch);
    rowData.push(...batchResults);
  }

  return rowData;
}

async function fetchGrid() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  const grid = [];

  for (let row = 0; row < ROWS; row++) {
    console.log(`Fetching row ${row}...`);
    const rowData = await fetchRow(contract, row);
    grid.push(rowData);
    await delay(ROW_DELAY_MS); // Wait between rows
  }

  try {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(grid, null, 2));
    console.log(`Grid saved to ${OUTPUT_PATH}`);
  } catch (err) {
    console.error("Failed to write file:", err.message || err);
  }
}

fetchGrid().catch(err => {
  console.error("Unhandled error:", err.message || err);
  process.exit(1);
});
