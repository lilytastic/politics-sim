import { Actor } from "../models/actor.model";
import { Motion } from "./reducers";

export const changeScreen = (screen: string) => ({
  type: 'CHANGE_SCREEN',
  screen: screen
});
export const changeCurrentPhase = (currentPhase: number) => ({
  type: 'CHANGE_CURRENT_PHASE',
  currentPhase
});
export const changeCurrentPhaseCountdown = (currentPhaseCountdown: number) => ({
  type: 'CHANGE_CURRENT_PHASE_COUNTDOWN',
  currentPhaseCountdown
});
export const refreshAvailableMotions = () => ({
  type: 'REFRESH_AVAILABLE_MOTIONS'
});

export const passMotion = (motion: Motion) => ({
  type: 'PASS_MOTION',
  motion
});

export const tableMotion = (motion: number, tabledBy: number) => ({
  type: 'TABLE_MOTION',
  motion,
  tabledBy
});

export const rescindMotion = (motion: number) => ({
  type: 'RESCIND_MOTION',
  motion
});

export const changeVote = (change: {actorId: number, motionId: number, vote: string, reason: string}) => ({
  type: 'CHANGE_VOTE',
  change
})
export const changeVotes = (changes: {actorId: number, motionId: number, vote: string, reason: string}[]) => ({
  type: 'CHANGE_VOTES',
  changes
})

export const loadSave = (data: any) => ({type: 'LOAD_SAVE', data})

export const loadActors = (actors: Actor[]) => ({type: 'LOAD_ACTORS', actors})
export const updateActors = (changes: {id: number, changes: Partial<Actor>}[]) => ({type: 'UPDATE_ACTORS', changes})