import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import "./ItemCard.css";

const ItemCard = ({ item, contract, index, onAuctionEnded }) => {
  const [bidAmount, setBidAmount] = useState("");
  const [highestBid, setHighestBid] = useState(item.highestBid || null);
  const [highestBidder, setHighestBidder] = useState("");
  const [loading, setLoading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const cardRef = useRef(null);

  // Fetch bid data from contract
  useEffect(() => {
    if (contract && item.itemId !== undefined) {
      fetchBidData();

      const filter = contract.filters.BidPlaced(item.itemId, null, null);
      const handleBidPlaced = () => {
        fetchBidData();
        setMessage({ text: "🎉 New bid received!", type: "success" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      };

      contract.on(filter, handleBidPlaced);
      return () => contract.off(filter, handleBidPlaced);
    }
  }, [contract, item.itemId]);

  // Real countdown timer from contract endTime
  useEffect(() => {
    if (!item.endTime) return;

    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const distance = item.endTime - now;

      if (distance <= 0) {
        setTimeLeft("Ended");
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(distance / 3600);
      const minutes = Math.floor((distance % 3600) / 60);
      const seconds = distance % 60;

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    tick(); // run immediately
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [item.endTime]);

  const fetchBidData = async () => {
    try {
      if (!contract) return;
      const [bid, bidder] = await Promise.all([
        contract.getHighestBid(item.itemId),
        contract.getHighestBidder(item.itemId),
      ]);
      setHighestBid(bid);
      const zero = "0x0000000000000000000000000000000000000000";
      setHighestBidder(
        !bidder || bidder === zero
          ? "No bids"
          : `${bidder.substring(0, 6)}...${bidder.substring(38)}`
      );
    } catch (error) {
      console.error("Error fetching bid data:", error);
    }
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current || !isHovered) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const handleBid = async () => {
    if (!contract) {
      setMessage({ text: "👛 Please connect wallet first", type: "error" });
      return;
    }
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setMessage({ text: "⚠️ Enter valid bid amount", type: "error" });
      return;
    }
    try {
      setLoading(true);
      const bidInWei = ethers.utils.parseEther(bidAmount);

      if (highestBid && bidInWei.lte(highestBid)) {
        setMessage({
          text: `📈 Bid must exceed ${ethers.utils.formatEther(highestBid)} ETH`,
          type: "error",
        });
        setLoading(false);
        return;
      }

      const tx = await contract.bid(item.itemId, { value: bidInWei });
      setMessage({ text: "⏳ Processing transaction...", type: "info" });
      await tx.wait();
      setMessage({ text: "✅ Bid placed successfully!", type: "success" });
      setBidAmount("");
      await fetchBidData();
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Bid error:", error);
      let errorMessage = "Bid failed";
      if (error.message?.includes("user rejected")) errorMessage = "❌ Transaction rejected";
      else if (error.message?.includes("insufficient funds")) errorMessage = "💰 Insufficient funds";
      else if (error.message?.includes("Bid too low")) errorMessage = "📉 Bid too low";
      else if (error.reason) errorMessage = error.reason;
      setMessage({ text: errorMessage, type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Called when seller clicks "End Auction" after timer expires
  const endAuction = async () => {
    if (!contract) {
      setMessage({ text: "👛 Connect wallet to end auction", type: "error" });
      return;
    }
    try {
      setEnding(true);
      setMessage({ text: "⏳ Ending auction...", type: "info" });
      const tx = await contract.endAuction(item.itemId);
      await tx.wait();
      setMessage({ text: "✅ Auction ended!", type: "success" });
      setTimeout(() => {
        if (onAuctionEnded) onAuctionEnded();
      }, 1500);
    } catch (err) {
      console.error("End auction error:", err);
      let msg = "Failed to end auction";
      if (err.message?.includes("Auction not ended")) msg = "⏳ Timer not finished yet";
      else if (err.message?.includes("user rejected")) msg = "❌ Rejected";
      setMessage({ text: msg, type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } finally {
      setEnding(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "0";
    try {
      return parseFloat(ethers.utils.formatEther(price)).toFixed(4);
    } catch {
      return "0";
    }
  };

  const formatAddress = (addr) => {
    if (!addr || addr === "No bids") return "No bids";
    return `${addr.substring(0, 6)}...${addr.substring(38)}`;
  };

  return (
    <div
      className="card-3d-container"
      style={{ animationDelay: `${(index || 0) * 0.1}s` }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0.5, y: 0.5 });
      }}
      ref={cardRef}
    >
      <div className="card-3d">

        {/* Shine effect */}
        <div
          className="card-shine"
          style={{
            opacity: isHovered ? 0.2 : 0,
            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(255,255,255,0.4), transparent 70%)`,
          }}
        />

        {/* Image */}
        <div className="card-image-container">
          <img
            src={item.image || `https://picsum.photos/400/300?random=${item.itemId}`}
            alt={item.name}
            loading="lazy"
          />
          <div className="card-badge" style={{ background: isExpired ? "#e74c3c" : "" }}>
            ⏰ {timeLeft || "Loading..."}
          </div>
          <div className="card-type-badge">{item.category || "Auction"}</div>
        </div>

        {/* Content */}
        <div className="card-content">
          <h3 className="card-title">{item.name}</h3>
          {item.description && (
            <p className="card-description">{item.description}</p>
          )}

          {/* Seller */}
          <div className="card-owner">
            <div className="owner-avatar">
              {item.owner ? item.owner.substring(2, 4).toUpperCase() : "??"}
            </div>
            <div className="owner-details">
              <span className="owner-label">Seller</span>
              <span className="owner-address">
                {item.owner ? formatAddress(item.owner) : "Unknown"}
              </span>
            </div>
          </div>

          {/* Price Stats */}
          <div className="card-stats">
            <div className="stat">
              <span className="stat-label">Base Price</span>
              <span className="stat-value">{item.basePrice || 0} ETH</span>
            </div>
            <div className="stat">
              <span className="stat-label">Current Bid</span>
              <span className="stat-value highlight">
                {highestBid ? formatPrice(highestBid) : "0"} ETH
              </span>
            </div>
          </div>

          {/* Highest Bidder */}
          <div className="bidder-info">
            <span className="bidder-label">🏆 Highest Bidder</span>
            <span className="bidder-address">{highestBidder || "No bids"}</span>
          </div>

          {/* Messages */}
          {message.text && (
            <div className={`message-3d ${message.type}`}>{message.text}</div>
          )}

          {/* Bid Controls — hidden when expired */}
          {!isExpired ? (
            <div className="bid-controls-3d">
              <input
                type="number"
                step="0.001"
                min="0.001"
                placeholder="Amount in ETH"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                disabled={loading}
                className="bid-input-3d"
              />
              <button
                onClick={handleBid}
                disabled={loading || !contract}
                className="bid-button-3d"
              >
                <span className="button-content">
                  {loading ? "..." : "Place Bid"}
                </span>
                <div className="button-glow"></div>
              </button>
            </div>
          ) : (
            /* End Auction button shown when timer hits 0 */
            <div className="bid-controls-3d">
              <button
                onClick={endAuction}
                disabled={ending || !contract}
                className="bid-button-3d"
                style={{ width: "100%", background: "linear-gradient(135deg, #e74c3c, #c0392b)" }}
              >
                <span className="button-content">
                  {ending ? "Ending..." : "End Auction"}
                </span>
                <div className="button-glow"></div>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ItemCard;