import React from 'react';
import { stats } from '../models/stats.model';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

export const StatIcon = ({ stat, value, mode, color, showOverlay = true }: any) => {
  const placement = 'top';
  const baseElement = (
    <div className={`d-inline-flex justify-content-start ${showOverlay ? 'stat__wrapper' : ''} align-items-center`}>
      <i style={{color: color || stats[stat]?.color}} className={"fas fa-fw mr-1 fa-" + (stats[stat]?.icon || 'star')}></i>
      <b style={{fontSize: '0.8em', fontFamily: `"Lucida Console", Monaco, monospace`}}>{mode==='modifier' && value > 0 ? '+' : ''}{value}</b>
    </div>
  );
  const wrappedElement = (
    <OverlayTrigger
      key={placement}
      placement={placement}
      overlay={
        <Tooltip id={`tooltip-${placement}`}>
          {stats[stat]?.label}
        </Tooltip>
      }
    >
      {baseElement}
    </OverlayTrigger>
  );
  return showOverlay
    ? wrappedElement
    : baseElement
};
