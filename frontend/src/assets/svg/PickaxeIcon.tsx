import React from 'react';
import { SVGProps } from 'react';

const PickaxeIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns='http://www.w3.org/2000/svg'
		width={24}
		height={24}
		fill='none'
		viewBox='0 0 24 24'
		{...props}
	>
		<g clipPath='url(#a)'>
			<path d='M23.984 18.985c0-5.689-1.484-10.142-4.24-13.315l1.713-1.713-1.414-1.414-1.712 1.712C15.157 1.49 10.698 0 5.001 0v1.999c3.653.685 7.296 2.634 10.286 5.299L.075 22.511l1.414 1.414L16.7 8.714c2.658 2.987 4.601 6.624 5.285 10.271h2Z' />
		</g>
		<defs>
			<clipPath id='a'>
				<path d='M0 0h24v24H0z' />
			</clipPath>
		</defs>
	</svg>
);
export default PickaxeIcon;
