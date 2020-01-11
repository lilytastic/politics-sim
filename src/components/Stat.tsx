import React from 'react';
import { stats } from '../models/stats.model';

export const Stat = ({ stat, value, mode, color }: any) => {return (
	<div className="d-inline-flex justify-content-start align-items-center">
		<i style={{color: color || stats[stat]?.color}} className={"fas fa-fw mr-1 fa-" + (stats[stat]?.icon || 'star')}></i>
		<b style={{fontSize: '0.8em', fontFamily: `"Lucida Console", Monaco, monospace`}}>{mode==='modifier' && value > 0 ? '+' : ''}{value}</b>
	</div>
)};
