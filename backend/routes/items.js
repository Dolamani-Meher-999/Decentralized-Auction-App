const express = require("express");
const router = express.Router();  // This creates a router function
const Item = require("../models/Item");

// GET all items
router.get("/", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single item
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findOne({ itemId: req.params.id });
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create item
router.post("/", async (req, res) => {
  try {
    const { name, description, owner, basePrice, image, itemId } = req.body;

    // Validation
    if (!name || !owner || !image || itemId === undefined) {
      return res.status(400).json({ 
        error: "Missing required fields: name, owner, image, itemId" 
      });
    }

    // Check if item exists
    const existingItem = await Item.findOne({ itemId });
    if (existingItem) {
      return res.status(400).json({ error: "Item with this ID already exists" });
    }

    // Create new item
    const newItem = new Item({
      name,
      description: description || "",
      owner,
      basePrice: basePrice || 0,
      image,
      itemId,
      status: 'active'
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    console.error("Error creating item:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE item
router.delete("/:id", async (req, res) => {
  try {
    const deletedItem = await Item.findOneAndDelete({ itemId: req.params.id });
    if (!deletedItem) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "Item deleted successfully", item: deletedItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// THIS IS CRITICAL - Make sure this line is at the end!
module.exports = router;