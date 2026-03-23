import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ItemCard from "../components/ItemCard";
import CreateAuction from "../components/CreateAuction";
import PastAuctions from "../components/PastAuctions";
import Footer from "../components/Footer";
import "./Home.css";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const ABI = [
  "function getAuctionCount() view returns (uint)",
  "function getItemDetails(uint itemId) view returns (string name, string description, address seller, uint highestBid, address highestBidder, uint endTime, bool isActive)",
  "function getHighestBid(uint itemId) view returns (uint)",
  "function getHighestBidder(uint itemId) view returns (address)",
  "function bid(uint itemId) payable",
  "function withdraw(uint itemId)",
  "function endAuction(uint itemId)",
  "function createAuction(string _name, string _description, uint _durationInMinutes) public",
  "event AuctionCreated(uint indexed itemId, address indexed seller, string name, uint endTime)",
  "event BidPlaced(uint indexed itemId, address indexed bidder, uint amount)",
  "event AuctionEnded(uint indexed itemId, address indexed winner, uint amount)",
];

const Home = () => {
  const [liveItems, setLiveItems] = useState([]);
  const [pastItems, setPastItems] = useState([]);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const getReadContract = () => {
    const prov = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, prov);
  };

  const fetchAllAuctions = async (cont) => {
    try {
      setLoading(true);
      const readCont = cont || getReadContract();
      const count = await readCont.getAuctionCount();
      const total = count.toNumber();

      const live = [];
      const past = [];

      for (let i = 1; i <= total; i++) {
        try {
          const details = await readCont.getItemDetails(i);
          const item = {
            itemId: i,
            name: details.name,
            description: details.description,
            owner: details.seller,
            basePrice: 0,
            highestBid: details.highestBid,
            highestBidder: details.highestBidder,
            endTime: details.endTime.toNumber(),
            isActive: details.isActive,
          };

          if (details.endTime.toNumber() === 0 || !details.isActive) {
            past.push(item);
          } else {
            live.push(item);
          }
        } catch (e) {
          console.error(`Error fetching item ${i}:`, e);
        }
      }

      setLiveItems(live);
      setPastItems(past);
    } catch (error) {
      console.error("Error fetching auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on load using read-only provider (no wallet needed)
  useEffect(() => {
    fetchAllAuctions();
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }
      const prov = new ethers.providers.Web3Provider(window.ethereum);
      await prov.send("eth_requestAccounts", []);
      const signer = prov.getSigner();
      const address = await signer.getAddress();
      setAccount(address);

      const cont = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setContract(cont);
      await fetchAllAuctions(cont);

      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const newSigner = prov.getSigner();
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

  const handleRefresh = () => {
    fetchAllAuctions(contract);
  };

  return (
    <div className="home-3d">

      {/* Background */}
      <div className="universe-bg">
        <div className="subtle-nebula nebula-1"></div>
        <div className="subtle-nebula nebula-2"></div>
        <div className="stars-distant"></div>
        <div className="stars-medium"></div>
        <div className="stars-bright"></div>
        <div className="parallax-layer layer-1"></div>
        <div className="parallax-layer layer-2"></div>
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

      {/* Hero */}
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
            <div className="stat-value">{liveItems.length}</div>
            <div className="stat-label">ACTIVE AUCTIONS</div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-value">{pastItems.length}</div>
            <div className="stat-label">PAST AUCTIONS</div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-value">{liveItems.length + pastItems.length}</div>
            <div className="stat-label">TOTAL AUCTIONS</div>
          </div>
        </div>
      </div>

      {/* Live Auctions */}
      <div className="content-3d">
        <div className="section-header">
          <h2>Live Auctions</h2>
          <div className="header-line"></div>
        </div>

        {loading ? (
          <div className="loading-3d">
            <div className="loader"></div>
            <p>Loading auctions from blockchain...</p>
          </div>
        ) : liveItems.length === 0 ? (
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
            {liveItems.map((item, index) => (
              <ItemCard
                key={item.itemId}
                item={item}
                contract={contract}
                index={index}
                onAuctionEnded={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Auctions — always visible below live auctions */}
      <PastAuctions items={pastItems} />

      {/* Footer — always at bottom */}
      <Footer />

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAuction
          contract={contract}
          onClose={() => setShowCreateModal(false)}
          onAuctionCreated={handleRefresh}
        />
      )}

    </div>
  );
};

export default Home;