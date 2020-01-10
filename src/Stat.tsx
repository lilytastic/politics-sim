import React from 'react';
import { stats } from './Game';

export const Stat = ({ stat, value, color }: any) => {return (
	<span>
		<i style={{color: color || stats[stat]?.color}} className={"fas fa-fw mr-1 fa-" + (stats[stat]?.icon || 'star')}></i>
		{value}
	</span>
)};
