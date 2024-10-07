import React from 'react';
import { SVGProps } from 'react';

const ChevronDownIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns='http://www.w3.org/2000/svg'
		width={16}
		height={16}
		fill='none'
		viewBox='0 0 16 16'
		{...props}
	>
		<path d='M8 11a.499.499 0 0 1-.353-.146l-5-5a.5.5 0 1 1 .707-.708L8 9.793l4.646-4.646a.5.5 0 1 1 .707.707l-5 5A.499.499 0 0 1 8 11Z' />
	</svg>
);
export default ChevronDownIcon;
