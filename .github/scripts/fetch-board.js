import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import pLimit from "p-limit";

// Constants
const ROWS = 8;
const COLS = 8;
const CONCURRENCY = 4;

// Smart Contract (Base Mainnet)
const CONTRACT_ADDRESS = "0x11e89363322EB8B12AdBFa6745E3AA92de6ddCD0";
const ABI = [
  "function getCell(uint256 row, uint256 col) view returns (string content, uint256 value, address lastUpdater, uint256 lockedUntil)",
];

// Base Mainnet RPC
const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";

// Output file path
const OUTPUT_PATH = path.resolve("grid.json");

async function fetchGrid() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  const limit = pLimit(CONCURRENCY);

  const grid = [];

  for (let row = 0; row < ROWS; row++) {
    const rowPromises = [];

    for (let col = 0; col < COLS; col++) {
      const cellPromise = limit(async () => {
        try {
          const [content, value, lastUpdater, lockedUntil] = await contract.getCell(row, col);
          return {
            content,
            value: value.toString(),
            lastUpdater,
            lockedUntil: Number(lockedUntil),
          };
        } catch (err) {
          console.error(`Error at cell (${row}, ${col}):`, err.reason || err.message || err);
          return null;
        }
      });

      rowPromises.push(cellPromise);
    }

    const rowData = await Promise.all(rowPromises);
    grid.push(rowData);
  }

  try {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(grid, null, 2));
    console.log(`Grid saved to ${OUTPUT_PATH}`);
  } catch (err) {
    console.error("Failed to write file:", err.message || err);
  }
}

fetchGrid().catch(err => {
  console.error("Unhandled error in fetchGrid:", err.message || err);
  process.exit(1);
});
