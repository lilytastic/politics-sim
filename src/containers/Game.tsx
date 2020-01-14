import React from 'react';
import { connect, ConnectedProps } from 'react-redux'
import { interval, timer } from 'rxjs';
import { changeCurrentPhase, changeCurrentPhaseCountdown, refreshAvailableMotions, tableMotion, rescindMotion, updateActors, changeVote, passMotion, changeVotes, loadActorsWithDefaultState, setOffers, inspectMotion, addAlert, addOffers } from '../store/actionCreators';
import { actors, ActorWithState, ActorWithStateAndOffices, returnActorWithStateAndOffices } from '../models/actor.model';
import { State } from '../store/reducers';
import { Motion } from '../models/motion.model';
import { getActorApproval, getActorsWithApproval, getDesiredOffers, getPassedMotions } from '../helpers/politics.helpers';
import { getById } from '../helpers/entity.helpers';
import { SettlementProfile } from './SettlementProfile';
import SettlementCircle from './SettlementCircle';
import SettlementMotions from './SettlementMotions';
import { Vote } from '../models/vote.model';
import CurrentPhase from './CurrentPhase';
import { calculateActorCapitalWithAllowance } from '../helpers/actor.helpers';
import SettlementView from './SettlementView';
import { StatIcon } from '../components/StatIcon';

// Current Phase: {this.props.phase.name} ({this.props.phase.countdown - currentPhaseCountdown}s) {currentPhaseCountdown}

class Game extends React.Component {
  // @ts-ignore;
  props: Props;

  constructor(props: any) {
    super(props);
    props.dispatch(loadActorsWithDefaultState(actors));
    window.requestAnimationFrame(() => {
      this.returnToTablePhase();
    });

    interval(1000).subscribe(x => {
      this.onTick();
    });
  }

  table = (motionId: string, actorId: string) => {
    const motion = this.props.availableMotions.find((x: any) => x.id === motionId);
    const tabled = this.props.motionsTabled.find((x: any) => x.id === motionId);
    const actor = this.props.actors.find((x: ActorWithState) => x.id === actorId);
    if (!actor || !motion) {
      return;
    }
    if (!tabled && actor.state.capital >= motion.costToTable) {
      this.props.dispatch(tableMotion(motionId, actor.id));
      this.props.dispatch(changeVote({actorId: actor.id, motionId: motionId, vote: 'yea', reason: 'freely'}));
      this.props.dispatch(updateActors([{id: actor.id, changes: {capital: actor.state.capital - motion.costToTable}}]));
    } else if (!!tabled && actor.id === this.props.player.id && tabled.tabledBy === actor.id) {
      this.props.dispatch(rescindMotion(motionId));
      this.props.dispatch(changeVote({actorId: actor.id, motionId: motionId, vote: 'abstain', reason: 'freely'}));
      this.props.dispatch(updateActors([{id: actor.id, changes: {capital: actor.state.capital + motion.costToTable}}]));
    }
  };

  grantAllowance = () => {
    const actorsWithNewCapital = (this.props.actors||[]).map(actor => ({id: actor.id, changes: {capital: calculateActorCapitalWithAllowance(actor)}}));
    this.props.dispatch(updateActors(actorsWithNewCapital));
  }

  getVote(motionId: string, actorId: string): Vote {
    return {actorId, motionId, ...this.props.motionVotes[motionId]?.[actorId]};
  }

  onTick = () => {
    if (this.props.currentPhaseCountdown >= this.props.phase?.countdown - 1) {
      this.advancePhase();
    } else {
      this.props.dispatch(changeCurrentPhaseCountdown(this.props.currentPhaseCountdown + 1));
    }
  }

  getOffers = (motion: Motion, vote: string) => {
    return this.props.currentVoteOffers['player']
      ?.filter(x => x.motionId === motion.id && x.vote === vote)
      .sort((a, b) => (a.purchaseAgreement?.amountSpent || 0) > (b.purchaseAgreement?.amountSpent || 0) ? -1 : 1);
  }

  advancePhase = () => {
    const currentPhase = this.props.phase;
    switch (currentPhase?.id) {
      case 'table':
        if (!this.props.motionsTabled.length) {
          this.props.dispatch(changeCurrentPhaseCountdown(0));
        }
        break;
      case 'vote':
        this.handleResults();
        break;
    }
    this.props.dispatch(changeCurrentPhase((this.props.currentPhase + 1) % this.props.phases.length));

    const newPhase = this.props.phase;
    if (newPhase?.id === 'table') {
      this.returnToTablePhase();
    }
    if (newPhase?.id === 'vote') {
      this.actorsVote();
    }
  }

