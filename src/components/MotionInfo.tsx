import React from 'react';
import { StatIcon } from './StatIcon';

export const MotionInfo = ({ motion, tabledBy, children }: any) => {return (
  <div>
    <div className="d-flex justify-content-between">
      <div className="large font-weight-bold">
        {motion.name}
      </div>
      <div className="text-right pl-2">
        {tabledBy ? (<span>Drafted by <b>{tabledBy?.id === 'player' ? 'You' : tabledBy?.name}</b></span>) : ''}
      </div>
    </div>
    <div className="d-flex justify-content-between">
      <div>
      {motion.effects.map((effect: any, ii: number) => (
        <span key={ii} className="d-inline-block text-left" style={{width: '55px', color: effect.amount > 0 ? 'green' : effect.amount < 0 ? 'crimson' : 'initial'}}>
          <StatIcon mode='modifier' stat={effect.stat} value={effect.amount}></StatIcon>
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
