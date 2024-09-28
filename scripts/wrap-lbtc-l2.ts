import hre, { ethers } from 'hardhat'
import * as cli from './cli-step-processor'

const privateKey = process.env.ETHEREUM_PRIVATE_KEY!

async function main() {
    const providerUrl = 'https://sepolia-rollup.arbitrum.io/rpc'
    const provider = ethers.getDefaultProvider(providerUrl)
    const wallet = new ethers.Wallet(privateKey, provider)
    const owner = wallet.address

    const gasPrice = (await wallet.provider.getGasPrice()).mul(2)
    const balance = await ethers.provider.getBalance(owner)

    console.log(`💵 Wallet ${owner} balance: ${ethers.utils.formatEther(balance)}`)
    console.log(`⛽️ Gas price: ${gasPrice.toString()}`)

    const WBTC_ADDRESS = '0xa655cc81abD4A475fba7E8Ef4511A9e7bcbd1688'
    const TBTC_ADDRESS = '0xd7c8e18B464E5ff9f968c8CAB8DED2F0DEBF52c8'
    const ABTC_ADDRESS = '0x418840Ca602B0fd492A79252e07e3B0cc797E2D9'
    const lBTC_ADDRESS = '0x9787F9E130B82A2F45C9690884f5585f471C463E'

    // Load all tokens as ERC-20 and allow spend for the lBTC contract
    const lBTC = await ethers.getContractAt('lBTC', lBTC_ADDRESS, wallet)
    const WBTC = await ethers.getContractAt('ERC20', WBTC_ADDRESS, wallet)
    const TBTC = await ethers.getContractAt('ERC20', TBTC_ADDRESS, wallet)
    const ABTC = await ethers.getContractAt('ERC20', ABTC_ADDRESS, wallet)


    // Log the balances of the tokens of the wallet
    console.log(`Before wrap balances:`)
    console.log(`lBTC balance: ${await lBTC.balanceOf(owner)}`)
    console.log(`WBTC balance: ${await WBTC.balanceOf(owner)}`)
    console.log(`TBTC balance: ${await TBTC.balanceOf(owner)}`)
    console.log(`ABTC balance: ${await ABTC.balanceOf(owner)}`)

    // Approve tokens to be spent by lBTC contract (call one time only)
    // await lBTC.approve(lBTC_ADDRESS, ethers.constants.MaxUint256)
    // await WBTC.approve(lBTC_ADDRESS, ethers.constants.MaxUint256)
    // await TBTC.approve(lBTC_ADDRESS, ethers.constants.MaxUint256)
    // await ABTC.approve(lBTC_ADDRESS, ethers.constants.MaxUint256)

    await setTimeout(() => {}, 2000)

    // Wrap 1 WBTC to lBTC
    await lBTC.mint(ethers.utils.parseEther('1'), WBTC_ADDRESS)
    await lBTC.mint(ethers.utils.parseEther('1'), TBTC_ADDRESS)
    await lBTC.mint(ethers.utils.parseEther('1'), ABTC_ADDRESS)

    // Log the balances of the tokens of the wallet
    console.log(`After wrap balances:`)
    console.log(`lBTC balance: ${await lBTC.balanceOf(owner)}`)
    console.log(`WBTC balance: ${await WBTC.balanceOf(owner)}`)
    console.log(`TBTC balance: ${await TBTC.balanceOf(owner)}`)
    console.log(`ABTC balance: ${await ABTC.balanceOf(owner)}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
    .finally(() => {
        cli.rl.close()
    })
