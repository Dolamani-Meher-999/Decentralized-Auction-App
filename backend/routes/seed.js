const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const { ethers } = require("ethers");

// Contract details
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update this
const CONTRACT_ABI = [
  "function createAuction(string memory _name, string memory _description, uint _durationInMinutes) public",
  "event AuctionCreated(uint indexed itemId, address indexed seller, string name, uint endTime)"
];

// Arrays for random data
const itemNames = [
  "iPhone 15 Pro Max", "MacBook Pro M3", "Sony PlayStation 5",
  "Nike Air Jordan 1", "Rolex Submariner", "Canon EOS R5",
  "Bose QuietComfort", "Samsung Galaxy S24", "iPad Pro 12.9",
  "Tesla Model S", "Leica M11", "Dyson V15 Vacuum"
];

const descriptions = [
  "Brand new, sealed box, with warranty",
  "Like new condition, used only twice",
  "Excellent condition, includes all accessories",
  "Limited edition, rare collectible",
  "Professional grade, perfect for creators"
];

// Seed route
router.get("/", async (req, res) => {
  try {
    // Connect to Hardhat provider
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = provider.getSigner(0); // Use first Hardhat account
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // Clear existing items
    await Item.deleteMany({});
    
    const items = [];
    
    // Create items in contract first
    for (let i = 1; i <= 12; i++) {
      const name = itemNames[(i - 1) % itemNames.length];
      const description = descriptions[(i - 1) % descriptions.length];
      
      // Create in contract
      console.log(`Creating item ${i} in contract...`);
      const tx = await contract.createAuction(name, description, 60);
      const receipt = await tx.wait();
      
      // Get the itemId from the event
      const event = receipt.events?.find(e => e.event === 'AuctionCreated');
      const itemId = event?.args?.itemId.toNumber();
      
      // Random price between 0.5 and 8 ETH
      const basePrice = (Math.random() * 7.5 + 0.5).toFixed(2);
      
      // Save to database
      items.push({
        name: name,
        description: description,
        owner: await signer.getAddress(),
        basePrice: parseFloat(basePrice),
        image: `https://picsum.photos/400/300?random=${i}`,
        itemId: itemId || i,
        status: 'active'
      });
      
      console.log(`✅ Item ${i} created with ID ${itemId}`);
    }

    // Insert all items to database
    const createdItems = await Item.insertMany(items);
    
    res.json({
      success: true,
      message: "Database seeded successfully with contract items",
      count: createdItems.length,
      items: createdItems
    });

  } catch (err) {
    console.error("❌ Seed error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});


// Clear all items - ADD THIS ROUTE
router.delete("/clear", async (req, res) => {
  try {
    const result = await Item.deleteMany({});
    console.log(`🗑️ Cleared ${result.deletedCount} items from database`);
    res.json({
      success: true,
      message: "All items cleared successfully",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("❌ Error clearing items:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

module.exports = router;