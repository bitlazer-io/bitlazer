import React from 'react'
import { SVGProps } from 'react'

const RocketColorIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={25} height={25} fill="none" viewBox="0 0 25 25" {...props}>
    <path
      fill="url(#a)"
      d="M3.75 15H1v-1a7.634 7.634 0 0 1 4.065-6.831 10.975 10.975 0 0 1 3.9-1.09 54.227 54.227 0 0 0-1.783 2.338A40.585 40.585 0 0 0 3.75 15Zm12.833 2.813A40.58 40.58 0 0 1 10 21.249V24h1a7.634 7.634 0 0 0 6.83-4.065 10.975 10.975 0 0 0 1.09-3.9c-.73.59-1.509 1.183-2.337 1.778ZM25 2.991c-.133 4.353-3.267 8.67-9.582 13.2A34.995 34.995 0 0 1 10 19.063V18.5A3.517 3.517 0 0 0 6.5 15h-.563c.798-1.886 1.76-3.7 2.876-5.417C13.332 3.278 17.642.144 21.988 0 24.154 0 25 .885 25 2.991ZM19 8.5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0ZM2.374 23.785c1.126-.2 3.84-.758 4.748-1.664a3 3 0 1 0-4.243-4.243c-.906.907-1.465 3.622-1.664 4.748l-.247 1.406 1.406-.247Z"
    />
    <defs>
      <linearGradient id="a" x1={12.984} x2={12.984} y1={0} y2={24.032} gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFD600" />
        <stop offset={1} stopColor="#FF8A00" />
      </linearGradient>
    </defs>
  </svg>
)
export default RocketColorIcon
