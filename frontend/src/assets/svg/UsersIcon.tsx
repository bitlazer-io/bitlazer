import React from 'react';
import { SVGProps } from 'react';

const UsersIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns='http://www.w3.org/2000/svg'
		width={24}
		height={24}
		fill='none'
		viewBox='0 0 24 24'
		{...props}
	>
		<g clipPath='url(#a)'>
			<path d='M7.5 13a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm7.5 7a5.006 5.006 0 0 0-5-5H5a5.006 5.006 0 0 0-5 5v4h15v-4Zm2.5-11a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm1.5 2h-5c-.175.008-.35.026-.524.053a6.514 6.514 0 0 1-1.576 2.216A7.008 7.008 0 0 1 17 20h7v-4a5.006 5.006 0 0 0-5-5Z' />
		</g>
		<defs>
			<clipPath id='a'>
				<path d='M0 0h24v24H0z' />
			</clipPath>
		</defs>
	</svg>
);
export default UsersIcon;
