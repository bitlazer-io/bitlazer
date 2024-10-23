import { FC } from 'react'

interface ITXToast {
    message: string,
    txHash?: string
}

const TXToast: FC<ITXToast> = ({ message, txHash }) => {

    return (
        <div
            className='self-stretch rounded-[.115rem] bg-forestgreen flex flex-col py-[0.187rem] px-[0.125rem] font-maison-neue-trial'
        >
            <div className="self-stretch shadow-[-1.8px_-0.9px_3.69px_rgba(215,_215,_215,_0.18)_inset,_1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] bg-darkolivegreen-200 flex flex-col items-left justify-between py-[0.25rem] pl-[0.875rem] pr-[0.25rem] gap-[1.25rem]">
                <div className="text-lightgreen-100 font-ocr-x-trial uppercase text-[1.25rem]">
                    {message}
                </div>
                {
                    txHash && (
                        <a
                            href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                            target='_blank'
                        >
                            TX Hash: {txHash}
                        </a>
                    )
                }
            </div>
        </div>
    )
}

export default TXToast
