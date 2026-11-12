const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const chainId = Number(hre.network.config.chainId || 677);
  const isMainnet = chainId === 677;
  const explorerUrl = isMainnet ? "https://scan.botchain.ai" : "https://scan.bohr.life";
  const networkName = isMainnet ? "Botchain Mainnet (Chain ID 677)" : "Botchain Testnet (Chain ID 968)";

  console.log("--------------------------------------------------");
  console.log(`Deploying Sample EIP-2535 Diamond to ${networkName}...`);
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer BOT balance:", hre.ethers.formatEther(balance), "BOT");

  // 1. Deploy DiamondCutFacet
  console.log("1/5 Deploying DiamondCutFacet...");
  const DiamondCutFacet = await hre.ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.waitForDeployment();
  const diamondCutFacetAddress = await diamondCutFacet.getAddress();
  console.log("   DiamondCutFacet:", diamondCutFacetAddress);

  // 2. Deploy Diamond
  console.log("2/5 Deploying Diamond Core...");
  const Diamond = await hre.ethers.getContractFactory("Diamond");
  const diamond = await Diamond.deploy(deployer.address, diamondCutFacetAddress);
  await diamond.waitForDeployment();
  const diamondAddress = await diamond.getAddress();
  console.log("   Diamond:", diamondAddress);

  // 3. Deploy DiamondLoupeFacet
  console.log("3/5 Deploying DiamondLoupeFacet...");
  const DiamondLoupeFacet = await hre.ethers.getContractFactory("DiamondLoupeFacet");
  const diamondLoupeFacet = await DiamondLoupeFacet.deploy();
  await diamondLoupeFacet.waitForDeployment();
  const diamondLoupeFacetAddress = await diamondLoupeFacet.getAddress();
  console.log("   DiamondLoupeFacet:", diamondLoupeFacetAddress);

  // 4. Deploy OwnershipFacet
  console.log("4/5 Deploying OwnershipFacet...");
  const OwnershipFacet = await hre.ethers.getContractFactory("OwnershipFacet");
  const ownershipFacet = await OwnershipFacet.deploy();
  await ownershipFacet.waitForDeployment();
  const ownershipFacetAddress = await ownershipFacet.getAddress();
  console.log("   OwnershipFacet:", ownershipFacetAddress);

  // 5. Deploy SampleVaultFacet
  console.log("5/5 Deploying SampleVaultFacet...");
  const SampleVaultFacet = await hre.ethers.getContractFactory("SampleVaultFacet");
  const sampleVaultFacet = await SampleVaultFacet.deploy();
  await sampleVaultFacet.waitForDeployment();
  const sampleVaultFacetAddress = await sampleVaultFacet.getAddress();
  console.log("   SampleVaultFacet:", sampleVaultFacetAddress);

  // Cut facets into Diamond
  console.log("Cutting facets into Diamond...");
  const loupeFunctions = [
    diamondLoupeFacet.interface.getFunction("facets()").selector,
    diamondLoupeFacet.interface.getFunction("facetFunctionSelectors(address)").selector,
    diamondLoupeFacet.interface.getFunction("facetAddresses()").selector,
    diamondLoupeFacet.interface.getFunction("facetAddress(bytes4)").selector,
    diamondLoupeFacet.interface.getFunction("supportsInterface(bytes4)").selector,
  ];

  const ownershipFunctions = [
    ownershipFacet.interface.getFunction("transferOwnership(address)").selector,
    ownershipFacet.interface.getFunction("owner()").selector,
  ];

  const vaultFunctions = [
    sampleVaultFacet.interface.getFunction("deposit()").selector,
    sampleVaultFacet.interface.getFunction("withdraw(uint256)").selector,
    sampleVaultFacet.interface.getFunction("getVaultBalance(address)").selector,
    sampleVaultFacet.interface.getFunction("getTotalDeposited()").selector,
    sampleVaultFacet.interface.getFunction("isVaultPaused()").selector,
  ];

  const cuts = [
    {
      facetAddress: diamondLoupeFacetAddress,
      action: 0, // Add
      functionSelectors: loupeFunctions,
    },
    {
      facetAddress: ownershipFacetAddress,
      action: 0, // Add
      functionSelectors: ownershipFunctions,
    },
    {
      facetAddress: sampleVaultFacetAddress,
      action: 0, // Add
      functionSelectors: vaultFunctions,
    },
  ];

  const diamondCut = await hre.ethers.getContractAt("IDiamondCut", diamondAddress);
  const tx = await diamondCut.diamondCut(cuts, hre.ethers.ZeroAddress, "0x");
  await tx.wait();
  console.log("✅ Facets cut into Diamond successfully!");

  console.log("--------------------------------------------------");
  console.log("SAMPLE DIAMOND DEPLOYMENT SUMMARY:");
  console.log("Diamond Address:", diamondAddress);
  console.log("DiamondCutFacet:", diamondCutFacetAddress);
  console.log("DiamondLoupeFacet:", diamondLoupeFacetAddress);
  console.log("OwnershipFacet:", ownershipFacetAddress);
  console.log("SampleVaultFacet:", sampleVaultFacetAddress);
  console.log("Explorer:", `${explorerUrl}/address/${diamondAddress}`);
  console.log("--------------------------------------------------");

  // Save sample diamond address to frontend
  const deploymentDir = path.join(__dirname, "..", "src", "contracts");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  const sampleInfo = {
    diamondAddress,
    facets: {
      DiamondCutFacet: diamondCutFacetAddress,
      DiamondLoupeFacet: diamondLoupeFacetAddress,
      OwnershipFacet: ownershipFacetAddress,
      SampleVaultFacet: sampleVaultFacetAddress,
    },
    network: isMainnet ? "botchain-mainnet" : "botchain-testnet",
    chainId,
    deployedAt: new Date().toISOString(),
    explorerUrl: `${explorerUrl}/address/${diamondAddress}`,
  };
  fs.writeFileSync(
    path.join(deploymentDir, "sampleDiamondAddress.json"),
    JSON.stringify(sampleInfo, null, 2)
  );
}

main().catch((error) => {
  console.error("Deploy sample diamond failed:", error);
  process.exitCode = 1;
});
