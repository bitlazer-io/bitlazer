import React from 'react'

export interface IEcosystemItem {
  imageSrc: string
  logoSrc: string
  title: string
  description: string
  tag?: TypeEcosystemTag
  liveness?: TypeEcosystemLiveness
  socialIcons: IEcosystemLinks[]
}

interface IEcosystemLinks {
  icon: JSX.Element
  href: string
}
export type TypeEcosystemTag = 'defi' | 'bridge' | 'infra' | 'gaming' | 'nft'
export type TypeEcosystemLiveness = 'live' | 'upcoming'

const EcosystemItem: React.FC<IEcosystemItem> = ({ imageSrc, logoSrc, title, description, tag, liveness }) => {
  return (
    <article className="overflow-hidden rounded-[0.1153rem] bg-neutral-800 flex max-md:flex-col">
      <div className="flex flex-col md:max-w-[48.875rem] w-full relative">
        <img loading="lazy" src={imageSrc} alt="" className="object-cover size-full aspect-[1.72]" />

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
      <div className="flex flex-col gap-5 p-8 md:max-w-[25.5rem] w-full">
        <div className="flex flex-col gap-5">
          <div className="h-16 w-16 rounded-[5.1153rem] overflow-hidden">
            <img loading="lazy" src={logoSrc} alt={`${title} logo`} className="object-cover w-full h-full" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="m-0 text-2xl leading-tight text-white uppercase">{title}</h2>
            <p className="m-0 self-stretch text-sm leading-4 text-white uppercase opacity-70">{description}</p>
          </div>
        </div>
        {/* <ul className="flex items-center flex-wrap gap-2.5 mt-auto">
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

export default EcosystemItem
