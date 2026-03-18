const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Auction Contract", function () {
  let auction, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Auction = await ethers.getContractFactory("Auction");
    auction = await Auction.deploy();
    await auction.deployed();
  });

  it("Should accept bids and update highestBidder", async function () {
    await auction.connect(addr1).bid({ value: ethers.utils.parseEther("1") });
    expect(await auction.highestBid()).to.equal(ethers.utils.parseEther("1"));
    expect(await auction.highestBidder()).to.equal(addr1.address);
  });
});