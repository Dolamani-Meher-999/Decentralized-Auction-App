import React, { useState } from 'react';
import './CreateAuction.css';

const CreateAuction = ({ contract, onClose, onAuctionCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    duration: '60'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setMessage({ text: 'Image too large. Please use image under 1MB', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contract) {
      setMessage({ text: 'Please connect your wallet first', type: 'error' });
      return;
    }

    if (!formData.name || !formData.description) {
      setMessage({ text: 'Please fill in name and description', type: 'error' });
      return;
    }

    if (!formData.duration || parseInt(formData.duration) < 1) {
      setMessage({ text: 'Duration must be at least 1 minute', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: 'Creating auction on blockchain...', type: 'info' });

      // Create auction directly on blockchain — no backend
      const tx = await contract.createAuction(
        formData.name,
        formData.description,
        parseInt(formData.duration)
      );

      setMessage({ text: 'Transaction submitted. Waiting for confirmation...', type: 'info' });
      const receipt = await tx.wait();

      // Get itemId from AuctionCreated event
      const event = receipt.events?.find(e => e.event === 'AuctionCreated');
      const itemId = event?.args?.itemId?.toNumber();
      console.log('✅ Auction created on-chain. Item ID:', itemId);

      setMessage({ text: '✅ Auction created successfully!', type: 'success' });

      if (onAuctionCreated) onAuctionCreated();

      setTimeout(() => onClose(), 1500);

    } catch (error) {
      console.error('Create auction error:', error);

      let errorMessage = 'Failed to create auction';
      if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected';
      } else if (error.message?.includes('network') || error.message?.includes('CALL_EXCEPTION')) {
        errorMessage = 'Network error — make sure Hardhat node is running';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message.substring(0, 80);
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
        <p className="modal-subtitle">List your item on the blockchain</p>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
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
            <label>Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={loading}
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
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Auction'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateAuction;