import React from 'react'
import { IEcosystemItem } from './EcosystemItem'

interface IEcosystemGridItem extends IEcosystemItem {}

const EcosystemGridItem: React.FC<IEcosystemGridItem> = ({ imageSrc, logoSrc, title, description, tag, liveness }) => {
  return (
    <article className="flex overflow-hidden flex-col items-center p-2 pb-7 w-full rounded-[0.1153rem] bg-neutral-800">
      <div className="flex flex-col overflow-hidden rounded-[0.1153rem] relative justify-between p-3 w-full text-sm font-medium leading-none uppercase whitespace-nowrap aspect-[1.815] text-white">
        <img loading="lazy" src={imageSrc} alt="" className="object-cover absolute inset-0 size-full scale-105" />
        {tag && (
          <span className="absolute top-3 left-3 z-10 pointer-events-none px-3 py-2.5 bg-lightgreen-100 rounded">
            {tag.toLocaleUpperCase()}
          </span>
        )}
        {liveness && (
          <span className="absolute top-3 right-3 z-10 pointer-events-none px-3 py-2.5 bg-lightgreen-100 rounded">
            {liveness.toLocaleUpperCase()}
          </span>
        )}
      </div>
      <div className="-mt-8 w-16 h-16 rounded-[0.1153rem] overflow-hidden flex items-center justify-center bg-black border-4 border-solid border-neutral-800 relative z-10">
        <div className="flex items-center justify-center p-1.5">
          <img loading="lazy" src={logoSrc} alt={`${title} logo`} className="object-contain size-full aspect-square" />
        </div>
      </div>
      <div className="flex flex-col gap-10 mt-8">
        <div className="flex flex-col gap-1 items-center text-center md:px-3">
          <h2 className="m-0 text-2xl leading-tight text-white uppercase">{title}</h2>
          <p className="m-0 text-sm font-light leading-4 text-center text-white uppercase opacity-70">{description}</p>
        </div>
        {/* <ul className="flex items-center justify-center flex-wrap gap-2.5">
          {socialIcons.map((icon, index) => (
            <li key={index}>
              <a
                className="w-8 h-8 flex items-center justify-center icon hover:opacity-70"
                href={icon.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {icon.icon}
              </a>
            </li>
          ))}
        </ul> */}
      </div>
    </article>
  )
}

export default EcosystemGridItem
