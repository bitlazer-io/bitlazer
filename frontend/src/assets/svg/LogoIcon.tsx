import React from 'react'
import { SVGProps } from 'react'

const LogoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="0.5" y="0.5" width="24" height="24" rx="12" fill="#6AA3EA" />
    <rect x="1" y="1" width="23" height="23" rx="11.5" stroke="white" strokeOpacity="0.3" />
    <path
      d="M8.99512 6.80853L6.68218 9.12148V14.9039H6.68261C6.68229 14.9228 6.68213 14.9419 6.68213 14.961C6.68213 16.8202 8.19397 18.3321 10.0745 18.3724V18.3733H11.9249V16.0603H10.0748L10.0745 16.0603C9.43575 16.0603 8.99508 15.5892 8.99508 14.961L8.99512 6.80853Z"
      fill="white"
    />
    <path d="M18.8637 6.80853L16.5508 9.12148H11.3081V6.80853L18.8637 6.80853Z" fill="white" />
    <path
      d="M16.5508 13.7474L18.8637 11.4344L11.3081 11.4344V13.7474H14.2378V18.3733L16.5508 16.0603V13.7474Z"
      fill="white"
    />
  </svg>
)
export default LogoIcon
