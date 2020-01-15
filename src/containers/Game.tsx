import React from 'react';
import { connect, ConnectedProps } from 'react-redux'
import { interval, timer, Subscription } from 'rxjs';
import { changeCurrentPhase, changeCurrentPhaseCountdown, refreshAvailableMotions, tableMotion, rescindMotion, updateActors, changeVote, passMotion, changeVotes, loadActorsWithDefaultState, setOffers, inspectMotion, addAlert, addOffers } from '../store/actionCreators';
import { actors, ActorWithState, ActorWithStateAndOffices, returnActorWithStateAndOffices } from '../models/actor.model';
import { State } from '../store/reducers';
import { Motion } from '../models/motion.model';
import { getActorApproval, getActorsWithApproval, getDesiredOffers, getPassedMotions, checkIfFullyTallied } from '../helpers/politics.helpers';
import { getById } from '../helpers/entity.helpers';
import { Vote } from '../models/vote.model';
import { calculateActorCapitalWithAllowance } from '../helpers/actor.helpers';
import SettlementView from './SettlementView';
import { Navbar } from '../components/Navbar';
import { PHASES, Phase } from '../models/phase.model';

// Current Phase: {this.props.phase.name} ({this.props.phase.countdown - currentPhaseCountdown}s) {currentPhaseCountdown}

class Game extends React.Component {
  // @ts-ignore;
  props: Props;
  subscriptions: Subscription[] = [];

