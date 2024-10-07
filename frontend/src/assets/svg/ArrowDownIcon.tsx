import React from 'react';
import { SVGProps } from 'react';

const ArrowDownIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		{...props}
		width='16'
		height='16'
		viewBox='0 0 16 16'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
	>
		<path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M3.64648 9.68697L4.35359 8.97987L7.50004 12.1263V3.33342C7.50004 3.05728 7.7239 2.83342 8.00004 2.83342C8.27618 2.83342 8.50004 3.05728 8.50004 3.33342V12.1263L11.6465 8.97987L12.3536 9.68697L8.00004 14.0405L3.64648 9.68697Z'
		/>
	</svg>
);
export default ArrowDownIcon;