  handleResults = () => {
    this.props.availableMotions
      .filter((motion: Motion) => !!getById(this.props.motionsTabled, motion.id))
      .forEach((motion: Motion) => {
        const votes: Vote[] = this.props.actors?.reduce((acc: Vote[], curr) => ([...acc, this.getVote(motion.id, curr.id)]), []);

        votes.forEach(vote => {
          if (!!vote.purchaseAgreement) {
            const purchaser = vote.purchaseAgreement.purchasedBy;
            const amountSpent = vote.purchaseAgreement.amountSpent;
            this.props.dispatch(updateActors([{id: purchaser, changes: {capital: (this.props.actors.find(x => x.id === purchaser)?.state?.capital||0) - amountSpent}}]));
            this.props.dispatch(updateActors([{id: vote.actorId, changes: {capital: (this.props.actors.find(x => x.id === vote.actorId)?.state?.capital||0) + amountSpent}}]));
          }
          if (vote.actorId === this.props.player.id) {
            const offer = this.getOffers(motion, vote.vote)?.[0];
            if (!!offer?.purchaseAgreement) {
              const amountSpent = offer.purchaseAgreement.amountSpent || 0;
              const purchaser = offer.purchaseAgreement.purchasedBy || '';
              this.props.dispatch(updateActors([{id: purchaser, changes: {capital: (this.props.actors.find(x => x.id === purchaser)?.state?.capital||0) - amountSpent}}]));
              this.props.dispatch(updateActors([{id: vote.actorId, changes: {capital: (this.props.actors.find(x => x.id === vote.actorId)?.state?.capital||0) + amountSpent}}]));
            }
          }
        });
      });

    getPassedMotions(this.props?.motionVotes, this.props?.actors)
      .map(x => this.props?.availableMotions.find(y => y.id === x))
      .filter(x => !!x)
      .map(motion => (motion ? {...motion, tabledBy: this.props.motionsTabled.find(x => x.id == motion.id)?.tabledBy} : undefined))
      .forEach(motion => {
        if (!!motion) {
          this.props.dispatch(passMotion(motion));
          if (!!motion.tabledBy) {
            const actor = this.props.actors.find(x => x.id === motion.tabledBy);
            console.log(`${actor?.name} received ${motion.rewardForPassing} as a reward for passing ${motion.name}`);
            this.props.dispatch(updateActors([{id: motion.tabledBy, changes: {capital: (actor?.state?.capital||0) + motion.rewardForPassing}}]));
          }
        }
      });
  };

  returnToTablePhase = () => {
    this.grantAllowance();
    this.props.dispatch(refreshAvailableMotions());
    timer(5000).subscribe(() => {
      const actors = this.props?.actors.filter(x => x.id !== this.props.player.id);
      this.props.availableMotions.forEach((motion: Motion) => {
        actors.forEach((actor, i) => {
          timer(Math.random() * 15000).subscribe(() => {
            const approval = getActorApproval(actor, motion);
            if (approval > 2.5) {
              this.table(motion.id, actor.id);
            }
          });
        })
      });
    });
  }

  getTabledMotions = () => {
    return this.props?.availableMotions
      .map(motion => ({...motion, tabledBy: getById(this.props.motionsTabled, motion.id)?.tabledBy}))
      .filter(motion => !!motion.tabledBy);
  };

  actorsVote = () => {
    timer(5000).subscribe(() => {
      this.npcsVote(20000);
      timer(20000).subscribe(() => {
        this.npcsMakeOffers(30000);
        timer(30000).subscribe(() => {
          this.npcsConsiderOffers(30000);
        });
      });
    });
  }

  npcsVote = (duration: number) => {
    this.getTabledMotions().forEach(motion => {
      getActorsWithApproval(this.props?.actors, motion)
        .filter(x => x.voteWeight > 0 && x.id !== this.props.player.id)
        .forEach((actor, i) => {
          timer(Math.random() * duration).subscribe(() => {
            this.props.dispatch(changeVote({
              actorId: actor.id,
              motionId: motion.id,
              vote: actor.position,
              reason: 'freely'
            }));
          });
        });
    });
  }