  constructor(props: any) {
    super(props);
    props.dispatch(loadActorsWithDefaultState(actors));
    window.requestAnimationFrame(() => {
      this.returnToTablePhase(false);
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
      this.props.dispatch(tableMotion(motionId, actor.id, this.props.settlement.id));
      this.props.dispatch(changeVote({actorId: actor.id, motionId: motionId, vote: 'yea', reason: 'freely'}, this.props.settlement.id));
      this.props.dispatch(updateActors([{id: actor.id, changes: {capital: actor.state.capital - motion.costToTable}}]));
    } else if (!!tabled && actor.id === this.props.player.id && tabled.tabledBy === actor.id) {
      this.props.dispatch(rescindMotion(motionId, this.props.settlement.id));
      this.props.dispatch(changeVote({actorId: actor.id, motionId: motionId, vote: 'abstain', reason: 'freely'}, this.props.settlement.id));
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

  getOffers = (motion: Motion, vote: string) => {
    return this.props.currentVoteOffers['player']
      ?.filter(x => x.motionId === motion.id && x.vote === vote)
      .sort((a, b) => (a.purchaseAgreement?.amountSpent || 0) > (b.purchaseAgreement?.amountSpent || 0) ? -1 : 1);
  }

  onTick = () => {
    if (this.props.currentPhaseCountdown >= this.props.phase?.countdown - 1) {
      this.advancePhase();
    } else {
      this.props.dispatch(changeCurrentPhaseCountdown(this.props.currentPhaseCountdown + 1, this.props.settlement.id));
    }
  }

  advancePhase = () => {
    let newPhase: Phase | undefined;
    const currentPhase = this.props.phase;
    let isRepeatingTablePhase = false;
    switch (currentPhase?.id) {
      case 'table':
        if (this.props.motionsTabled.length < 5) {
          newPhase = PHASES.TABLE;
          isRepeatingTablePhase = true;
        } else {
          newPhase = {...PHASES.VOTE, countdown: 15 + this.props.motionsTabled.length * 15};
        }
        break;
      case 'vote':
        this.handleResults();
        newPhase = PHASES.RESULTS;
        break;
      case 'results':
        newPhase = PHASES.TABLE;
        break;
    }

    if (!!newPhase) {
      this.props.dispatch(changeCurrentPhase(newPhase, this.props.settlement.id));
    }

    this.subscriptions.forEach(x => {
      x.unsubscribe();
    });
    this.subscriptions = [];

    if (newPhase?.id === PHASES.TABLE.id) {
      this.returnToTablePhase(isRepeatingTablePhase);
    }
    if (newPhase?.id === PHASES.VOTE.id) {
      const voteTime = this.props.phase.countdown * 1000 * 0.4;
      const makeOfferTime = this.props.phase.countdown * 1000 * 0.2;
      this.subscriptions.push(
        timer(100).subscribe(() => {
          console.log('makeOffer!');
          this.npcsMakeOffers(makeOfferTime);
          timer(makeOfferTime).subscribe(() => {
            this.npcsVote(voteTime);
          });
        })
      );
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
          this.props.dispatch(passMotion(motion, this.props.settlement.id));
          if (!!motion.tabledBy) {
            const actor = this.props.actors.find(x => x.id === motion.tabledBy);
            console.log(`${actor?.name} received ${motion.rewardForPassing} as a reward for passing ${motion.name}`);
            this.props.dispatch(updateActors([{id: motion.tabledBy, changes: {capital: (actor?.state?.capital||0) + motion.rewardForPassing}}]));
          }
        }
      });
  };

  returnToTablePhase = (repeat: boolean) => {
    this.grantAllowance();
    this.props.dispatch(refreshAvailableMotions(repeat, this.props.settlement.id));
    this.subscriptions.push(
      timer(this.props.phase.countdown * 0.25 * 1000).subscribe(() => {
        const actors = this.props?.actors.filter(x => x.id !== this.props.player.id);
        this.props.availableMotions.forEach((motion: Motion) => {
          actors.forEach((actor, i) => {
            timer(Math.random() * (this.props.phase.countdown * 0.75 * 1000)).subscribe(() => {
              const approval = getActorApproval(actor, motion);
              if (approval > 1 + (motion.costToTable / 100)) {
                this.table(motion.id, actor.id);
              }
            });
          })
        });
      })
    );
  }

  getTabledMotions = () => {
    return this.props?.availableMotions
      .map(motion => ({...motion, tabledBy: getById(this.props.motionsTabled, motion.id)?.tabledBy}))
      .filter(motion => !!motion.tabledBy);
  };

  componentDidUpdate = (props: any) => {
    if (this.props.phase?.id === PHASES.VOTE.id && checkIfFullyTallied(this.props.motionVotes, this.props.actors)) {
      this.advancePhase();
    }
    // this.props.dispatch(changeCurrentPhaseCountdown(Math.min(this.props.currentPhaseCountdown, 3), this.props.settlement.id));
  }

  npcsVote = (duration: number) => {
    this.getTabledMotions().forEach(motion => {
      const actors = getActorsWithApproval(this.props?.actors, motion)
      actors
        .filter(x => x.voteWeight > 0 && x.id !== this.props.player.id)
        .forEach((actor, i) => {
          this.subscriptions.push(
            timer(Math.random() * duration).subscribe(() => {
              const personalOffers = (this.props.currentVoteOffers[actor.id]||[])
                .filter(offer => offer.motionId === motion.id)
                .shuffle()
                .sort((a, b) => (a.purchaseAgreement?.amountSpent||0) > (b.purchaseAgreement?.amountSpent||0) ? -1 : 1) || [];
              const topOffer = personalOffers.length > 0 ? personalOffers[0] : null;
              if (!!topOffer) {
                this.props.dispatch(changeVote(topOffer, this.props.settlement.id));
                const purchaser = this.props.actors.find(x => x.id === topOffer.purchaseAgreement?.purchasedBy);
                const amountSpent = topOffer.purchaseAgreement?.amountSpent || 0;
                console.log(`${actor.name} agreed to vote ${topOffer.vote} on ${motion.name} for ${purchaser?.name} in exchange for ${amountSpent}`);
              }
              else {
                this.props.dispatch(changeVote({
                  actorId: actor.id,
                  motionId: motion.id,
                  vote: actor.position,
                  reason: 'freely'
                }, this.props.settlement.id));
              }
            })
          );
        });
    });
  }

  npcsMakeOffers = (duration: number) => {
    console.log('make offers');
    this.getTabledMotions().forEach(motion => {
      // This is all the AI actors who are passionately involved and willing to make offers
      const actors = getActorsWithApproval(this.props?.actors, motion)
      actors
        .filter(x => x.id !== this.props.player.id && Math.abs(x.approval) > 3)
        .reverse()
        .forEach(actor => {
          const desiredOffers = getDesiredOffers(actor, motion, actors, this.props.motionVotes[motion.id] || {}, this.props.currentVoteOffers);
          if (desiredOffers.length > 0) {
            this.props.dispatch(addOffers(desiredOffers, this.props.settlement.id));
          }
        });
    });
  }

  render = () => (
    <div>
      <Navbar player={this.props.player}></Navbar>
      <div onClick={() => {this.props.dispatch(inspectMotion(''))}} className={"fade--full" + (this.props.inspectedMotion !== '' ? ' active' : '')}></div>
      <div className="bg-dark shadow">
        <div className="container px-4">
          <ul className="d-flex py-3 pt-4 m-0">
            {this.props.settlements.map(settlement => (
              <li key={settlement.id} className="mr-10 d-block">
                <div className="rounded-circle text-light">
                  <a>{settlement.name}</a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="p-4 container bg-light">
        <div>
          {false && this.props?.notifications.map((x, i) => (
            <div className={`alert alert-${x.type}`}>{x.text}</div>
          ))}
        </div>

        {!!this.props.settlement && <SettlementView settlement={this.props.settlement}></SettlementView>}
      </div>
    </div>
  );
}

const mapStateToProps = (state: State) => {
  const settlements = state.settlements.map(x => ({...x, state: state.saveData.settlementState[x.id]}));
  const settlement = settlements[0];

  const actors: ActorWithStateAndOffices[] = state.actors
    .map(x => ({...returnActorWithStateAndOffices(x, state.saveData.actorState[x.id], settlement)}))
    .sort((a, b) => Math.max(...a.offices.map(x => x.softCapitalCap)) > Math.max(...b.offices.map(x => x.softCapitalCap)) ? -1 : 1);

  return {
    phase: settlement.state.currentPhase,
    actors: actors,
    player: actors.find((x: any) => x.id === 'player') || actors[0],
    motionsTabled: settlement.state.motionsTabled,
    motionVotes: settlement.state.motionVotes,
    settlement: settlement,
    currentVoteOffers: settlement.state.currentVoteOffers,
    currentPhaseCountdown: settlement.state.currentPhaseCountdown,
    currentPhase: settlement.state.currentPhase,
    inspectedMotion: state.saveData.inspectedMotion,
    policies: state.policies,
    settlements: state.settlements,
    notifications: state.saveData.notifications,
    screen: state.screen,
    availableMotions: settlement.state.availableMotions
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
