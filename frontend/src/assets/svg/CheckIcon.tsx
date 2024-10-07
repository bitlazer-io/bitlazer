import React from 'react';
import { SVGProps } from 'react';

const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		width={15}
		height={16}
		viewBox='0 0 15 16'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		{...props}
	>
		<g clipPath='url(#clip0_109_4229)'>
			<path d='M7.5 0.5C3.36466 0.5 0 3.86466 0 8C0 12.1353 3.36466 15.5 7.5 15.5C11.6353 15.5 15 12.1353 15 8C15 3.86466 11.6353 0.5 7.5 0.5ZM11.6917 6.02632L6.8985 10.782C6.61654 11.0639 6.16541 11.0827 5.86466 10.8008L3.32707 8.48872C3.02632 8.20677 3.00752 7.73684 3.27068 7.43609C3.55263 7.13534 4.02256 7.11654 4.32331 7.3985L6.33459 9.2406L10.6203 4.95489C10.9211 4.65414 11.391 4.65414 11.6917 4.95489C11.9925 5.25564 11.9925 5.72556 11.6917 6.02632Z' />
		</g>
		<defs>
			<clipPath id='clip0_109_4229'>
				<rect width={15} height={15} fill='white' transform='translate(0 0.5)' />
			</clipPath>
		</defs>
	</svg>
);
export default CheckIcon;
