import React from 'react';
import { connect } from 'react-redux'
import { interval } from 'rxjs';
import { changeCurrentPhase, changeCurrentPhaseCountdown, refreshAvailableMotions, tableMotion, rescindMotion, updateActors, loadActors } from './actionCreators';
import { Actor } from './actor.model';

// Current Phase: {this.props.phase.name} ({this.props.phase.countdown - currentPhaseCountdown}s) {currentPhaseCountdown}

class Game extends React.Component {
  props: any;

  componentDidMount = () => {
    this.props.dispatch(loadActors(actors));
    this.returnToTablePhase();

    interval(1000).subscribe(x => {
      this.onTick();
    });
  }

  returnToTablePhase = () => {
    this.props.dispatch(updateActors((this.props.actors||[]).map((x: Actor) => ({id: x.id, changes: {capital: x.capital + 100}}))));
    this.props.dispatch(refreshAvailableMotions());
  }

  onTick = () => {
    if (this.props.currentPhaseCountdown >= this.props.phase?.countdown) {
      if (this.props.phase?.name === 'table' && !this.props.motionsTabled.length) {
        this.props.dispatch(changeCurrentPhaseCountdown(0));
        this.returnToTablePhase();
        return;
      }
      this.props.dispatch(changeCurrentPhase((this.props.currentPhase + 1) % this.props.phases.length));
      if (this.props.phase?.name === 'table') {
        this.returnToTablePhase();
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

  getActor = (id: number) => {
    return actors.find(x => x.id === id);
  }

  isTabled = (id: number) => {
    return !!this.props.motionsTabled.find((x: any) => x.id === id)
  }

  phaseFunc: {[id: string]: (motionid: number) => void} = {table: this.table, vote: this.vote};

  render = () => (
    <div className="p-5">
      <div className="mb-4">
        Current Phase: {this.props.phase?.name} ({this.props.phase?.countdown - this.props.currentPhaseCountdown}s)
      </div>
      <div className="row">
        <div className="col">
          {this.props.actors.map((x: any, i: number) => (
            <div className="border-top py-1" key={i}>
              <div className="d-flex align-items-center">
                <div className="w-25">{i+1}. {x.name}</div>
                <div><i className="fas fa-fw fa-handshake mr-1" style={{color: 'crimson'}}></i>{x.capital}</div>
              </div>
              {x.positions.map((position: any, ii: number) => (
                <i style={{color: position.attitude !== 'raise' ? 'crimson' : 'initial'}} key={ii} className={'fas fa-fw fa-' + stats[position.stat]?.icon || 'star'}></i>
              ))}
            </div>
          ))}
        </div>
        <div className="col">
          {this.props.availableMotions.filter((motion: any) => this.props.phase?.name === 'table' || this.isTabled(motion.id)).map((motion: any, i: number) => (
            <button
                onClick={() => this.phaseFunc[this.props.phase.name] ? this.phaseFunc[this.props.phase.name](motion.id) : null} key={i}
                disabled={this.props.phase?.name !== 'table' && !this.props.motionsTabled.find((x: any) => x.id === motion.id)}
                className={"text-left btn btn-light d-block mb-2 w-100 " + (this.props.phase?.name === 'table' && this.props.motionsTabled.findIndex((x: any) => x.id === motion.id) !== -1 ? 'tabled' : '')}>
              <div>
                {motion.name}
                {this.isTabled(motion.id) ? (' - Tabled by ' + this.getActor(this.props.motionsTabled.find((x: any) => x.id === motion.id)?.tabledBy)?.name) : ''}
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
    actors: state.actors,
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


let actors: Actor[] = [
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
].map(x => ({...x, capital: 0}));

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
