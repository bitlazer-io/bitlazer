import React from 'react';
import { SVGProps } from 'react';

const ReloadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    {...props}
  >
    <g clipPath="url(#za79797)">
      <path d="M14.961 7.992c-.504.005-.928.38-.993.88a6.011 6.011 0 1 1-2.046-5.442l-.754.754a.667.667 0 0 0 .474 1.139h3.06a.667.667 0 0 0 .667-.668v-3.06a.667.667 0 0 0-1.139-.472l-.889.89a8 8 0 1 0 2.61 7.15 1.01 1.01 0 0 0-.99-1.171Z" />
    </g>
    <defs>
      <clipPath id="za79797">
        <path d="M0 0h16v16H0z" />
      </clipPath>
    </defs>
  </svg>
);
export default ReloadIcon;
