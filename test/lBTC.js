const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZBTC Contract", function () {
  let ZBTC;
  let sZBTC;
  let WBTC;
  let owner, addr1, addr2;
  let ownerSigner, addr1Signer, addr2Signer;

  beforeEach(async function () {
    // Get signers
    [ownerSigner, addr1Signer, addr2Signer] = await ethers.getSigners();
    owner = ownerSigner.address;
    addr1 = addr1Signer.address;
    addr2 = addr2Signer.address;

    // Deploy the contract WBTC - base token for mint/burn into ZBTC
    const WBTCContract = await ethers.getContractFactory("WBTC");
    WBTC = await WBTCContract.deploy(owner, "WBTC", "WBTC");

    // Deploy the contract
    const lBTCContract = await ethers.getContractFactory("ZBTC");

    // Deploy via proxy initialization
    ZBTC = await upgrades.deployProxy(lBTCContract, ["ZBTC", "ZBTC", owner], {
      initializer: "initialize",
    });

    const sZBTCContract = await ethers.getContractFactory("SZBTC");
    sZBTC = await sZBTCContract.deploy(owner, ZBTC.address, "sZBTC", "sZBTC");

    // Mint 1 WBTC for the owner
    const mintAmount = ethers.utils.parseUnits("1", 18);
    await WBTC.mint(addr1, mintAmount);


    // Set WBTC as the minting base to ZBTC
    await ZBTC.setWBTCAddress(WBTC.address);

    expect(await WBTC.balanceOf(addr1)).to.equal("1000000000000000000");
    expect(await ZBTC.WBTC()).to.equal(WBTC.address);

    expect(await ZBTC.setSZBTCAddress(sZBTC.address)).to.be.ok;
    expect(await ZBTC.sZBTC()).to.equal(sZBTC.address);
  });

  it('should allow to transfer ownership over ZBTC to a new wallet and back', async function () {
    const newOwner = addr1;
    expect(await ZBTC.owner()).to.equal(owner);
    expect(await ZBTC.transferOwnership(newOwner)).to.be.ok;
    expect(await ZBTC.owner()).to.equal(newOwner);
    expect(await ZBTC.connect(addr1Signer).transferOwnership(owner)).to.be.ok;
    expect(await ZBTC.owner()).to.equal(owner);
  })

  it("Should allow the holder to mint & burn ZBTC", async function () {
    const mintAmount = ethers.utils.parseUnits("0.5", 18);
    expect(await ZBTC.balanceOf(addr1)).to.equal("0");
    expect(await WBTC.balanceOf(addr1)).to.equal("1000000000000000000");

    // Set the allowance for the contract to spend the WBTC
    await WBTC.connect(addr1Signer).approve(ZBTC.address, mintAmount);

    expect(await ZBTC.connect(addr1Signer).mint(mintAmount))
      .to.emit(ZBTC, "Transfer")
      .withArgs(ethers.constants.AddressZero, owner, mintAmount);

    expect(await ZBTC.balanceOf(addr1)).to.equal("500000000000000000");
    expect(await WBTC.balanceOf(addr1)).to.equal("500000000000000000");

    // Try to burn the ZBTC and expect the same amount of WBTC back in the wallet
    const burnAmount = ethers.utils.parseUnits("0.25", 18);
    await ZBTC.connect(addr1Signer).approve(ZBTC.address, burnAmount);
    expect(await ZBTC.connect(addr1Signer).burn(burnAmount))
      .to.emit(ZBTC, "Transfer")
      .withArgs(owner, ethers.constants.AddressZero, burnAmount);

    expect(await ZBTC.balanceOf(addr1)).to.equal("250000000000000000");
    expect(await ZBTC.balanceOf(addr1)).to.equal("250000000000000000");
    expect(await WBTC.balanceOf(addr1)).to.equal("750000000000000000");
  });

  it("Should allow the holder to mint & burn ZBTC with extra sZBTC stake rewards", async function () {
    const mintAmount = ethers.utils.parseUnits("0.5", 18);
    const mintExtraAmount = ethers.utils.parseUnits("0.1", 18);

    expect(await ZBTC.balanceOf(addr1)).to.equal("0");
    expect(await WBTC.balanceOf(addr1)).to.equal("1000000000000000000");

    // Set the allowance for the contract to spend the WBTC
    await WBTC.connect(addr1Signer).approve(ZBTC.address, mintAmount);

    expect(await ZBTC.connect(addr1Signer).mint(mintAmount))
      .to.emit(ZBTC, "Transfer")
      .withArgs(ethers.constants.AddressZero, owner, mintAmount);

    expect(await ZBTC.balanceOf(addr1)).to.equal("500000000000000000");
    expect(await WBTC.balanceOf(addr1)).to.equal("500000000000000000");

    // Utilize sZBTC rewards to allow extra withdrawal of WBTC
    // Mint extra sZBTC for the addr1
    await sZBTC.mint(addr1, mintExtraAmount);
    await WBTC.mint(addr1, mintExtraAmount);
    // Transfer mintExtraAmount of WBTC to the contract
    await WBTC.connect(addr1Signer).transfer(ZBTC.address, mintExtraAmount);
    expect(await sZBTC.balanceOf(addr1)).to.equal("100000000000000000");
    expect(await WBTC.balanceOf(addr1)).to.equal("500000000000000000");

    // Set the allowance for the contract to spend the sZBTC
    await sZBTC.connect(addr1Signer).approve(ZBTC.address, mintExtraAmount);
    expect(
      await ZBTC.connect(addr1Signer).addExtraHolderBalance(mintExtraAmount),
    ).to.be.ok;

    // Try to burn the ZBTC and expect the same amount of WBTC back in the wallet
    const burnAmount = ethers.utils.parseUnits("0.6", 18);
    await ZBTC.connect(addr1Signer).approve(ZBTC.address, burnAmount);
    expect(await ZBTC.connect(addr1Signer).burn(burnAmount))
      .to.emit(ZBTC, "Transfer")
      .withArgs(owner, ethers.constants.AddressZero, burnAmount);

    expect(await ZBTC.balanceOf(addr1)).to.equal("0");
    expect(await ZBTC.balanceOf(addr1)).to.equal("0");
    expect(await WBTC.balanceOf(addr1)).to.equal("1100000000000000000");
  });
});
