const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Your deployed address
  const Auction = await hre.ethers.getContractFactory("Auction");
  const auction = Auction.attach(contractAddress);

  // Get signer (first account from Hardhat)
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Create 12 items in the contract
  for (let i = 1; i <= 12; i++) {
    try {
      const tx = await auction.createAuction(
        `Item ${i}`,
        `Description for item ${i}`,
        60 // 60 minutes duration
      );
      await tx.wait();
      console.log(`✅ Created item ${i} in contract`);
    } catch (error) {
      console.error(`❌ Failed to create item ${i}:`, error.message);
    }
  }

  console.log("Done! All items created in contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });