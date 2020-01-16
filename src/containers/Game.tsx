import React from 'react';
import { connect, ConnectedProps } from 'react-redux'
import { interval, timer, Subscription } from 'rxjs';
import { changeCurrentPhase, changeCurrentPhaseCountdown, resetVoting, refreshAvailableMotions, tableMotion, rescindMotion, updateActors, changeVote, passMotion, changeVotes, loadActorsWithDefaultState, setOffers, inspectMotion, addAlert, addOffers, changeCapital, travelToSettlement, incrementAllPhaseCountdowns } from '../store/actionCreators';
import { actors, ActorWithState, ActorWithStateAndOffices, returnActorWithStateAndOffices, returnActorWithState } from '../models/actor.model';
import { State } from '../store/reducers';
import { Motion } from '../models/motion.model';
import { getActorApproval, getActorsWithApproval, getDesiredOffers, getPassedMotions, checkIfFullyTallied } from '../helpers/politics.helpers';
import { getById } from '../helpers/entity.helpers';
import { Vote, VoteData } from '../models/vote.model';
import { calculateActorCapitalWithAllowance } from '../helpers/actor.helpers';
import SettlementView from './SettlementView';
import { Navbar } from '../components/Navbar';
import { PHASES, Phase } from '../models/phase.model';
import { SettlementWithState } from '../models/settlement.model';

// Current Phase: {this.props.phase.name} ({this.props.phase.countdown - currentPhaseCountdown}s) {currentPhaseCountdown}

class Game extends React.Component {
  // @ts-ignore;
  props: Props;
  subscriptions: Subscription[] = [];

  constructor(props: any) {
    super(props);
    props.dispatch(loadActorsWithDefaultState(actors));
    window.requestAnimationFrame(() => {
      this.props.settlements.forEach(settlement => {
        this.afterAdvancePhase(settlement, settlement.state.currentPhase);
      })
    });

    interval(1000).subscribe(x => {
      this.onTick();
    });
  }

  /*
  if (this.props.phase?.id === PHASES.VOTE.id && checkIfFullyTallied(this.props.motionVotes, this.props.actors)) {
    this.subscriptions.push(
      timer(1500).subscribe(x => {
        this.advancePhase();
      })
    )
  }
  */

  table = (motionId: string, actorId: string, settlement: SettlementWithState) => {
    const motion = settlement.state.availableMotions.find((x: any) => x.id === motionId);
    const tabled = settlement.state.motionsTabled.find((x: any) => x.id === motionId);
    const actor = this.props.actors.find((x: ActorWithState) => x.id === actorId);
    if (!actor || !motion) {
      return;
    }
    if (!tabled && actor.state.capital >= motion.costToTable) {
      this.props.dispatch(tableMotion(motionId, actor.id, settlement.id));
      this.props.dispatch(changeVote({actorId: actor.id, motionId: motionId, vote: 'yea', reason: 'freely'}, settlement.id));
      this.props.dispatch(changeCapital(actor.id, -motion.costToTable))
    } else if (!!tabled && actor.id === this.props.player.id && tabled.tabledBy === actor.id) {
      this.props.dispatch(rescindMotion(motionId, settlement.id));
      this.props.dispatch(changeVote({actorId: actor.id, motionId: motionId, vote: 'abstain', reason: 'freely'}, settlement.id));
      this.props.dispatch(changeCapital(actor.id, motion.costToTable))
    }
  };

  grantAllowance = (settlement: SettlementWithState) => {
    const actorsWithNewCapital = (this.props.actors||[])
      .map(actor => ({id: actor.id, changes: {capital: calculateActorCapitalWithAllowance(returnActorWithStateAndOffices(actor, actor.state, settlement))}}));
    this.props.dispatch(updateActors(actorsWithNewCapital));
  }

  getVote(motionId: string, actorId: string, motionVotes: {[motionId: string]: {[actorId: string]: VoteData}}): Vote {
    return {actorId, motionId, ...motionVotes[motionId]?.[actorId]};
  }

  getOffers = (motion: Motion, vote: string, settlement: SettlementWithState) => {
    return settlement.state.currentVoteOffers['player']
      ?.filter(x => x.motionId === motion.id && x.vote === vote)
      .sort((a, b) => (a.purchaseAgreement?.amountSpent || 0) > (b.purchaseAgreement?.amountSpent || 0) ? -1 : 1);
  }

  onTick = () => {
    this.props.dispatch(incrementAllPhaseCountdowns(1));
    this.props.settlements.forEach(settlement => {
      if (settlement.state.currentPhaseCountdown >= settlement.state.currentPhase.countdown - 1) {
        // this.advancePhase(settlement);
      }
    });
  }

