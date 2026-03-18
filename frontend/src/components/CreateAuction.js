import React, { useState } from 'react';
import { ethers } from 'ethers';
import './CreateAuction.css';

const CreateAuction = ({ contract, onClose, onAuctionCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    duration: '60' // Default 60 minutes
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 1MB)
      if (file.size > 1024 * 1024) {
        setMessage({ text: "Image too large. Please use image under 1MB", type: "error" });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveToBackend = async (itemId, ownerAddress) => {
    try {
      // Prepare data exactly like the working curl command
      const itemData = {
        name: formData.name,
        description: formData.description,
        owner: ownerAddress,
        basePrice: 0, // Starting bid (0 ETH)
        image: formData.image,
        itemId: itemId
      };

      console.log("📤 Sending to backend:", itemData);

      const response = await fetch('http://localhost:5000/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("❌ Backend error response:", data);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      console.log("✅ Backend success:", data);
      return data;
    } catch (error) {
      console.error('❌ Backend save error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!contract) {
      setMessage({ text: 'Please connect wallet first', type: 'error' });
      return;
    }

    if (!formData.name || !formData.description || !formData.image) {
      setMessage({ text: 'Please fill all fields', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: 'Creating auction on blockchain...', type: 'info' });

      // Get the connected wallet address
      const ownerAddress = await contract.signer.getAddress();
      console.log("👤 Creator address:", ownerAddress);

      // Create auction on blockchain
      const tx = await contract.createAuction(
        formData.name,
        formData.description,
        parseInt(formData.duration)
      );
      
      setMessage({ text: 'Transaction submitted. Waiting for confirmation...', type: 'info' });
      
      const receipt = await tx.wait();
      console.log("📦 Transaction receipt:", receipt);
      
      // Find the AuctionCreated event to get the itemId
      const event = receipt.events?.find(e => e.event === 'AuctionCreated');
      if (!event) {
        throw new Error('Could not find AuctionCreated event in transaction');
      }
      
      const itemId = event.args?.itemId.toNumber();
      console.log("🆔 Item created with ID:", itemId);

      // Save to backend
      setMessage({ text: 'Saving to database...', type: 'info' });
      await saveToBackend(itemId, ownerAddress);

      setMessage({ text: '✅ Auction created successfully!', type: 'success' });
      
      // Notify parent component
      if (onAuctionCreated) {
        onAuctionCreated();
      }
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('❌ Create auction error:', error);
      
      let errorMessage = 'Failed to create auction';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Check if Hardhat is running.';
        } else if (error.message.includes('Failed to save')) {
          errorMessage = 'Blockchain success but database save failed. Please check backend.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-auction-overlay" onClick={onClose}>
      <div className="create-auction-modal" onClick={e => e.stopPropagation()}>
        <h2>Create New Auction</h2>
        <p className="modal-subtitle">List your item for auction</p>

        {message.text && (
          <div className={`message ${message.type}`}>
            <strong>{message.type.toUpperCase()}:</strong> {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Item Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Vintage Watch"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your item..."
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={loading}
              required
            />
            {formData.image && (
              <div className="image-preview">
                <img src={formData.image} alt="Preview" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Auction Duration (minutes)</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="1"
              max="10080"
              disabled={loading}
              required
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAuction;