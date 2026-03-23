const express = require("express");
const router = express.Router();
const Item = require("../models/Item");

//
// GET ACTIVE ITEMS
//
router.get("/", async (req, res) => {
  try {
    const items = await Item.find({
      status: "active"
    });

    res.json(items);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

//
// GET PAST AUCTIONS
//
router.get("/past", async (req, res) => {
  try {
    const items = await Item.find({
      status: "ended"
    });

    res.json(items);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

//
// CREATE ITEM
//
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      owner,
      basePrice,
      image,
      itemId
    } = req.body;

    const existingItem =
      await Item.findOne({ itemId });

    if (existingItem) {
      return res.status(400).json({
        error: "Item already exists"
      });
    }

    const newItem = new Item({
      name,
      description,
      owner,
      basePrice,
      image,
      itemId,
      status: "active"
    });

    const savedItem =
      await newItem.save();

    res.status(201).json(savedItem);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

//
// END AUCTION + STORE WINNER
//
router.put("/:id/end", async (req, res) => {
  try {
    const { winner, finalBid } = req.body;

    const item =
      await Item.findOneAndUpdate(
        { itemId: req.params.id },
        {
          status: "ended",
          winner,
          finalBid
        },
        { new: true }
      );

    res.json(item);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;