import React from 'react';
import { SVGProps } from 'react';

const CompanyIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns='http://www.w3.org/2000/svg'
		width={24}
		height={24}
		fill='none'
		viewBox='0 0 24 24'
		{...props}
	>
		<g clipPath='url(#a)'>
			<path fill='#000' d='M12 14.993a3 3 0 0 0-3 3v6h6v-6a3 3 0 0 0-3-3Z' />
			<path d='M17 17.993v6h4a3 3 0 0 0 3-3v-9.121a2 2 0 0 0-.563-1.392l-8.498-9.187a4 4 0 0 0-5.875 0L.581 10.477A2 2 0 0 0 0 11.887v9.106a3 3 0 0 0 3 3h4v-6c.019-2.727 2.22-4.954 4.878-5.018 2.748-.066 5.101 2.198 5.122 5.018Z' />
			<path d='M12 14.993a3 3 0 0 0-3 3v6h6v-6a3 3 0 0 0-3-3Z' />
		</g>
		<defs>
			<clipPath id='a'>
				<path d='M0 0h24v24H0z' />
			</clipPath>
		</defs>
	</svg>
);
export default CompanyIcon;
