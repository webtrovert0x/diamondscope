const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("--------------------------------------------------");
  console.log("Deploying DiamondScope to Botchain Testnet (Chain ID 968)...");
  console.log("RPC:", hre.network.config.url);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer BOT balance:", hre.ethers.formatEther(balance), "BOT");

  if (balance === 0n) {
    console.warn("⚠️ Warning: Deployer balance is 0 BOT. Transaction may fail if not funded.");
  }

  const DiamondScope = await hre.ethers.getContractFactory("DiamondScope");
  const diamondScope = await DiamondScope.deploy();
  await diamondScope.waitForDeployment();

  const contractAddress = await diamondScope.getAddress();
  console.log("✅ DiamondScope deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Explorer Link:", `https://scan.bohr.life/address/${contractAddress}`);
  console.log("--------------------------------------------------");

  // Update .env file
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    if (envContent.includes("DIAMONDSCOPE_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /DIAMONDSCOPE_CONTRACT_ADDRESS=.*/,
        `DIAMONDSCOPE_CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nDIAMONDSCOPE_CONTRACT_ADDRESS=${contractAddress}\n`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log("Updated .env with DIAMONDSCOPE_CONTRACT_ADDRESS");
  }

  // Also save deployment info to a JSON file for the frontend
  const deploymentDir = path.join(__dirname, "..", "src", "contracts");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  const deploymentInfo = {
    address: contractAddress,
    network: "botchain",
    chainId: 968,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };
  fs.writeFileSync(
    path.join(deploymentDir, "diamondScopeAddress.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

