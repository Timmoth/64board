import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Grid size
const ROWS = 8;
const COLS = 8;

// Smart contract setup
const CONTRACT_ADDRESS = "0x55dA504AF3500e5449ee833D1Ed9999b9D8B938B";
const ABI = [
  "function getCell(uint row, uint col) view returns (string content, uint value, address lastUpdater, uint lockedUntil)",
];

// RPC endpoint
const RPC_URL = process.env.RPC_URL || "https://polygon-rpc.com";

// Delay between requests to avoid rate limiting
const DELAY_MS = 200;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchGrid() {
  console.log("Starting grid fetch from blockchain");
  console.log(`Connecting to provider: ${RPC_URL}`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  const grid = [];

  for (let row = 0; row < ROWS; row++) {
    const rowData = [];

    for (let col = 0; col < COLS; col++) {
      try {
        console.log(`Fetching cell at row ${row}, column ${col}...`);
        const [content, value, lastUpdater, lockedUntil] = await contract.getCell(row, col);
        rowData.push({
          content,
          value: BigInt(value).toString(),
          lastUpdater,
          lockedUntil: Number(lockedUntil),
        });
        console.log(`Successfully fetched cell (${row}, ${col})`);
      } catch (err) {
        console.error(`Error fetching cell (${row}, ${col}):`, err.reason || err.message || err);
        rowData.push(null); // fallback to null for failed cells
      }

      await delay(DELAY_MS);
    }

    grid.push(rowData);
  }

  const outputPath = path.resolve("grid.json");

  try {
    fs.writeFileSync(outputPath, JSON.stringify(grid, null, 2));
    console.log(`Grid data saved to ${outputPath}`);
  } catch (err) {
    console.error("Failed to write grid data to file:", err.message || err);
  }
}

fetchGrid().catch(err => {
  console.error("Unhandled error in fetchGrid:", err.message || err);
  process.exit(1);
});
