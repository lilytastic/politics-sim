import { Motion } from "../models/motion.model";
import { ActorWithState, ActorWithStateAndOffices } from "../models/actor.model";
import { stats } from "../models/stats.model";
import { Vote, VoteData } from "../models/vote.model";

export function getAssociatedVoteColor(vote: string) {
  switch (vote) {
    case 'yea':
      return 'green';
    case 'nay':
      return 'crimson';
    default:
      return 'grey';
  }
}

export const checkIfFullyTallied = (votes: {[id: string]: {[id: string]: VoteData}}, actors: ActorWithStateAndOffices[]) => {
  const numberOfVoters = actors.filter(x => x.voteWeight > 0).length;
  if (Object.keys(votes).filter(motion => (
    Object.keys(votes[motion]).filter(actor => !!votes[motion][actor]).length < numberOfVoters
  )).length === 0) {
    return true;
  }
  return false;
}

export const returnStandardVotes = (includeAbstainOption = false) => {
  const basic = [{key: 'yea', color: 'success'}, {key: 'nay', color: 'danger'}];
  const abstain = {key: 'abstrain', color: 'secondary'};
  return [...basic, ...(includeAbstainOption ? [abstain] : []) ]
}

export const currentVoteEntitiesToArray = (currentVotes: {[motionId: string]: {[actorId: string]: VoteData}}, motionId: string) => {
  return Object.keys(currentVotes[motionId]).map(actorId => ({...currentVotes[motionId][actorId], actorId: actorId, motionId: motionId}))
}

export const tallyVotes = (votes: Vote[], actors: ActorWithStateAndOffices[]) => {
  const positions = ['yea', 'abstain', 'nay'];
  const _votes: {[id: string]: {voters: number, total: number}} = {};
  positions.forEach(key => {
    _votes[key] = {
      voters: votes.reduce((acc, curr) => acc + (curr.vote === key ? 1 : 0), 0),
      total: votes.reduce((acc, curr) => acc + (curr.vote === key ? (actors.find(x => x.id === curr.actorId)?.voteWeight || 1) : 0), 0)
    }
  });
  return _votes;
}

export const tallyVotesFromEntity = (votes: {[id: string]: {vote: string; reason: string}}, actors: ActorWithStateAndOffices[]) => {
  return tallyVotes(Object.keys(votes).map(x => ({actorId: x, motionId: 'LIES', ...votes[x]})), actors);
}

export const getPassedMotions = (currentVotes: {[motionId: string]: {[actorId: string]: VoteData}}, actors: ActorWithStateAndOffices[]) => {
  const motions: string[] = [];
  Object.keys(currentVotes).forEach((motionId: string) => {
    const votes: Vote[] = currentVoteEntitiesToArray(currentVotes, motionId);
    const tally = tallyVotes(votes, actors);

    const yea = tally.yea.total;
    const nay = tally.nay.total;
    if (yea > nay) {
      motions.push(motionId);
    }
  });
  return motions;
}

