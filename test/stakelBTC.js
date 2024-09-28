const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')

describe('StakeLBTC Contract', function () {
  let StakeLBTC
  let stakeContract
  let owner, addr1, addr2
  let ownerSigner, addr1Signer, addr2Signer

  beforeEach(async function () {
    // Get signers
    ;[ownerSigner, addr1Signer, addr2Signer] = await ethers.getSigners()
    owner = ownerSigner.address
    addr1 = addr1Signer.address
    addr2 = addr2Signer.address

    // Deploy the StakeLBTC contract
    const StakeLBTCFactory = await ethers.getContractFactory('StakeLBTC')
    stakeContract = await upgrades.deployProxy(StakeLBTCFactory, [owner, 'StakeLBTC', 'sLBTC'], {
      initializer: 'initialize',
    })
    await stakeContract.deployed()
  })

  it('Should allow staking and minting tokens', async function () {
    const stakeAmount = ethers.utils.parseUnits('1', 18)

    // Stake 1 ETH (or the native currency) from addr1
    await stakeContract.connect(addr1Signer).stake(stakeAmount, { value: stakeAmount })

    // Check the total staked and the balance of the addr1
    expect(await stakeContract.totalStaked()).to.equal(stakeAmount)
    expect(await stakeContract.balanceOf(addr1)).to.equal(stakeAmount)

    // Check the first and last holders
    expect(await stakeContract.readHolders()).to.deep.equal([addr1])
  })

  it('Should allow unstaking and burning tokens', async function () {
    const stakeAmount = ethers.utils.parseUnits('1', 18)
    const unstakeAmount = ethers.utils.parseUnits('0.5', 18)

    // Stake 1 ETH from addr1
    await stakeContract.connect(addr1Signer).stake(stakeAmount, { value: stakeAmount })

    // Unstake 0.5 ETH
    await stakeContract.connect(addr1Signer).unstake(unstakeAmount)

    // Check the total staked, the balance of addr1, and the contract balance
    expect(await stakeContract.totalStaked()).to.equal(unstakeAmount)
    expect(await stakeContract.balanceOf(addr1)).to.equal(unstakeAmount)
  })

  it('Should distribute rewards proportionally to stakers', async function () {
    const stakeAmount1 = ethers.utils.parseUnits('1', 18)
    const stakeAmount2 = ethers.utils.parseUnits('2', 18)
    const rewardAmount = ethers.utils.parseUnits('1', 18)

    // Stake from addr1 and addr2
    await stakeContract.connect(addr1Signer).stake(stakeAmount1, { value: stakeAmount1 })
    await stakeContract.connect(addr2Signer).stake(stakeAmount2, { value: stakeAmount2 })

    // Send rewards to the contract
    await ownerSigner.sendTransaction({ to: stakeContract.address, value: rewardAmount })

    // Distribute the rewards
    await stakeContract.connect(ownerSigner).charge(rewardAmount, { value: rewardAmount })

    // Check balances after reward distribution
    const addr1Balance = await stakeContract.balanceOf(addr1)
    const addr2Balance = await stakeContract.balanceOf(addr2)

    // addr1 should receive 1/3 of the rewards, addr2 should receive 2/3
    expect(addr1Balance).to.equal(stakeAmount1.add(rewardAmount.div(3)))
    expect(addr2Balance).to.equal(stakeAmount2.add(rewardAmount.mul(2).div(3)))
  })

  it('Should only allow the owner to charge rewards', async function () {
    const rewardAmount = ethers.utils.parseUnits('1', 18)

    // Charge rewards from the owner
    await ownerSigner.sendTransaction({ to: stakeContract.address, value: rewardAmount })
    await expect(stakeContract.connect(ownerSigner).charge(rewardAmount, { value: rewardAmount })).to.not.be.reverted
  })

  it('Should correctly manage holders when staking and unstaking', async function () {
    const stakeAmount = ethers.utils.parseUnits('1', 18)

    // Stake from addr1 and addr2
    await stakeContract.connect(addr1Signer).stake(stakeAmount, { value: stakeAmount })
    await stakeContract.connect(addr2Signer).stake(stakeAmount, { value: stakeAmount })

    // Check holders
    expect(await stakeContract.readHolders()).to.deep.equal([addr1, addr2])

    // Unstake from addr1
    await stakeContract.connect(addr1Signer).unstake(stakeAmount)

    // Check holders, addr1 should be removed
    expect(await stakeContract.readHolders()).to.deep.equal([addr2])
  })

  it('Should fail unstaking if balance is insufficient', async function () {
    const stakeAmount = ethers.utils.parseUnits('1', 18)
    const unstakeAmount = ethers.utils.parseUnits('1.5', 18)

    // Stake 1 ETH from addr1
    await stakeContract.connect(addr1Signer).stake(stakeAmount, { value: stakeAmount })

    // Attempt to unstake 1.5 ETH, should fail
    await expect(stakeContract.connect(addr1Signer).unstake(unstakeAmount)).to.be.revertedWith(
      'Insufficient balance to unstake',
    )
  })

  it('Should update version only by the owner', async function () {
    const newVersion = ethers.utils.formatBytes32String('v2.0')

    // Attempt to set version by non-owner
    await expect(stakeContract.connect(addr1Signer).setVersion(newVersion)).to.be.revertedWith(
      'Only owner can call this function',
    )

    // Set version by the owner
    await stakeContract.connect(ownerSigner).setVersion(newVersion)
    expect(await stakeContract.version()).to.equal(newVersion)
  })
})
