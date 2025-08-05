import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const ROWS = 8;
const COLS = 8;
const REQUEST_DELAY_MS = 1000; // <-- 1 second per request

const CONTRACT_ADDRESS = "0x11e89363322EB8B12AdBFa6745E3AA92de6ddCD0";
const ABI = [
  "function getCell(uint256 row, uint256 col) view returns (string content, uint256 value, address lastUpdater, uint256 lockedUntil)",
];

const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";
const OUTPUT_PATH = path.resolve("grid.json");

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function fetchGrid() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  const grid = [];

  for (let row = 0; row < ROWS; row++) {
    const rowData = [];

    for (let col = 0; col < COLS; col++) {
      try {
        console.log(`Fetching cell (${row}, ${col})...`);
        const [content, value, lastUpdater, lockedUntil] = await contract.getCell(row, col);

        rowData.push({
          content,
          value: value.toString(),
          lastUpdater,
          lockedUntil: Number(lockedUntil),
        });

        console.log(`✓ Cell (${row}, ${col}) ok`);
      } catch (err) {
        if (err.code === "CALL_EXCEPTION") {
          console.warn(`Cell (${row}, ${col}) reverted — likely uninitialized`);
        } else {
          console.error(`Error at cell (${row}, ${col}):`, err.reason || err.message || err);
        }
        rowData.push(null);
      }

      // Delay here slows every call — 1 second per request
      await delay(REQUEST_DELAY_MS);
    }

    grid.push(rowData);
  }

  try {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(grid, null, 2));
    console.log(`Grid saved to ${OUTPUT_PATH}`);
  } catch (err) {
    console.error("Failed to write file:", err.message || err);
  }
}

fetchGrid().catch((err) => {
  console.error("Unhandled error:", err.message || err);
  process.exit(1);
});
