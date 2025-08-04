// .github/scripts/fetch-grid.js
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const ROWS = 8;
const COLS = 8;
const CONTRACT_ADDRESS = "0x55dA504AF3500e5449ee833D1Ed9999b9D8B938B";
const ABI = [
  "function getCell(uint row, uint col) view returns (string content, uint value, address lastUpdater, uint lockedUntil)",
];

const RPC_URL = process.env.RPC_URL || "https://polygon-rpc.com";

const main = async () => {
  const startTime = Date.now();
  console.log("Starting grid fetch from blockchain...");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  console.time("Total fetch time");

  const calls = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      calls.push(contract.getCell(row, col));
    }
  }

  console.log(`Sending ${calls.length} cell calls in parallel...`);
  const results = await Promise.all(calls);

  console.log("All cells fetched. Transforming into grid...");

  const grid = Array.from({ length: ROWS }, () => Array(COLS));
  results.forEach((cell, i) => {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const [content, value, lastUpdater, lockedUntil] = cell;
    grid[row][col] = {
      content,
      value: BigInt(value).toString(),
      lastUpdater,
      lockedUntil: Number(lockedUntil),
    };
  });

  const outputPath = path.resolve("grid.json");
  fs.writeFileSync(outputPath, JSON.stringify(grid, null, 2));

  console.timeEnd("Total fetch time");
  console.log(`Saved to ${outputPath}`);
  console.log(`Finished in ${(Date.now() - startTime) / 1000}s`);
};

main().catch((err) => {
  console.error("Failed to fetch grid data:", err);
  process.exit(1);
});
