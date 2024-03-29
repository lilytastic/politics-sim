import { ActorState, ActorWithState } from "../models/actor.model";
import { Motion } from "../models/motion.model";
import { Vote } from "../models/vote.model";
import { Phase } from "../models/phase.model";

export const changeScreen = (screen: string) => ({
  type: 'CHANGE_SCREEN',
  screen: screen
});

export const addAlert = (alert: {type: string; text: string;}) => ({
  type: 'ADD_ALERT',
  alert
});

export const passTime = (time: number) => ({
  type: 'PASS_TIME',
  time
});

export const inspectMotion = (motion: string) => ({
  type: 'INSPECT_MOTION',
  motion
});

export const travelToSettlement = (settlementId: string) => ({
  type: 'CHANGE_SETTLEMENT',
  settlementId
});

export const incrementAllPhaseCountdowns = (amount: number) => ({
  type: 'INCREMENT_ALL_PHASE_COUNTDOWNS',
  amount
})

export const removeAllExpiredPlans = () => ({
  type: 'REMOVE_ALL_EXPIRED_PLANS'
})

export const changeCurrentPhase = (currentPhase: Phase, settlementId: string) => ({
  type: 'CHANGE_CURRENT_PHASE',
  currentPhase,
  settlementId
});
export const changeCurrentPhaseCountdown = (currentPhaseCountdown: number, settlementId: string) => ({
  type: 'CHANGE_CURRENT_PHASE_COUNTDOWN',
  currentPhaseCountdown,
  settlementId
});
export const refreshAvailableMotions = (settlementId: string) => ({
  type: 'REFRESH_AVAILABLE_MOTIONS',
  settlementId
});
export const resetVoting = (settlementId: string) => ({
  type: 'RESET_VOTING',
  settlementId
});

export const changeCapital = (actorId: string, amount: number) => ({
  type: 'CHANGE_CAPITAL',
  actorId,
  amount
});

export const passMotion = (motion: Motion, settlementId: string) => ({
  type: 'PASS_MOTION',
  motion,
  settlementId
});

export const addOffers = (offers: Vote[], settlementId: string) => ({
  type: 'ADD_VOTE_OFFERS',
  offers,
  settlementId
})
export const setOffers = (offers: {[id: string]: Vote[]}, settlementId: string) => ({
  type: 'SET_VOTE_OFFERS',
  offers,
  settlementId
})

export const tableMotion = (motion: string, tabledBy: string, settlementId: string) => ({
  type: 'TABLE_MOTION',
  motion,
  tabledBy,
  settlementId
});
export const rescindMotion = (motion: string, settlementId: string) => ({
  type: 'RESCIND_MOTION',
  motion,
  settlementId
});

export const changeVote = (change: Vote, settlementId: string) => ({
  type: 'CHANGE_VOTE',
  change,
  settlementId
})
export const changeVotes = (changes: Vote[], settlementId: string) => ({
  type: 'CHANGE_VOTES',
  changes,
  settlementId
})

export const loadSave = (data: any) => ({type: 'LOAD_SAVE', data})

export const loadActorsWithDefaultState = (actors: ActorWithState[]) => ({type: 'LOAD_ACTORS', actors})
export const updateActors = (changes: {id: string, changes: Partial<ActorState>}[]) => ({type: 'UPDATE_ACTORS', changes})