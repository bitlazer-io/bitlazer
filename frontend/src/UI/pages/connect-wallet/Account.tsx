import { MyModal } from "@components/index"
import { useState } from "react"
import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from "wagmi"
import ConnectWallet from "./ConnectWallet"

export function Account() {
    const { address } = useAccount()
    const [openConnectWalletModal, setOpenConnectWalletModal] = useState(false)

    return (
        <div>
            {address && <button onClick={() => {
                setOpenConnectWalletModal(true)
            }}
                className="text-white"
            >{address.slice(0, 10) + '...' + address.slice(-10)}</button>}
            <MyModal
                label={'CONNECTED WALLET'}
                width="21.4375rem"
                open={openConnectWalletModal}
                handleClose={() => setOpenConnectWalletModal(false)}
            >
                <ConnectWallet />
            </MyModal>
        </div>
    )
}