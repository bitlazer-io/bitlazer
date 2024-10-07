import React from 'react';
import { SVGProps } from 'react';

const ChartPieIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns='http://www.w3.org/2000/svg'
		width={24}
		height={24}
		fill='none'
		viewBox='0 0 24 24'
		{...props}
	>
		<g clipPath='url(#a)'>
			<path d='M12.3 10.178c.103.233.225.457.363.671l10.862-2.161A11.962 11.962 0 0 0 8.215.621l4.085 9.557Z' />
			<path d='M12.631 13.742a7.007 7.007 0 0 1-2.169-2.773L6.377 1.406a11.991 11.991 0 1 0 14.512 18.626l-8.258-6.29Z' />
			<path d='m14.365 12.549 7.741 5.9A11.916 11.916 0 0 0 24 12a12.03 12.03 0 0 0-.08-1.351l-9.555 1.9Z' />
		</g>
		<defs>
			<clipPath id='a'>
				<path d='M0 0h24v24H0z' />
			</clipPath>
		</defs>
	</svg>
);
export default ChartPieIcon;
