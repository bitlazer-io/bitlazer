import React from 'react';
import { SVGProps } from 'react';

const CoinsIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns='http://www.w3.org/2000/svg'
		width={24}
		height={24}
		fill='none'
		viewBox='0 0 24 24'
		{...props}
	>
		<g clipPath='url(#a)'>
			<path d='M9 4c0-2.209 3.358-4 7.5-4C20.642 0 24 1.791 24 4s-3.358 4-7.5 4C12.358 8 9 6.209 9 4Zm7.5 6c-1.027 0-2.001-.115-2.891-.315C12.25 8.666 10.023 8 7.5 8 3.358 8 0 9.791 0 12s3.358 4 7.5 4c4.142 0 7.5-1.791 7.5-4 0-.029-.007-.057-.008-.086H15V14c0 2.209-3.358 4-7.5 4C3.358 18 0 16.209 0 14v2c0 2.209 3.358 4 7.5 4 4.142 0 7.5-1.791 7.5-4v2c0 2.209-3.358 4-7.5 4C3.358 22 0 20.209 0 18v2c0 2.209 3.358 4 7.5 4 4.142 0 7.5-1.791 7.5-4v-.08c.485.052.986.08 1.5.08 4.142 0 7.5-1.791 7.5-4v-2c0 2.119-3.092 3.849-7 3.987v-2c3.908-.138 7-1.867 7-3.987v-2c0 2.119-3.092 3.849-7 3.987v-2c3.908-.138 7-1.867 7-3.987V6c0 2.209-3.358 4-7.5 4Z' />
		</g>
		<defs>
			<clipPath id='a'>
				<path d='M0 0h24v24H0z' />
			</clipPath>
		</defs>
	</svg>
);
export default CoinsIcon;