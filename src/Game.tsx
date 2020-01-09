import React from 'react';
import { connect } from 'react-redux'
import { interval } from 'rxjs';
import { changeCurrentPhase, changeCurrentPhaseCountdown, refreshAvailableMotions } from './actionCreators';

interface Politician {
  name: string;
  positions: PoliticalPosition[];
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
      if (this.props.currentPhase?.name === 'table') {
        this.props.dispatch(refreshAvailableMotions());
      }
    } else {
      this.props.dispatch(changeCurrentPhaseCountdown(this.props.currentPhaseCountdown + 1));
    }
  }

  render = () => (
    <div className="p-5">
      <div className="mb-4">
        Current Phase: {this.props.phase?.name} ({this.props.phase?.countdown - this.props.currentPhaseCountdown}s)
      </div>
      <div className="row">
        <div className="col">
          {politicians.map((x, i) => (
            <div className="mb-2" key={i}>
              <div>{i+1}. {x.name}</div>
              {x.positions.map((position, ii) => (
                <i style={{color: position.attitude !== 'raise' ? 'crimson' : 'initial'}} key={ii} className={'fas fa-fw fa-' + stats[position.stat]?.icon || 'star'}></i>
              ))}
            </div>
          ))}
        </div>
        <div className="col">
          {this.props.availableMotions.map((motion: any, i: number) => (
            <button key={i} className="text-left d-block mb-2 w-100">
              <div>{motion.name}</div>
              {motion.effects.map((effect: any, ii: number) => (
                <span key={ii} className="d-inline-block" style={{width: '50px', color: effect.amount <= 0 ? 'crimson' : 'initial'}}>
                  <i className={'fas fa-fw fa-' + stats[effect.stat]?.icon || 'star'}></i>
                  {effect.amount}
                  &nbsp;
                </span>
              ))}
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
];

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
