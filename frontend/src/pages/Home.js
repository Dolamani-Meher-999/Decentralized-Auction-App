import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ItemCard from "../components/ItemCard";
import CreateAuction from "../components/CreateAuction";
import "./Home.css";

// Update this with your new contract address after deployment
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const ABI = [
  // Read functions
  "function getHighestBid(uint itemId) view returns (uint)",
  "function getHighestBidder(uint itemId) view returns (address)",
  "function getItemDetails(uint itemId) view returns (string name, string description, address seller, uint highestBid, address highestBidder, uint endTime, bool isActive)",
  
  // Write functions
  "function bid(uint itemId) payable",
  "function withdraw(uint itemId)",
  "function createAuction(string _name, string _description, uint _durationInMinutes) public",
  "function endAuction(uint itemId) public",
  
  // Events with indexed parameters
  "event AuctionCreated(uint indexed itemId, address indexed seller, string name, uint endTime)",
  "event BidPlaced(uint indexed itemId, address indexed bidder, uint amount)"
];

const Home = () => {
  const [items, setItems] = useState([]);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/items");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const connectWallet = async () => {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      setProvider(provider);
      setAccount(address);
      
      // Create contract instance with signer
      const cont = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setContract(cont);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          // Update contract with new signer
          const newSigner = provider.getSigner();
          const newCont = new ethers.Contract(CONTRACT_ADDRESS, ABI, newSigner);
          setContract(newCont);
        } else {
          setAccount("");
          setContract(null);
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const handleAuctionCreated = () => {
    fetchItems(); // Refresh items list
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(38)}`;
  };

  return (
    <div className="home">
      <div className="navbar">
        <div className="logo">
          <h1>🎨 Auction DApp</h1>
        </div>
        <div className="nav-actions">
          {account && (
            <span className="wallet-info">
              {formatAddress(account)}
            </span>
          )}
          <button 
            className="create-btn"
            onClick={() => setShowCreateModal(true)}
            disabled={!contract}
          >
            + Create Auction
          </button>
          <button 
            className="connect-btn"
            onClick={connectWallet}
          >
            {account ? "Connected" : "Connect Wallet"}
          </button>
        </div>
      </div>

      <div className="content">
        <div className="header">
          <h2>Live Auctions</h2>
          <p>Discover unique items and place your bids</p>
        </div>

        {loading ? (
          <div className="loading">Loading auctions...</div>
        ) : items.length === 0 ? (
          <div className="no-items">
            <p>No active auctions</p>
            <button onClick={() => setShowCreateModal(true)}>
              Create the first auction
            </button>
          </div>
        ) : (
          <div className="grid">
            {items.map((item) => (
              <ItemCard key={item._id || item.itemId} item={item} contract={contract} />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateAuction
          contract={contract}
          onClose={() => setShowCreateModal(false)}
          onAuctionCreated={handleAuctionCreated}
        />
      )}
    </div>
  );
};

export default Home;