import React from 'react';
import { connect } from 'react-redux'
import { interval, timer } from 'rxjs';
import { changeCurrentPhase, changeCurrentPhaseCountdown, refreshAvailableMotions, tableMotion, rescindMotion, updateActors, loadActors, changeVote, passMotion, changeVotes } from './actionCreators';
import { Actor } from './actor.model';
import { Motion } from './reducers';
import { MotionInfo } from './MotionInfo';
import { Stat } from './Stat';

// Current Phase: {this.props.phase.name} ({this.props.phase.countdown - currentPhaseCountdown}s) {currentPhaseCountdown}

class Game extends React.Component {
  props: any;

  constructor(props: any) {
    super(props);
    props.dispatch(loadActors(actors));
    window.requestAnimationFrame(() => {
      this.returnToTablePhase();
    });

    interval(1000).subscribe(x => {
      this.onTick();
    });
  }

  returnToTablePhase = () => {
    this.grantAllowance();
    this.props.dispatch(refreshAvailableMotions());
    timer(5000).subscribe(() => {
      console.log('checking table preference');
      this.props?.actors.filter((x: Actor) => x.id !== this.props.player.id).forEach((actor: Actor) => {
        this.props.availableMotions.forEach((motion: Motion) => {
          const approval = this.getActorApproval(actor, motion);
          if (approval > 2.5) {
            this.table(motion.id, actor.id);
          }
        });
      });
    });
  }

  grantAllowance = () => {
    this.props.dispatch(updateActors((this.props.actors||[]).map((x: Actor) => ({id: x.id, changes: {capital: x.capital + 100}}))));
  }

  getVote(motionId: number, actorId: number) {
    return this.props.motionVotes.find((x: any) => x.id === motionId)?.voters?.find((x: any) => x.id === actorId);
  }

  onTick = () => {
    if (this.props.currentPhaseCountdown >= this.props.phase?.countdown) {
      this.advancePhase();
    } else {
      this.props.dispatch(changeCurrentPhaseCountdown(this.props.currentPhaseCountdown + 1));
    }
  }

  advancePhase = () => {
    const currentPhase = this.props.phase;
    if (currentPhase?.name === 'table' && !this.props.motionsTabled.length) {
      this.props.dispatch(changeCurrentPhaseCountdown(0));
      this.returnToTablePhase();
      return;
    }
    if (currentPhase?.name === 'vote') {
      this.props.availableMotions
        .filter((motion: Motion) => this.isTabled(motion.id))
        .forEach((motion: Motion) => {
          const yea = this.props.actors
            ?.reduce((acc: any, curr: any) => acc + (this.getVote(motion.id, curr.id)?.vote === 'yea' ? 1 : 0), 0) || 0;
          const nay = this.props.actors
            ?.reduce((acc: any, curr: any) => acc + (this.getVote(motion.id, curr.id)?.vote === 'nay' ? 1 : 0), 0) || 0;
          console.log(`Vote for ${motion.name}: ${yea} Yea, ${nay} Nay`);
          if (yea > nay) {
            this.props.dispatch(passMotion(motion));
          }
        });
      this.returnToTablePhase();
    }

    this.props.dispatch(changeCurrentPhase((this.props.currentPhase + 1) % this.props.phases.length));

    const newPhase = this.props.phase;
    if (newPhase?.name === 'table') {
      this.returnToTablePhase();
    }
    if (newPhase?.name === 'vote') {
      this.actorsVote();
    }
  }

  getActorApproval = (actor: Actor, motion: Motion) => {
    let approval = 0;
    actor.positions.forEach(position => {
      const effect = motion.effects.find(x => x.stat === position.stat);
      approval += (effect?.amount || 0) * (position.attitude === 'raise' ? 1 : -1) * (position.passion / 100)
    });
    return approval;
  }

  actorsVote = () => {
    let changes: any[] = [];
    this.props?.actors.filter((x: Actor) => x.id !== this.props.player.id).forEach((actor: Actor) => {
      this.props?.availableMotions
        .filter((motion: Motion) => !!this.props.motionsTabled.find((x: any) => x.id === motion.id))
        .forEach((motion: Motion) => {
          let approval = this.getActorApproval(actor, motion);
          changes.push({
            actorId: actor.id,
            motionId: motion.id,
            vote: approval > 0 ? 'yea' : approval < 0 ? 'nay' : 'abstain',
            reason: 'freely'
          });
        });
    });
    this.props.dispatch(changeVotes(changes));
  }

