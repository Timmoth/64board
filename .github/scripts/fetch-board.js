import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Constants
const ROWS = 8;
const COLS = 8;

// Smart Contract (Base Mainnet)
const CONTRACT_ADDRESS = "0x11e89363322EB8B12AdBFa6745E3AA92de6ddCD0"; // Make sure this is correct for Base
const ABI = [
  "function getCell(uint256 row, uint256 col) view returns (string content, uint256 value, address lastUpdater, uint256 lockedUntil)",
];

// Base Mainnet RPC
const RPC_URL = process.env.RPC_URL || "https://mainnet.base.org";

// Delay between RPC calls
const DELAY_MS = 200;
const OUTPUT_PATH = path.resolve("grid.json");

// Utility: Sleep between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchGrid() {
  console.log(`🔗 Connecting to Base via ${RPC_URL}`);
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  const grid = [];

  for (let row = 0; row < ROWS; row++) {
    const rowData = [];

    for (let col = 0; col < COLS; col++) {
      try {
        console.log(`📦 Fetching cell (${row}, ${col})...`);
        const cell = await contract.getCell(row, col);
        const [content, value, lastUpdater, lockedUntil] = cell;

        rowData.push({
          content,
          value: value.toString(), // Keep as string to avoid BigInt JSON issues
          lastUpdater,
          lockedUntil: Number(lockedUntil),
        });

        console.log(`✅ Cell (${row}, ${col}) fetched`);
      } catch (err: any) {
        console.error(`❌ Error at cell (${row}, ${col}):`, err.reason || err.message || err);
        rowData.push(null); // Optional: mark as null if fetch fails
      }

      await delay(DELAY_MS);
    }

    grid.push(rowData);
  }

  try {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(grid, null, 2));
    console.log(`💾 Grid saved to ${OUTPUT_PATH}`);
  } catch (err: any) {
    console.error("❌ Failed to write file:", err.message || err);
  }
}

// Run it
fetchGrid().catch(err => {
  console.error("🚨 Unhandled error in fetchGrid:", err.message || err);
  process.exit(1);
});
