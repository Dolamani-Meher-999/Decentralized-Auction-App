const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  description: {
    type: String,
    default: ""
  },

  owner: {
    type: String,
    required: true
  },

  basePrice: {
    type: Number,
    required: true,
    default: 0
  },

  image: {
    type: String,
    required: true
  },

  itemId: {
    type: Number,
    required: true,
    unique: true
  },

  status: {
    type: String,
    enum: ['active', 'ended', 'cancelled'],
    default: 'active'
  },

  winner: {
    type: String,
    default: ""
  },

  finalBid: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Item", itemSchema);