export const getDesiredOffers = (actor: ActorWithStateAndOffices & {position: string, approval: number}, motion: Motion & {tabledBy: string}, actors: any[], currentVotes: {[actorId: string]: VoteData}, currentOffers: {[actorId: string]: Vote[]}) => {
  const desiredOffers: Vote[] = [];

  const actorsToBuyFrom = actors
    .filter(x => x.id !== x.voteWeight > 0 && x.id !== actor.id && motion.tabledBy && (currentVotes[actor.id]?.purchaseAgreement || Math.sign(actor.approval) !== Math.sign(x.approval)) ) // to filter ones who are already voting this way
    .shuffle()
    .sort((a, b) => a.costToInfluence[actor.position] < b.costToInfluence[actor.position] ? 1 : -1);

  const votes = tallyVotesFromEntity(currentVotes, actors);
  const votesNeeded =
    actor.position === 'yea' ? votes.nay.total - votes.yea.total :
    actor.position === 'nay' ? votes.yea.total - votes.nay.total :
    0;

  // Actor cares enough to buy this many votes from other actors.
  const votesToBuy = (Math.max(0, votesNeeded + 1) * 1.33) + Math.ceil(Math.abs(actor.approval) / 10);
  const amountToSpend = actor.id === motion.tabledBy ? actor.state.capital : (actor.state.capital / 2); // TODO: Base off approval -- more passion, more $$$
  if (votesToBuy > 0) {
    // console.log(`${actor.name} wants "${actor.position}" vote on ${motion.name}: Needs ${Math.max(0, votesNeeded)} more votes, but wants ${Math.ceil(votesToBuy)}`, actorsToBuyFrom);
  }

  let votesBought = 0;
  let capital = actor.state.capital;
  let amountSpentSoFar = 0;

  actorsToBuyFrom
    .map(_actor => ({..._actor, existingVote: currentVotes[_actor.id]}))
    .filter(x => x.costToInfluence[actor.position] <= amountToSpend - amountSpentSoFar)
    .forEach(actorToBuyFrom => {
      if (votesBought >= votesToBuy) {
        // If we have all our votes, time to stop.
        return;
      }
      let amountToSpendOnOffer = actorToBuyFrom.costToInfluence[actor.position];
      const existingOffers = (currentOffers[actorToBuyFrom.id] || []).filter(x => x.motionId === motion.id);
      const topOffer = existingOffers.sort((a, b) => (a.purchaseAgreement?.amountSpent||0) > (b.purchaseAgreement?.amountSpent||0) ? -1 : 1)[0];
      if (existingOffers.length && (topOffer.vote === actor.position || topOffer.purchaseAgreement?.purchasedBy === 'player')) {
        return;
      }
      if (existingOffers.length) {
        // Make sure to go above the existing offer
        amountToSpendOnOffer = Math.max(
          amountToSpendOnOffer,
          Math.max(...existingOffers.filter(x => x.vote !== actor.position).map(x => x.purchaseAgreement?.amountSpent || 0)) + 100
        );
      }
      amountToSpendOnOffer = Math.round(amountToSpendOnOffer);
      if (amountSpentSoFar + amountToSpendOnOffer > amountToSpend) {
        // If it's too costly, forget it
        return;
      }
      const offer: Vote = {
        actorId: actorToBuyFrom.id,
        motionId: motion.id,
        reason: 'bought',
        purchaseAgreement: {
          purchasedBy: actor.id,
          amountSpent: amountToSpendOnOffer
        },
        vote: actor.position
      };
      if (capital >= (offer.purchaseAgreement?.amountSpent || 0)) {
        console.log(`${actor.name} wants to buy ${offer.vote} vote from ${actorToBuyFrom.name} for ${amountToSpendOnOffer}`);
        desiredOffers.push(offer);
        votesBought += actorToBuyFrom.voteWeight;
        capital -= offer.purchaseAgreement?.amountSpent || 0;
        amountSpentSoFar += offer.purchaseAgreement?.amountSpent || 0;
      }
    });

  return desiredOffers;
};

export const getActorApproval = (actor: ActorWithState, motion: Motion) => {
  let approval = 0;
  motion.effects.forEach(effect => {
    const position = actor.state.positions.find(p => p.stat === effect.stat);
    const opposedPosition = actor.state.positions.find(p => stats[p.stat].opposed === effect.stat);
    if (position) {
      approval += (effect.amount || 0) * (position.attitude === 'raise' ? 1 : -1) * (position.passion / 100);
    }
    if (opposedPosition) {
      approval -= (effect.amount || 0) * (opposedPosition.attitude === 'raise' ? 1 : -1) * ((opposedPosition.passion / 2) / 100);
    }
  });
  return approval;
}

export const getCostToInfluence = (actor: any, approval: number) => {
  const costToInfluence: {[id: string]: number} = {
    yea: Math.max(100, (1 + Math.max(0, -approval)) * 100 * actor.voteWeight),
    abstain: Math.max(100, (1 + Math.max(0, Math.abs(approval) / 2)) * 100 * actor.voteWeight),
    nay: Math.max(100, (1 + Math.max(0, approval)) * 100 * actor.voteWeight)
  }
  return costToInfluence;
}

export const getActorsWithApproval = (actors: ActorWithStateAndOffices[], motion: Motion) => {
  return actors.map(actor => {
    const approval = getActorApproval(actor, motion);
    const costToInfluence = getCostToInfluence(actor, approval);
    return {...actor, approval: approval, costToInfluence: costToInfluence, position: approval > 0 ? 'yea' : approval < 0 ? 'nay' : 'abstain'}
  });
}
