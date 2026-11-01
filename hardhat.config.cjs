require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.trim() !== "" 
  ? (process.env.PRIVATE_KEY.startsWith("0x") ? process.env.PRIVATE_KEY : "0x" + process.env.PRIVATE_KEY)
  : "0x0000000000000000000000000000000000000000000000000000000000000001";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    botchain: {
      url: process.env.RPC_URL || "https://rpc.bohr.life",
      chainId: parseInt(process.env.CHAIN_ID || "968"),
      accounts: [PRIVATE_KEY],
    },
  },
};

