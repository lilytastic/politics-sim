import React from 'react';
import { Stat } from './Stat';

export const MotionInfo = ({ motion, tabledBy, children }: any) => {return (
  <div>
    <div className="d-flex justify-content-between">
      <div className="large mb-1 font-bold">
        {motion.name}
      </div>
      <div>
        {tabledBy ? (<span>Tabled by <b>{tabledBy?.name}</b></span>) : ''}
      </div>
    </div>
    <div className="d-flex justify-content-between">
      <div>
      {motion.effects.map((effect: any, ii: number) => (
        <span key={ii} className="d-inline-block text-left" style={{width: '55px', color: effect.amount > 0 ? 'green' : effect.amount < 0 ? 'crimson' : 'initial'}}>
          <Stat mode='modifier' stat={effect.stat} value={effect.amount}></Stat>
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
