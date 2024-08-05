const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('lBTC Contract', function () {
  let lBTC
  let WBTC
  let owner, addr1, addr2
  let ownerSigner, addr1Signer, addr2Signer

  beforeEach(async function () {
    // Get signers
    ;[ownerSigner, addr1Signer, addr2Signer] = await ethers.getSigners()
    owner = ownerSigner.address
    addr1 = addr1Signer.address
    addr2 = addr2Signer.address

    // Deploy the contract WBTC - base token for mint/burn into lBTC
    const WBTCContract = await ethers.getContractFactory('WBTC')
    WBTC = await WBTCContract.deploy(owner, 'WBTC', 'WBTC')

    // Deploy the contract
    const lBTCContract = await ethers.getContractFactory('lBTC')
    lBTC = await lBTCContract.deploy(owner, 'lBTC', 'lBTC')

    // Mint 1 WBTC for the owner
    const mintAmount = ethers.utils.parseUnits('1', 18)
    await WBTC.mint(addr1, mintAmount)

    // Set WBTC as the minting base to lBTC
    await lBTC.setWBTCAddress(WBTC.address)

    expect(await WBTC.balanceOf(addr1)).to.equal('1000000000000000000')
    expect(await lBTC.getWBTCAddress()).to.equal(WBTC.address)
  })

  it('Should allow the holder to mint & burn lBTC', async function () {
    const mintAmount = ethers.utils.parseUnits('0.5', 18)
    expect(await lBTC.balanceOf(addr1)).to.equal('0')
    expect(await WBTC.balanceOf(addr1)).to.equal('1000000000000000000')

    // Set the allowance for the contract to spend the WBTC
    await WBTC.connect(addr1Signer).approve(lBTC.address, mintAmount)

    expect(await lBTC.connect(addr1Signer).mint(mintAmount))
      .to.emit(lBTC, 'Transfer')
      .withArgs(ethers.constants.AddressZero, owner, mintAmount)

    expect(await lBTC.balanceOf(addr1)).to.equal('500000000000000000')
    expect(await WBTC.balanceOf(addr1)).to.equal('500000000000000000')

    // Try to burn the lBTC and expect the same amount of WBTC back in the wallet
    const burnAmount = ethers.utils.parseUnits('0.25', 18)
    await lBTC.connect(addr1Signer).approve(lBTC.address, burnAmount)
    expect(await lBTC.connect(addr1Signer).burn(burnAmount))
      .to.emit(lBTC, 'Transfer')
      .withArgs(owner, ethers.constants.AddressZero, burnAmount)

    expect(await lBTC.balanceOf(addr1)).to.equal('250000000000000000')
    expect(await WBTC.balanceOf(addr1)).to.equal('750000000000000000')
  })
})
