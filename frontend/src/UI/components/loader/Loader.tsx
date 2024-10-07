import React, { FC } from 'react'

import s from './Loader.module.scss'

interface ILoader {}

const Loader: FC<ILoader> = () => {
  return (
    <div className={s.wrapper}>
      <span className={s.loader}></span>
    </div>
  )
}

export default Loader