  table = (motionId: number, actorId = 0) => {
    const motion = this.props.availableMotions.find((x: any) => x.id === motionId);
    const tabled = this.props.motionsTabled.find((x: any) => x.id === motionId);
    const actor = this.props.actors.find((x: Actor) => x.id === actorId);
    if (!tabled && actor.capital >= motion.costToTable) {
      this.props.dispatch(tableMotion(motionId, actor.id));
      this.props.dispatch(changeVote({actorId: actor.id, motionId: motionId, vote: 'yea', reason: 'freely'}));
      this.props.dispatch(updateActors([{id: actor.id, changes: {capital: actor.capital - motion.costToTable}}]));
    } else if (!!tabled && tabled.tabledBy === actor.id) {
      this.props.dispatch(rescindMotion(motionId));
      this.props.dispatch(changeVote({actorId: actor.id, motionId: motionId, vote: 'abstain', reason: 'freely'}));
      this.props.dispatch(updateActors([{id: actor.id, changes: {capital: actor.capital + motion.costToTable}}]));
    }
  };

  vote = (motionId: number, actorId = 0) => {
    const actor = this.props.actors.find((x: any) => x.id === actorId);
    const vote = this.getVote(motionId, actorId);
    this.props.dispatch(changeVote({actorId: actor.id, motionId: motionId, vote: vote?.vote === 'yea' ? 'abstain' : 'yea', reason: 'freely'}));
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
        <h2>Profile</h2>
        <div>
          <ul>
            {Object.keys(this.props.currentSettlement?.derived?.profile).map(x => <li key={x}><i className={'fas fa-fw mr-1 fa-' + stats[x]?.icon}></i> {this.props.currentSettlement?.derived?.profile[x]}</li>)}
          </ul>
        </div>

        <h2 className="mt-5">Politics</h2>
        <div>
          Current Phase: {this.props.phase?.name} ({this.props.phase?.countdown - this.props.currentPhaseCountdown}s)
        </div>
      </div>
      <div className="row">
        <div className="col">
          {this.props.actors.map((x: any, i: number) => (
            <div className="mb-3" key={i}>
              <div className="d-flex align-items-center">
                <div className="w-25">{i+1}. {x.name}</div>
                <div><Stat stat='capital' value={x.capital}></Stat></div>
              </div>
              {x.positions.map((position: any, ii: number) => (
                <Stat stat={position.stat} color={position.attitude !== 'raise' ? 'crimson' : 'initial'}></Stat>
              ))}
            </div>
          ))}
        </div>
        <div className="col">
          {this.props.availableMotions.filter((motion: any) => this.props.phase?.name === 'table' || this.isTabled(motion.id)).map((motion: any, i: number) => (
            <button
                onClick={() => this.phaseFunc[this.props.phase.name]?.(motion.id)} key={i}
                disabled={this.props.phase?.name !== 'table' && !this.props.motionsTabled.find((x: any) => x.id === motion.id)}
                className={"text-left btn btn-light d-block mb-2 w-100" + (
                  this.props.phase?.name === 'table' && this.props.motionsTabled.findIndex((x: any) => x.id === motion.id) !== -1 ? ' tabled' : ''
                ) + (
                  this.props.phase?.name === 'vote' && this.getVote(motion.id, this.props.player.id)?.vote === 'yea' ? ' tabled' : ''
                )}>
              <MotionInfo
                motion={motion}
                mode={this.props.phase?.name}
                tabledBy={this.getActor(this.props.motionsTabled.find((x: any) => x.id === motion.id)?.tabledBy)}>
                {this.props.phase?.name !== 'table' ?
                  <span>
                    Yea: {this.props.actors
                      ?.reduce((acc: any, curr: any) => acc + (this.getVote(motion.id, curr.id)?.vote === 'yea' ? 1 : 0), 0) || 0}
                    &nbsp;
                    Nay: {this.props.actors
                      ?.reduce((acc: any, curr: any) => acc + (this.getVote(motion.id, curr.id)?.vote === 'nay' ? 1 : 0), 0) || 0}
                  </span>
                :
                  <Stat stat='capital' value={motion.costToTable}></Stat>
                }
              </MotionInfo>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: any) => {
  const settlement = state.settlementData[0];
  const profile: {[id: string]: number} = {faith: 0, joy: 0, vigilance: 0, education: 0};
  settlement.edicts.forEach((motion: Motion) => {
    motion.effects.forEach(effect => {
      profile[effect.stat] = profile[effect.stat] || 0;
      profile[effect.stat] += effect.amount;
    });
  });

  return {
    phase: state.phases[state.currentPhase || 0],
    phases: state.phases,
    currentSettlement: {...settlement, derived: {profile: profile}},
    actors: state.actors,
    player: state.actors.find((x: any) => x.id === 0),
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

export const stats: {[id: string]: any} = {
  faith: {
    label: 'Purpose',
    icon: 'praying-hands',
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
  },
  capital: {
    label: 'Capital',
    icon: 'handshake',
    color: 'crimson'
  }
}
