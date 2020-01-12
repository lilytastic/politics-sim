import { changeVote } from "../store/actionCreators";
import { useDispatch } from "react-redux";
import { Vote } from "../store/reducers";
import { Motion } from "../models/motion.model";
import { ActorWithState } from "../models/actor.model";
import { stats } from "../models/stats.model";

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