  advancePhase = (settlement: SettlementWithState) => {
    let newPhase: Phase | undefined;
    const currentPhase = settlement.state.currentPhase;
    switch (currentPhase?.id) {
      case 'table':
        if (settlement.state.motionsTabled.length < 1) {
          newPhase = {...PHASES.TABLE, isRepeat: true};
        } else {
          newPhase = {...PHASES.VOTE, countdown: 15 + settlement.state.motionsTabled.length * 15};
        }
        break;
      case 'vote':
        this.handleResults(settlement);
        newPhase = PHASES.RESULTS;
        break;
      case 'results':
        newPhase = PHASES.TABLE;
        break;
    }

    if (!!newPhase) {
      this.props.dispatch(changeCurrentPhase(newPhase, settlement.id));
    }

    this.subscriptions.forEach(x => x.unsubscribe());
    this.subscriptions = [];
    
    if (!!newPhase) {
      this.afterAdvancePhase(settlement, newPhase);
    }
  }

  afterAdvancePhase = (settlement: SettlementWithState, newPhase: Phase) => {
    if (newPhase?.id === PHASES.TABLE.id) {
      this.onReturnToTablePhase(settlement, newPhase.isRepeat);
    }
    if (newPhase?.id === PHASES.VOTE.id) {
      const voteTime = settlement.state.currentPhase.countdown * 1000 * 0.4;
      const makeOfferTime = settlement.state.currentPhase.countdown * 1000 * 0.15;
      this.subscriptions.push(
        timer(100).subscribe(() => {
          this.npcsMakeOffers(settlement, makeOfferTime);
          timer(makeOfferTime).subscribe(() => {
            this.npcsVote(settlement, voteTime);
          });
        })
      );
    }
  }

  handleResults = (settlement: SettlementWithState) => {
    settlement.state.availableMotions
      .filter((motion: Motion) => !!getById(settlement.state.motionsTabled, motion.id))
      .forEach((motion: Motion) => {
        const votes: Vote[] = this.props.actors?.reduce((acc: Vote[], curr) => ([...acc, this.getVote(motion.id, curr.id, settlement.state.motionVotes)]), []);

        votes.forEach(vote => {
          if (!!vote.purchaseAgreement) {
            const purchaser = vote.purchaseAgreement.purchasedBy;
            const amountSpent = vote.purchaseAgreement.amountSpent;
            this.props.dispatch(changeCapital(purchaser, -amountSpent));
            this.props.dispatch(changeCapital(vote.actorId, amountSpent));
          }
          if (vote.actorId === this.props.player.id) {
            const offer = this.getOffers(motion, vote.vote, settlement)?.[0];
            if (!!offer?.purchaseAgreement) {
              const amountSpent = offer.purchaseAgreement.amountSpent || 0;
              const purchaser = offer.purchaseAgreement.purchasedBy || '';
              this.props.dispatch(changeCapital(purchaser, -amountSpent));
              this.props.dispatch(changeCapital(vote.actorId, amountSpent));
            }
          }
        });
      });

    const passedMotions = getPassedMotions(
      settlement.state.motionVotes,
      this.props?.actors.map(actor => returnActorWithStateAndOffices(actor, actor.state, settlement))
    );
    passedMotions
      .map(x => settlement.state.availableMotions.find(y => y.id === x))
      .filter(x => !!x)
      .map(motion => (motion ? {...motion, tabledBy: settlement.state.motionsTabled.find(x => x.id == motion.id)?.tabledBy} : undefined))
      .forEach(motion => {
        if (!!motion) {
          this.props.dispatch(passMotion(motion, settlement.id));
          if (!!motion.tabledBy) {
            const actor = this.props.actors.find(x => x.id === motion.tabledBy);
            console.log(`${actor?.name} received ${motion.rewardForPassing} as a reward for passing ${motion.name}`);
            this.props.dispatch(changeCapital(motion.tabledBy, motion.rewardForPassing))
          }
        }
      });
  };