  npcsMakeOffers = (duration: number) => {
    this.getTabledMotions().forEach(motion => {
      // This is all the AI actors who are passionately involved and willing to make offers
      const actors = getActorsWithApproval(this.props?.actors, motion)
      actors
        .filter(x => x.id !== this.props.player.id && Math.abs(x.approval) > 3)
        .reverse()
        .forEach(actor => {
          timer(Math.random() * duration).subscribe(() => {
            const desiredOffers = getDesiredOffers(actor, motion, actors, this.props?.motionVotes[motion.id], this.props?.currentVoteOffers);
            if (desiredOffers.length > 0) {
              this.props.dispatch(addOffers(desiredOffers));
            }
          });
        });
    });
  }

  npcsConsiderOffers = (duration: number) => {
    this.getTabledMotions().forEach(motion => {
      this.props.actors
        .shuffle()
        .filter(x => this.props.player.id !== x.id && motion.tabledBy !== x.id)
        .forEach((actor, i) => {
          timer(Math.random() * duration).subscribe(() => {
            let existingVote = this.props.motionVotes[motion.id]?.[actor.id];
            if (!!existingVote?.purchaseAgreement) {
              return;
            }
            const personalOffers = (this.props.currentVoteOffers[actor.id]||[]).shuffle().sort((a, b) => (a.purchaseAgreement?.amountSpent||0) > (b.purchaseAgreement?.amountSpent||0) ? -1 : 1) || [];
            personalOffers.filter(offer => offer.motionId === motion.id).forEach(offer => {
              const purchaser = this.props.actors.find(x => x.id === offer.purchaseAgreement?.purchasedBy);
              const amountSpent = offer.purchaseAgreement?.amountSpent || 0;
              if (purchaser && purchaser.state.capital >= amountSpent && !(existingVote?.purchaseAgreement)) {
                // existingVoteIndex !== -1 ? changes[existingVoteIndex] = offer : changes.push(offer);
                this.props.dispatch(changeVote(offer));
                console.log(`${actor.name} agreed to vote ${offer.vote} on ${motion.name} for ${purchaser.name} in exchange for ${amountSpent}`);
              }
            });
          });
        });
    });
  }

  render = () => (
    <div>
      <nav className="navbar py-1 sticky-top navbar-dark bg-dark">
        <div className="container">
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
                <StatIcon stat="capital" value={this.props.player?.state.capital}></StatIcon>
              </span>
            </li>
          </ul>
        </div>
      </nav>
      <div className="py-3 container bg-light">
        <div>
          {false && this.props?.notifications.map((x, i) => (
            <div className={`alert alert-${x.type}`}>{x.text}</div>
          ))}
        </div>
        <div onClick={() => {this.props.dispatch(inspectMotion(''))}} className={"fade--full" + (!!this.props.availableMotions.find(x => x.id === this.props.inspectedMotion) ? ' active' : '')}></div>
        <SettlementView></SettlementView>
      </div>
    </div>
  );
}

const mapStateToProps = (state: State) => {
  const settlement = state.settlements.map(x => ({...x, state: state.saveData.settlementState[x.id]}))[0];

  const actors: ActorWithStateAndOffices[] = state.actors
    .map(x => ({...returnActorWithStateAndOffices(x, state.saveData.actorState[x.id], settlement)}))
    .sort((a, b) => Math.max(...a.offices.map(x => x.softCapitalCap)) > Math.max(...b.offices.map(x => x.softCapitalCap)) ? -1 : 1);

  return {
    phase: state.phases[state.saveData.currentPhase || 0],
    phases: state.phases,
    actors: actors,
    player: actors.find((x: any) => x.id === 'player') || actors[0],
    motionsTabled: state.saveData.motionsTabled,
    motionVotes: state.saveData.motionVotes,
    currentVoteOffers: state.saveData.currentVoteOffers,
    currentPhaseCountdown: state.saveData.currentPhaseCountdown,
    currentPhase: state.saveData.currentPhase,
    inspectedMotion: state.saveData.inspectedMotion,
    policies: state.policies,
    notifications: state.saveData.notifications,
    screen: state.screen,
    availableMotions: state.saveData.availableMotions
  }
};

const connector = connect(
  mapStateToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>
type Props = PropsFromRedux & {
  backgroundColor: string
}

export default connector(Game);
