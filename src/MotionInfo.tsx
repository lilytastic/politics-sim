import React from 'react';
import { stats } from './Game';

export const MotionInfo = ({ motion, tabledBy, children }: any) => {return (
  <div>
    <div className="d-flex justify-content-between">
      <div>
        {motion.name}
      </div>
      <div>
        {tabledBy ? (<span>Tabled by <b>{tabledBy?.name}</b></span>) : ''}
      </div>
    </div>
    <div className="d-flex justify-content-between">
      <div>
      {motion.effects.map((effect: any, ii: number) => (
        <span key={ii} className="d-inline-block" style={{width: '50px', color: effect.amount <= 0 ? 'crimson' : 'initial'}}>
        <i className={'fas fa-fw fa-' + stats[effect.stat]?.icon || 'star'}></i>
        {effect.amount}
        &nbsp;
        </span>
      ))}
      </div>
      <div>
        {children}
      </div>
    </div>
  </div>
)}
