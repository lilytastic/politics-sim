import React from 'react';
import { connect } from 'react-redux'
import { interval } from 'rxjs';
import { changeCurrentPhase, changeCurrentPhaseCountdown, refreshAvailableMotions, tableMotion, rescindMotion } from './actionCreators';

interface Politician {
  id: number;
  name: string;
  positions: PoliticalPosition[];
  capital: number;
}

interface PoliticalPosition {
  stat: string;
  attitude: string;
  passion: number;
}

// Current Phase: {this.props.phase.name} ({this.props.phase.countdown - currentPhaseCountdown}s) {currentPhaseCountdown}

class Game extends React.Component {
  props: any;

  constructor(props: any) {
    super(props);

    props.dispatch(refreshAvailableMotions());
    interval(1000).subscribe(x => {
      this.onTick();
    });
  }

  onTick() {
    if (this.props.currentPhaseCountdown >= this.props.phase?.countdown) {
      this.props.dispatch(changeCurrentPhase((this.props.currentPhase + 1) % this.props.phases.length));
      if (this.props.phase?.name === 'table') {
        this.props.dispatch(refreshAvailableMotions());
      }
    } else {
      this.props.dispatch(changeCurrentPhaseCountdown(this.props.currentPhaseCountdown + 1));
    }
  }

  table = (motionId: number) => {
    console.log('tabling', motionId);
    const tabled = this.props.motionsTabled.find((x: any) => x.id === motionId);
    if (!tabled) {
      this.props.dispatch(tableMotion(motionId, 0));
    } else if (tabled.tabledBy === 0) {
      this.props.dispatch(rescindMotion(motionId));
    }
  };
  vote = (motionId: number) => {
    console.log('voting', motionId);
  };

  phaseFunc: {[id: string]: (motionid: number) => void} = {table: this.table, vote: this.vote};

  render = () => (
    <div className="p-5">
      <div className="mb-4">
        Current Phase: {this.props.phase?.name} ({this.props.phase?.countdown - this.props.currentPhaseCountdown}s)
      </div>
      <div className="row">
        <div className="col">
          {politicians.map((x, i) => (
            <div className="border-top py-1" key={i}>
              <div className="d-flex align-items-center">
                <div className="w-25">{i+1}. {x.name}</div>
                <div><i className="fas fa-fw fa-handshake mr-1" style={{color: 'crimson'}}></i>{x.capital}</div>
              </div>
              {x.positions.map((position, ii) => (
                <i style={{color: position.attitude !== 'raise' ? 'crimson' : 'initial'}} key={ii} className={'fas fa-fw fa-' + stats[position.stat]?.icon || 'star'}></i>
              ))}
            </div>
          ))}
        </div>
        <div className="col">
          {this.props.availableMotions.map((motion: any, i: number) => (
            <button
                onClick={() => this.phaseFunc[this.props.phase.name] ? this.phaseFunc[this.props.phase.name](motion.id) : null} key={i}
                className={"text-left d-block mb-2 w-100 " + (this.props.motionsTabled.findIndex((x: any) => x.id === motion.id) !== -1 ? 'tabled' : '')}>
              <div>{motion.name}</div>
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
                <div><i className="fas fa-fw fa-handshake mr-1" style={{color: 'crimson'}}></i>{motion.costToTable}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: any) => {
  return {
    phase: state.phases[state.currentPhase || 0],
    phases: state.phases,
    motionsTabled: state.motionsTabled,
    motionVotes: state.motionVotes,
    currentPhaseCountdown: state.currentPhaseCountdown,
    currentPhase: state.currentPhase,
    screen: state.screen,
    availableMotions: state.availableMotions
  }
};

export default connect(
  mapStateToProps
)(Game);


const politicians: Politician[] = [
  {
    id: 0,
    name: 'Ananth',
    positions: [
      {
        stat: 'faith',
        attitude: 'raise',
        passion: 50
      },
      {
        stat: 'vigilance',
        attitude: 'lower',
        passion: 50
      }
    ]
  },
  {
    id: 1,
    name: 'Guy 1',
    positions: [
      {
        stat: 'education',
        attitude: 'raise',
        passion: 50
      },
      {
        stat: 'faith',
        attitude: 'lower',
        passion: 50
      }
    ]
  },
  {
    id: 2,
    name: 'Guy 2',
    positions: [
      {
        stat: 'vigilance',
        attitude: 'raise',
        passion: 50
      },
      {
        stat: 'joy',
        attitude: 'lower',
        passion: 50
      }
    ]
  },
  {
    id: 3,
    name: 'Guy 3',
    positions: [
      {
        stat: 'education',
        attitude: 'lower',
        passion: 50
      },
      {
        stat: 'vigilance',
        attitude: 'raise',
        passion: 50
      }
    ]
  },
  {
    id: 4,
    name: 'Guy 4',
    positions: [
      {
        stat: 'vigilance',
        attitude: 'lower',
        passion: 50
      },
      {
        stat: 'faith',
        attitude: 'raise',
        passion: 50
      }
    ]
  },
  {
    id: 5,
    name: 'Guy 5',
    positions: [
      {
        stat: 'faith',
        attitude: 'lower',
        passion: 50
      },
      {
        stat: 'joy',
        attitude: 'raise',
        passion: 50
      }
    ]
  },
  {
    id: 6,
    name: 'Guy 6',
    positions: [
      {
        stat: 'joy',
        attitude: 'lower',
        passion: 50
      },
      {
        stat: 'education',
        attitude: 'raise',
        passion: 50
      }
    ]
  }
].map(x => ({...x, capital: 100}));

const stats: {[id: string]: any} = {
  faith: {
    label: 'Purpose',
    icon: 'pray',
    color: 'silver'
  },
  joy: {
    label: 'Pleasure',
    icon: 'glass-cheers',
    color: 'darkorange'
  },
  education: {
    label: 'Education',
    icon: 'book',
    color: 'cadetblue'
  },
  vigilance: {
    label: 'Vigilance',
    icon: 'shield-alt',
    color: 'blue'
  }
}
