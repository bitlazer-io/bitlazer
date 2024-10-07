import React from 'react';
import { SVGProps } from 'react';

const ChevronNextIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		width={16}
		height={16}
		viewBox='0 0 16 16'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		{...props}
	>
		<path d='M11 8C11 8.12787 10.9512 8.25587 10.8535 8.3535L5.85353 13.3535C5.65816 13.5489 5.34178 13.5489 5.14653 13.3535C4.95128 13.1581 4.95116 12.8417 5.14653 12.6465L9.79303 8L5.14653 3.3535C4.95116 3.15812 4.95116 2.84175 5.14653 2.6465C5.34191 2.45125 5.65828 2.45112 5.85353 2.6465L10.8535 7.6465C10.9512 7.74412 11 7.87212 11 8Z' />
	</svg>
);
export default ChevronNextIcon;
