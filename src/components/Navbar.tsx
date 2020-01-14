import React from 'react';
import { StatIcon } from "./StatIcon";

export const Navbar = ({ player }: any) => {
  return (
    <nav className="navbar py-1 px-0 sticky-top navbar-dark bg-dark">
      <div className="container px-4">
      <ul className="navbar-nav mr-auto">
        <li className="nav-item">
        <span className="navbar-text font-weight-bold">
          Qui'shon
        </span>
        </li>
      </ul>
      <ul className="navbar-nav">
        <li className="nav-item">
        <span className="navbar-text">
          <StatIcon stat="capital" value={player?.state.capital}></StatIcon>
        </span>
        </li>
      </ul>
      </div>
    </nav>
  );
}
