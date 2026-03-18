import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./ItemCard.css";

const ItemCard = ({ item, contract }) => {
  const [bidAmount, setBidAmount] = useState("");
  const [highestBid, setHighestBid] = useState(null);
  const [highestBidder, setHighestBidder] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    if (contract && item.itemId !== undefined) {
      fetchBidData();
      
      // Set up event listener for this specific item
      try {
        // Create filter for BidPlaced events for this specific item
        // In ethers v5, we need to pass null for non-indexed parameters
        const filter = contract.filters.BidPlaced(item.itemId, null, null);
        
        const handleBidPlaced = (...args) => {
          const event = args[args.length - 1]; // Last argument is the event object
          const [itemId, bidder, amount] = args;
          
          console.log(`New bid on item ${itemId}: ${ethers.utils.formatEther(amount)} ETH from ${bidder}`);
          fetchBidData(); // Refresh bid data
          setMessage({ 
            text: `New bid of ${ethers.utils.formatEther(amount)} ETH received!`, 
            type: "info" 
          });
          setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        };

        contract.on(filter, handleBidPlaced);

        // Cleanup listener on unmount
        return () => {
          contract.off(filter, handleBidPlaced);
        };
      } catch (error) {
        console.error("Error setting up event listener:", error);
      }
    }
  }, [contract, item.itemId]);

  const fetchBidData = async () => {
    try {
      if (!contract) return;
      
      const [bid, bidder] = await Promise.all([
        contract.getHighestBid(item.itemId),
        contract.getHighestBidder(item.itemId)
      ]);
      
      setHighestBid(bid);
      
      // Check if bidder is zero address (no bids yet)
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      if (!bidder || bidder === zeroAddress) {
        setHighestBidder("No bids");
      } else {
        setHighestBidder(`${bidder.substring(0, 6)}...${bidder.substring(38)}`);
      }
    } catch (error) {
      console.error("Error fetching bid data:", error);
      setHighestBid(ethers.BigNumber.from("0"));
      setHighestBidder("No bids");
    }
  };

  const handleBid = async () => {
    if (!contract) {
      setMessage({ text: "Please connect wallet first", type: "error" });
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setMessage({ text: "Enter valid bid amount", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const bidInWei = ethers.utils.parseEther(bidAmount);
      
      // Check if bid is higher than current highest
      if (highestBid && bidInWei.lte(highestBid)) {
        setMessage({ 
          text: `Bid must be higher than current bid: ${ethers.utils.formatEther(highestBid)} ETH`, 
          type: "error" 
        });
        setLoading(false);
        return;
      }

      const tx = await contract.bid(item.itemId, { value: bidInWei });
      setMessage({ text: "Bid placed! Waiting for confirmation...", type: "info" });
      
      await tx.wait();
      setMessage({ text: "Bid successful!", type: "success" });
      setBidAmount("");
      await fetchBidData(); // Refresh data
      
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Bid error:", error);
      let errorMessage = "Bid failed";
      
      // Parse common error messages
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        if (error.message.includes("Bid too low")) {
          errorMessage = "Bid too low! Must be higher than current bid";
        } else if (error.message.includes("Auction ended")) {
          errorMessage = "Auction has ended";
        } else if (error.message.includes("user rejected")) {
          errorMessage = "Transaction rejected";
        }
      }
      
      setMessage({ text: errorMessage, type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Format price safely
  const formatPrice = (price) => {
    if (!price) return "0";
    try {
      return ethers.utils.formatEther(price);
    } catch (error) {
      console.error("Error formatting price:", error);
      return "0";
    }
  };

  // Format address safely
  const formatAddress = (address) => {
    if (!address || address === "No bids") return "No bids";
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  return (
    <div className="item-card">
      <img src={item.image || "https://via.placeholder.com/300"} alt={item.name} />
      <div className="item-details">
        <h3>{item.name}</h3>
        {item.description && <p className="description">{item.description}</p>}
        <p className="owner">Owner: {formatAddress(item.owner)}</p>
        <p className="base-price">Base Price: {item.basePrice} ETH</p>
        
        <div className="bid-info">
          <p className="current-bid">
            Current Bid: <span>{highestBid ? formatPrice(highestBid) : '0'} ETH</span>
          </p>
          <p className="highest-bidder">
            Highest Bidder: <span>{highestBidder || "No bids"}</span>
          </p>
        </div>
        
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <div className="bid-controls">
          <input
            type="number"
            step="0.001"
            min="0.001"
            placeholder="Bid amount in ETH"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            disabled={loading}
          />
          <button 
            onClick={handleBid} 
            disabled={loading || !contract}
          >
            {loading ? "Processing..." : "Place Bid"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;