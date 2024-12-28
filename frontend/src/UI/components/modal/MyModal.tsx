import React, { FC, PropsWithChildren } from 'react'

import clsx from 'clsx'
import Modal from '@mui/material/Modal'
import { Fade } from '@mui/material'

import Draggable from 'react-draggable'

export interface IMyModal {
  open: boolean
  handleClose: () => void
  width?: string
  className?: string
  label: string
  isReversed?: boolean
  position?: string
}

const MyModal: FC<PropsWithChildren<IMyModal>> = ({
  open,
  handleClose,
  width = 'w-[26.75rem]',
  children,
  className,
  label,
  position = 'md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
}) => {
  return (
    <Draggable handle=".modal-header">
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={open}
        onClose={handleClose}
        closeAfterTransition
        hideBackdrop={true}
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
        disableScrollLock={true}
      >
        <Fade in={open}>
          <div
            className={clsx(
              'absolute ',
              position,
              'bg-transparent border-0 top-0 left-0  md:!h-auto h-full md:pointer-events-auto md:[&_*]:pointer-events-auto',
              width,
              className,
            )}
          >
            <div className="relative md:h-auto h-full font-ocrx">
              <div className="w-full flex flex-col gap-[0.031rem] md:h-auto h-full">
                <div className="self-stretch rounded-[.115rem] bg-forestgreen flex flex-col  py-[0.187rem] px-[0.125rem] modal-header">
                  <div className="self-stretch shadow-[-1.8px_-0.9px_3.69px_rgba(215,_215,_215,_0.18)_inset,_1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] bg-darkolivegreen-200 flex flex-row items-center justify-between py-[0.25rem] pl-[0.875rem] pr-[0.25rem] gap-[1.25rem]">
                    <div className="text-lightgreen-100 font-ocrx uppercase text-[1.25rem] md:text-[1.5rem] leading-[50%] pt-3.5">
                      {label}
                    </div>

                    <button
                      onClick={handleClose}
                      className="h-[2.025rem] w-[1.881rem] leading-[50%] pt-3 text-lightgreen-100 hover:text-lightgreen-100 shadow-[1.8px_1.8px_1.84px_rgba(0,_0,_0,_0.91)_inset] rounded-[.115rem] bg-darkolivegreen-200 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-[1.8px_1.8px_1.84px_1.4px_rgba(0,_0,_0,_0.91)_inset]"
                    >
                      X
                    </button>
                  </div>
                </div>
                <div className="self-stretch -mt-[.1875rem] flex flex-col text-[1rem] text-white overflow-y-auto scroller md:h-auto h-full ">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </Fade>
      </Modal>
    </Draggable>
  )
}

export default MyModal
