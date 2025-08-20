import React, { FC, useState } from 'react'
import EcosystemGridItem from '../item/EcosystemGridItem'

import { useMediaQuery } from 'react-responsive'

import barbarianBackground from '@images/ecosystem/barbarian/792983471455859783.png'
import barbarianLogo from '@images/ecosystem/barbarian/792982900225199389.png'
import abyssLogo from '@images/ecosystem/abyss/792985258162286918.png'
import abyssBackground from '@images/ecosystem/abyss/792991494454650274.png'
import EcosystemItem, { IEcosystemItem, TypeEcosystemLiveness, TypeEcosystemTag } from '../item/EcosystemItem'
import { DiscordIcon, LinkIcon, XIcon } from '@svgs'
import { InputField, MySelect } from '@components/index'

const ecosystemData: IEcosystemItem[] = [
  // {
  //   imageSrc: quantumBackground,
  //   logoSrc: quantumLogo,
  //   title: 'Quantum Bridge',
  //   description:
  //     'Quantum Bridge is an innovative crypto project focused on interconnectivity, decentralization, and security across multiple blockchain ecosystems',
  //   socialIcons: [
  //     {
  //       icon: <LinkIcon />,
  //       href: 'http://',
  //     },
  //     {
  //       icon: <XIcon />,
  //       href: 'http://',
  //     },
  //     {
  //       icon: <DiscordIcon />,
  //       href: 'http://',
  //     },
  //   ],
  // },
  {
    imageSrc: barbarianBackground,
    logoSrc: barbarianLogo,
    title: 'Barbarian Swap',
    description:
      'Barbarian Swap revolutionizes decentralized trading by empowering users with seamless, secure, and efficient asset exchanges',
    tag: 'defi',
    liveness: 'upcoming',
    socialIcons: [
      {
        icon: <LinkIcon />,
        href: 'http://',
      },
      {
        icon: <XIcon />,
        href: 'http://',
      },
      {
        icon: <DiscordIcon />,
        href: 'http://',
      },
    ],
  },
  // {
  //   imageSrc: bitBeamBackground,
  //   logoSrc: bitBeamLogo,
  //   title: 'BitBeam',
  //   description:
  //     'BitBeam is airdropping BTC to users, promoting decentralized finance and rewarding community engagement and participation.  ',
  //   tag: 'defi',
  //   liveness: 'upcoming',
  //   socialIcons: [
  //     {
  //       icon: <LinkIcon />,
  //       href: 'http://',
  //     },
  //     {
  //       icon: <XIcon />,
  //       href: 'http://',
  //     },
  //     {
  //       icon: <DiscordIcon />,
  //       href: 'http://',
  //     },
  //   ],
  // },
  {
    imageSrc: abyssBackground,
    logoSrc: abyssLogo,
    title: 'AbyssNFT',
    description:
      'AbyssNFT is a groundbreaking project that brings art to life, enchanting users with unique, mystical non-fungible tokens and experiences.',
    tag: 'nft',
    liveness: 'upcoming',
    socialIcons: [
      {
        icon: <LinkIcon />,
        href: 'http://',
      },
      {
        icon: <XIcon />,
        href: 'http://',
      },
      {
        icon: <DiscordIcon />,
        href: 'http://',
      },
    ],
  },
  // {
  //   imageSrc: image4,
  //   logoSrc: logo4,
  //   title: 'Atlendis',
  //   description: 'First RWA Lending Protocol',
  //   tag: 'infra',
  //   liveness: 'live',
  //   socialIcons: [
  //     {
  //       icon: <LinkIcon />,
  //       href: 'http://',
  //     },
  //     {
  //       icon: <XIcon />,
  //       href: 'http://',
  //     },
  //     {
  //       icon: <DiscordIcon />,
  //       href: 'http://',
  //     },
  //   ],
  // },
  // {
  //   imageSrc: image5,
  //   logoSrc: logo5,
  //   title: 'Bebop',
  //   description: 'Bebop is a trading app and a suite of APIs that finds the best route for your trades.',
  //   tag: 'infra',
  //   socialIcons: [
  //     {
  //       icon: <LinkIcon />,
  //       href: 'http://',
  //     },
  //     {
  //       icon: <XIcon />,
  //       href: 'http://',
  //     },
  //     {
  //       icon: <DiscordIcon />,
  //       href: 'http://',
  //     },
  //   ],
  // },
  // {
  //   imageSrc: image6,
  //   logoSrc: logo6,
  //   title: 'Beefy',
  //   description: 'Beefy automates yield farming to make DeFi easy, safe and efficient for all.',
  //   tag: 'bridge',
  //   liveness: 'upcoming',
  //   socialIcons: [
  //     {
  //       icon: <LinkIcon />,
  //       href: 'http://',
  //     },
  //     {
  //       icon: <XIcon />,
  //       href: 'http://',
  //     },
  //     {
  //       icon: <DiscordIcon />,
  //       href: 'http://',
  //     },
  //   ],
  // },
]

const tagOptions = [
  { value: 'defi', label: 'DeFi' },
  { value: 'nft', label: 'NFT' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'infra', label: 'Infra' },
  { value: 'gaming', label: 'Gaming' },
]

const livenessOptions = [
  { value: 'live', label: 'Live' },
  { value: 'upcoming', label: 'Upcoming' },
]

interface IEcosystemGrid {}

const EcosystemGrid: FC<IEcosystemGrid> = () => {
  const isDesktop = useMediaQuery({ minWidth: 992 })

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<TypeEcosystemTag | null>(null)
  const [selectedLiveness, setSelectedLiveness] = useState<TypeEcosystemLiveness | null>(null)

  const filteredData = ecosystemData.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = selectedTag ? item.tag === selectedTag : true
    const matchesLiveness = selectedLiveness ? item.liveness === selectedLiveness : true
    return matchesSearch && matchesTag && matchesLiveness
  })

  return (
    <div className="flex flex-col gap-10 md:gap-20">
      <div className="w-full flex flex-col gap-2 md:gap-4 [&_*]:!pointer-events-auto">
        <div className="grid grid-cols-2 gap-2 md:gap-4 w-full">
          <MySelect
            placeholder="Filter by tags"
            options={tagOptions}
            value={selectedTag ? { value: selectedTag, label: selectedTag } : null}
            onChange={(option) => setSelectedTag(option?.value as TypeEcosystemTag)}
          />
          <MySelect
            placeholder="Filter by liveness"
            options={livenessOptions}
            value={selectedLiveness ? { value: selectedLiveness, label: selectedLiveness } : null}
            onChange={(option) => setSelectedLiveness(option?.value as TypeEcosystemLiveness)}
          />
        </div>
        <InputField
          withoutShadow
          placeholder="Search..."
          className="custom-input h-[2.875rem] min-h-[2.875rem]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-10 md:gap-20">
        {filteredData.length > 0 ? (
          <>
            {isDesktop && <EcosystemItem {...filteredData[0]} />}
            <div className={`grid gap-5 ${isDesktop ? 'md:grid-cols-3' : 'grid-cols-1'}`}>
              {isDesktop
                ? filteredData.slice(1).map((item, index) => <EcosystemGridItem key={index} {...item} />)
                : filteredData.map((item, index) => <EcosystemGridItem key={index} {...item} />)}
            </div>
          </>
        ) : (
          <p>No results found. Try adjusting your filters or search term.</p>
        )}
      </div>
    </div>
  )
}

export default EcosystemGrid
