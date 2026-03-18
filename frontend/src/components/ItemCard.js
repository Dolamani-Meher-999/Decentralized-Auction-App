import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import "./ItemCard.css";

const ItemCard = ({ item, contract, index }) => {
  const [bidAmount, setBidAmount] = useState("");
  const [highestBid, setHighestBid] = useState(null);
  const [highestBidder, setHighestBidder] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [timeLeft, setTimeLeft] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const cardRef = useRef(null);

  useEffect(() => {
    if (contract && item.itemId !== undefined) {
      fetchBidData();
      
      // Set up event listener for real-time updates
      const filter = contract.filters.BidPlaced(item.itemId, null, null);
      
      const handleBidPlaced = (...args) => {
        console.log(`🎯 New bid on item ${item.itemId}`);
        fetchBidData();
        setMessage({ 
          text: `🎉 New bid received!`, 
          type: "success" 
        });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      };

      contract.on(filter, handleBidPlaced);
      
      return () => {
        contract.off(filter, handleBidPlaced);
      };
    }
  }, [contract, item.itemId]);

  useEffect(() => {
    // Simulate auction timer (replace with actual contract end time)
    // In production, you'd get this from contract.getItemDetails(item.itemId)
    const endTime = Date.now() + 3600000; // 1 hour from now
    const timer = setInterval(() => {
      const now = Date.now();
      const distance = endTime - now;
      
      if (distance < 0) {
        setTimeLeft("Ended");
        clearInterval(timer);
      } else {
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchBidData = async () => {
    try {
      if (!contract) return;
      
      const [bid, bidder] = await Promise.all([
        contract.getHighestBid(item.itemId),
        contract.getHighestBidder(item.itemId)
      ]);
      
      setHighestBid(bid);
      
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      if (!bidder || bidder === zeroAddress) {
        setHighestBidder("No bids");
      } else {
        setHighestBidder(`${bidder.substring(0, 6)}...${bidder.substring(38)}`);
      }
    } catch (error) {
      console.error("Error fetching bid data:", error);
    }
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current || !isHovered) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  const handleBid = async () => {
    if (!contract) {
      setMessage({ text: '👛 Please connect wallet first', type: 'error' });
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setMessage({ text: '⚠️ Enter valid bid amount', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const bidInWei = ethers.utils.parseEther(bidAmount);
      
      if (highestBid && bidInWei.lte(highestBid)) {
        setMessage({ 
          text: `📈 Bid must be higher than ${ethers.utils.formatEther(highestBid)} ETH`, 
          type: 'error' 
        });
        setLoading(false);
        return;
      }

      const tx = await contract.bid(item.itemId, { value: bidInWei });
      setMessage({ text: '⏳ Processing transaction...', type: 'info' });
      
      await tx.wait();
      setMessage({ text: '✅ Bid placed successfully!', type: 'success' });
      setBidAmount("");
      await fetchBidData();
      
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Bid error:", error);
      
      let errorMessage = 'Bid failed';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        if (error.message.includes('user rejected')) {
          errorMessage = '❌ Transaction rejected';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = '💰 Insufficient funds';
        } else if (error.message.includes('Bid too low')) {
          errorMessage = '📉 Bid too low';
        } else {
          errorMessage = error.message.substring(0, 50);
        }
      }
      
      setMessage({ text: errorMessage, type: 'error' });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "0";
    try {
      return ethers.utils.formatEther(price);
    } catch {
      return "0";
    }
  };

  const formatAddress = (addr) => {
    if (!addr || addr === "No bids") return "No bids";
    return `${addr.substring(0, 4)}...${addr.substring(38)}`;
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
            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(255,255,255,0.4), transparent 70%)`
          }}
        />
        
        {/* Image Section */}
        <div className="card-image-container">
          <img 
            src={item.image || `https://picsum.photos/400/300?random=${item.itemId}`} 
            alt={item.name}
            loading="lazy"
          />
          <div className="card-badge">
            ⏰ {timeLeft || 'Loading...'}
          </div>
          <div className="card-type-badge">
            {item.category || 'Auction'}
          </div>
        </div>
        
        {/* Content Section */}
        <div className="card-content">
          <h3 className="card-title">{item.name}</h3>
          {item.description && (
            <p className="card-description">{item.description}</p>
          )}
          
          {/* Owner Info */}
          <div className="card-owner">
            <div className="owner-avatar">
              {item.owner ? item.owner.substring(2, 4).toUpperCase() : '??'}
            </div>
            <div className="owner-details">
              <span className="owner-label">Seller</span>
              <span className="owner-address">
                {item.owner ? formatAddress(item.owner) : 'Unknown'}
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
                {highestBid ? formatPrice(highestBid) : '0'} ETH
              </span>
            </div>
          </div>
          
          {/* Highest Bidder */}
          <div className="bidder-info">
            <span className="bidder-label">🏆 Highest Bidder</span>
            <span className="bidder-address">{highestBidder}</span>
          </div>
          
          {/* Message Display */}
          {message.text && (
            <div className={`message-3d ${message.type}`}>
              {message.text}
            </div>
          )}
          
          {/* Bid Controls */}
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
                {loading ? '...' : 'Place Bid'}
              </span>
              <div className="button-glow"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;