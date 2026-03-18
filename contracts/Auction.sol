// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Auction {
    struct AuctionItem {
        uint highestBid;
        address highestBidder;
        address seller;
        string name;
        string description;
        uint endTime;
        bool exists;
    }

    mapping(uint => AuctionItem) public items;
    mapping(uint => mapping(address => uint)) public pendingReturns;
    
    uint public nextItemId = 1;
    
    // Events with indexed parameters for filtering
    event BidPlaced(uint indexed itemId, address indexed bidder, uint amount);
    event AuctionCreated(uint indexed itemId, address indexed seller, string name, uint endTime);
    event AuctionEnded(uint indexed itemId, address indexed winner, uint amount);

    function createAuction(
        string memory _name,
        string memory _description,
        uint _durationInMinutes
    ) public {
        require(bytes(_name).length > 0, "Name required");
        require(_durationInMinutes > 0, "Duration must be > 0");
        
        uint itemId = nextItemId++;
        uint endTime = block.timestamp + (_durationInMinutes * 1 minutes);
        
        items[itemId] = AuctionItem({
            highestBid: 0,
            highestBidder: address(0),
            seller: msg.sender,
            name: _name,
            description: _description,
            endTime: endTime,
            exists: true
        });
        
        emit AuctionCreated(itemId, msg.sender, _name, endTime);
    }

    function bid(uint itemId) public payable {
        require(items[itemId].exists, "Item does not exist");
        require(block.timestamp < items[itemId].endTime, "Auction ended");
        
        AuctionItem storage item = items[itemId];
        require(msg.value > item.highestBid, "Bid too low");

        if (item.highestBid != 0) {
            pendingReturns[itemId][item.highestBidder] += item.highestBid;
        }

        item.highestBid = msg.value;
        item.highestBidder = msg.sender;

        emit BidPlaced(itemId, msg.sender, msg.value);
    }

    function withdraw(uint itemId) public {
        uint amount = pendingReturns[itemId][msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingReturns[itemId][msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    function endAuction(uint itemId) public {
        require(items[itemId].exists, "Item does not exist");
        require(block.timestamp >= items[itemId].endTime, "Auction not ended");
        
        AuctionItem storage item = items[itemId];
        require(item.seller == msg.sender || item.highestBidder != address(0), "Only seller can end with no bids");
        
        if (item.highestBidder != address(0)) {
            payable(item.seller).transfer(item.highestBid);
            emit AuctionEnded(itemId, item.highestBidder, item.highestBid);
        }
        
        // Mark as ended by setting endTime to 0
        item.endTime = 0;
    }

    function getHighestBid(uint itemId) public view returns (uint) {
        require(items[itemId].exists, "Item does not exist");
        return items[itemId].highestBid;
    }

    function getHighestBidder(uint itemId) public view returns (address) {
        require(items[itemId].exists, "Item does not exist");
        return items[itemId].highestBidder;
    }

    function getItemDetails(uint itemId) public view returns (
        string memory name,
        string memory description,
        address seller,
        uint highestBid,
        address highestBidder,
        uint endTime,
        bool isActive
    ) {
        require(items[itemId].exists, "Item does not exist");
        AuctionItem storage item = items[itemId];
        return (
            item.name,
            item.description,
            item.seller,
            item.highestBid,
            item.highestBidder,
            item.endTime,
            block.timestamp < item.endTime
        );
    }
}