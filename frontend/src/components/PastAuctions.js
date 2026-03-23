import React from "react";
import { ethers } from "ethers";
import "./PastAuctions.css";

const PastAuctions = ({ items }) => {

  const formatAddress = (addr) => {
    if (!addr || addr === "0x0000000000000000000000000000000000000000")
      return "No bids";
    return `${addr.substring(0, 6)}...${addr.substring(38)}`;
  };

  const formatBid = (bid) => {
    if (!bid || bid.toString() === "0") return "0";
    try {
      return parseFloat(ethers.utils.formatEther(bid)).toFixed(4);
    } catch {
      return "0";
    }
  };

  return (
    <div className="past-section">
      <h2>Past Auctions</h2>
      <div className="header-line"></div>

      {!items || items.length === 0 ? (
        <div className="past-empty">
          <p>No past auctions yet. Ended auctions will appear here.</p>
        </div>
      ) : (
        <table className="past-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Seller</th>
              <th>Winner</th>
              <th>Final Bid</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.itemId}>
                <td>{item.itemId}</td>
                <td>{item.name}</td>
                <td>{formatAddress(item.owner)}</td>
                <td>
                  {item.highestBidder &&
                  item.highestBidder !== "0x0000000000000000000000000000000000000000"
                    ? formatAddress(item.highestBidder)
                    : "No bids"}
                </td>
                <td>{formatBid(item.highestBid)} ETH</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PastAuctions;