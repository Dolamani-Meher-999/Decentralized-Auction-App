import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ItemCard from "../components/ItemCard";
import CreateAuction from "../components/CreateAuction";
import "./Home.css";

const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const ABI = [
  "function getHighestBid(uint itemId) view returns (uint)",
  "function getHighestBidder(uint itemId) view returns (address)",
  "function bid(uint itemId) payable",
  "function withdraw(uint itemId)",
  "function createAuction(string _name, string _description, uint _durationInMinutes) public",
  "event AuctionCreated(uint indexed itemId, address indexed seller, string name, uint endTime)",
  "event BidPlaced(uint indexed itemId, address indexed bidder, uint amount)",
];

const Home = () => {
  const [items, setItems] = useState([]);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      setAccount(address);
      const cont = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setContract(cont);

      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const newSigner = provider.getSigner();
          const newCont = new ethers.Contract(CONTRACT_ADDRESS, ABI, newSigner);
          setContract(newCont);
        } else {
          setAccount("");
          setContract(null);
        }
      });
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  return (
    <div className="home-3d">
      {/* Galaxy Background */}
      {/* Deep Black Universe Background */}
      <div className="universe-bg">
        {/* Very subtle nebulae */}
        <div className="subtle-nebula nebula-1"></div>
        <div className="subtle-nebula nebula-2"></div>

        {/* 3D Star Layers */}
        <div className="stars-distant"></div>
        <div className="stars-medium"></div>
        <div className="stars-bright"></div>

        {/* Parallax Layers for depth */}
        <div className="parallax-layer layer-1"></div>
        <div className="parallax-layer layer-2"></div>

        {/* Falling Stars with 3D effect */}
        <div className="falling-star falling-star-1"></div>
        <div className="falling-star falling-star-2"></div>
        <div className="falling-star falling-star-3"></div>
        <div className="falling-star falling-star-4"></div>
        <div className="falling-star falling-star-5"></div>
        <div className="falling-star falling-star-6"></div>
        <div className="falling-star falling-star-7"></div>
        <div className="falling-star falling-star-8"></div>
      </div>

      {/* Navbar */}
      <nav className="navbar-3d glass">
        <div className="logo-container">
          <div className="logo-3d">
            <span className="logo-text">🎨</span>
            <span className="logo-text-gradient">Auction</span>
            <span className="logo-text">DApp</span>
          </div>
        </div>

        <div className="nav-actions">
          {account && (
            <div className="wallet-info-3d glass">
              <div className="wallet-dot"></div>
              <span>{`${account.substring(0, 6)}...${account.substring(38)}`}</span>
            </div>
          )}

          <button
            className="btn-3d btn-primary"
            onClick={() => setShowCreateModal(true)}
            disabled={!contract}
          >
            <span className="btn-content">
              <span className="btn-icon">+</span>
              Create Auction
            </span>
            <div className="btn-glow"></div>
          </button>

          <button className="btn-3d btn-secondary" onClick={connectWallet}>
            <span className="btn-content">
              {account ? "Connected" : "Connect Wallet"}
            </span>
            <div className="btn-glow"></div>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">
          <span className="title-line">Discover Unique</span>
          <span className="title-gradient">Digital Auctions</span>
        </h1>
        <p className="hero-subtitle">
          Bid on exclusive items in real-time with blockchain technology
        </p>

        <div className="stats-container">
          <div className="stat-card glass-card">
            <div className="stat-value">{items.length}</div>
            <div className="stat-label">ACTIVE AUCTIONS</div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-value">93</div>
            <div className="stat-label">TOTAL BIDDERS</div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-value">415</div>
            <div className="stat-label">ETH VOLUME</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-3d">
        <div className="section-header">
          <h2>Live Auctions</h2>
          <div className="header-line"></div>
        </div>

        {loading ? (
          <div className="loading-3d">
            <div className="loader"></div>
            <p>Loading amazing auctions...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state glass-card">
            <div className="empty-icon">🎨</div>
            <h3>No Active Auctions</h3>
            <p>Be the first to create an amazing auction!</p>
            <button
              className="btn-3d btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create First Auction
            </button>
          </div>
        ) : (
          <div className="grid-3d">
            {items.map((item, index) => (
              <ItemCard
                key={item._id || item.itemId}
                item={item}
                contract={contract}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Auction Modal */}
      {showCreateModal && (
        <CreateAuction
          contract={contract}
          onClose={() => setShowCreateModal(false)}
          onAuctionCreated={fetchItems}
        />
      )}
    </div>
  );
};

export default Home;