  onReturnToTablePhase = (settlement: SettlementWithState, repeat: boolean) => {
    console.log('onReturnToTablePhase', settlement, repeat);
    this.grantAllowance(settlement);
    if (!repeat) {
      this.props.dispatch(resetVoting(settlement.id));
    }
    this.props.dispatch(refreshAvailableMotions(settlement.id));
    this.subscriptions.push(
      timer(settlement.state.currentPhase.countdown * 0.1 * 1000).subscribe(() => {
        const _settlement = this.props.settlements.find(x => x.id === settlement.id);
        console.log(actors, _settlement?.state.availableMotions);
        this.subscriptions.push(
          timer(Math.random() * (settlement.state.currentPhase.countdown * 0.7 * 1000)).subscribe(() => {
            const __settlement = this.props.settlements.find(x => x.id === settlement.id);
            __settlement?.state.availableMotions.forEach((motion: Motion) => {
              actors.forEach((actor, i) => {
                const approval = getActorApproval(actor, motion);
                if (approval > 1 + (motion.costToTable / 100)) {
                  this.table(motion.id, actor.id, __settlement);
                }
              })
            });
          })
        );
      })
    );
  }

  getTabledMotions = (settlement: SettlementWithState) => {
    return settlement.state.availableMotions
      .map(motion => ({...motion, tabledBy: getById(settlement.state.motionsTabled, motion.id)?.tabledBy}))
      .filter(motion => !!motion.tabledBy);
  };

  componentDidUpdate = (props: any) => {
    // this.props.dispatch(changeCurrentPhaseCountdown(Math.min(this.props.currentPhaseCountdown, 3), this.props.settlement.id));
  }

  npcsVote = (settlement: SettlementWithState, duration: number) => {
    this.getTabledMotions(settlement).forEach(motion => {
      const actors = getActorsWithApproval(this.props?.actors.map(x => returnActorWithStateAndOffices(x, x.state, settlement)), motion)
      actors
        .filter(x => x.voteWeight > 0 && x.id !== this.props.player.id)
        .forEach(actor => {
          this.subscriptions.push(
            timer(Math.random() * duration).subscribe(() => {
              const personalOffers = (settlement.state.currentVoteOffers[actor.id]||[])
                .filter(offer => offer.motionId === motion.id)
                .shuffle()
                .sort((a, b) => (a.purchaseAgreement?.amountSpent||0) > (b.purchaseAgreement?.amountSpent||0) ? -1 : 1) || [];
              const topOffer = personalOffers.length > 0 ? personalOffers[0] : null;
              if (!!topOffer) {
                this.props.dispatch(changeVote(topOffer, settlement.id));
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
                }, settlement.id));
              }
            })
          );
        });
    });
  }

  npcsMakeOffers = (settlement: SettlementWithState, duration: number) => {
    this.getTabledMotions(settlement).forEach(motion => {
      // This is all the AI actors who are passionately involved and willing to make offers
      const actors = getActorsWithApproval(this.props?.actors.map(x => returnActorWithStateAndOffices(x, x.state, settlement)), motion)
      actors
        .filter(x => x.id !== this.props.player.id && Math.abs(x.approval) > 3)
        .reverse()
        .forEach(actor => {
          this.subscriptions.push(
            timer(Math.random() * duration).subscribe(() => {
              const desiredOffers = getDesiredOffers(actor, motion, actors, settlement.state.motionVotes[motion.id] || {}, settlement.state.currentVoteOffers);
              if (desiredOffers.length > 0) {
                this.props.dispatch(addOffers(desiredOffers, settlement.id));
              }
            })
          );
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
              <li key={settlement.id} className="mr-5 d-block">
                <div className="rounded-circle">
                  <button className="btn btn-link text-light p-0" onClick={() => {this.props.dispatch(travelToSettlement(settlement.id))}}>{settlement.name}</button>
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

        {!!this.props.currentSettlement && (<SettlementView settlement={this.props.currentSettlement}></SettlementView>)}
      </div>
    </div>
  );
}

const mapStateToProps = (state: State) => {
  const settlements = state.settlements.map(x => ({...x, state: state.saveData.settlementState[x.id]}));
  const currentSettlement = settlements.find(x => x.id === state.saveData.currentSettlement);

  /*
  const actors: ActorWithStateAndOffices[] = state.actors
    .map(x => ({...returnActorWithStateAndOffices(x, state.saveData.actorState[x.id], settlement)}))
    .sort((a, b) => Math.max(...a.offices.map(x => x.softCapitalCap)) > Math.max(...b.offices.map(x => x.softCapitalCap)) ? -1 : 1);
  */
  return {
    actors: state.actors.map(x => returnActorWithState(x, state.saveData.actorState[x.id])),
    player: actors.find((x: any) => x.id === 'player') || actors[0],
    inspectedMotion: state.saveData.inspectedMotion,
    policies: state.policies,
    settlements: settlements,
    notifications: state.saveData.notifications,
    currentSettlement: currentSettlement, // ONLY USE FOR SETTLEMENTVIEW
    screen: state.screen,
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
