import React from 'react';
import { SVGProps } from 'react';

const LightningColorIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns='http://www.w3.org/2000/svg'
		width={24}
		height={24}
		fill='none'
		viewBox='0 0 24 24'
		{...props}
	>
		<path
			fill='url(#a)'
			d='M18.797 8.849a.603.603 0 0 0-.447-.257h-4.66L18.273.749a.47.47 0 0 0 0-.514.547.547 0 0 0-.436-.235h-6.234a.525.525 0 0 0-.459.268L5.188 12.782a.47.47 0 0 0 0 .492.413.413 0 0 0 .425.212h4.692l-3.351 9.888a.47.47 0 0 0 .223.57c.083.04.176.06.268.056a.615.615 0 0 0 .402-.168l10.95-14.447a.469.469 0 0 0 0-.536Z'
		/>
		<defs>
			<linearGradient id='a' x1={12} x2={12} y1={0} y2={24} gradientUnits='userSpaceOnUse'>
				<stop stopColor='#FFD600' />
				<stop offset={1} stopColor='#FF8A00' />
			</linearGradient>
		</defs>
	</svg>
);
export default LightningColorIcon;
