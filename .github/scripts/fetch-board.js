const fs = require("fs");
const { ethers } = require("ethers");

const ROWS = 8;
const COLS = 8;

const CONTRACT_ADDRESS = "0x55dA504AF3500e5449ee833D1Ed9999b9D8B938B";
const ABI = [
  "function getCell(uint row, uint col) view returns (string content, uint value, address lastUpdater, uint lockedUntil)"
];

const RPC_URL = "https://polygon-rpc.com"; // Use public Polygon RPC or Alchemy/Infura

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  const grid = [];

  for (let row = 0; row < ROWS; row++) {
    const rowData = [];
    for (let col = 0; col < COLS; col++) {
      const [content, value, lastUpdater, lockedUntil] = await contract.getCell(row, col);
      rowData.push({
        content,
        value: value.toString(), // Must be string for JSON
        lastUpdater,
        lockedUntil: Number(lockedUntil),
      });
    }
    grid.push(rowData);
  }

  fs.writeFileSync("grid.json", JSON.stringify(grid, null, 2));
  console.log("Grid saved to grid.json");
}

main().catch((err) => {
  console.error("Error fetching grid:", err);
  process.exit(1);
});
