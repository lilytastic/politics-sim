import { Actor } from "./actor.model";

interface State {
  screen: string;
  actors: Actor[];
  settlementData: SettlementData[];
  availableMotions: Motion[];
  motionsTabled: {id: number; tabledBy: number}[];
  motionVotes: {id: number; voters: {id: number, vote: string, reason: string}[]}[];
  phases: {name: string, countdown: number}[];
  currentPhase: number;
  currentPhaseCountdown: number;
}

export interface SettlementData {
  id: string;
  edicts: Motion[];
}

export interface Motion {
  id: number;
  name: string;
  costToTable: number;
  effects: { stat: string, amount: number }[];
}

const initialState: State = {
  screen: 'title',
  actors: [],
  availableMotions: [],
  settlementData: [{id: 'test', edicts: []}],
  motionsTabled: [],
  motionVotes: [], // type can be 'motivated', 'bought', 'respect'
  phases: [{ name: 'table', countdown: 15 }, { name: 'vote', countdown: 30 }],
  currentPhase: 0,
  currentPhaseCountdown: 0
};

export function rootReducer(state = initialState, action: any): State {
  if (action.type !== 'CHANGE_CURRENT_PHASE_COUNTDOWN') {
    console.log(action);
  }
  switch (action.type) {
    case 'LOAD_ACTORS':
      return { ...state, actors: (action.actors||[]) };
    case 'UPDATE_ACTORS':
      return { ...state, actors: state.actors.map((actor: any) => {
        const changes = action.changes.find((x: any) => x.id === actor.id)?.changes;
        if (changes) {
          return {...actor, ...changes};
        } else {
          return actor;
        }
      }) };
    case 'PASS_MOTION':
      return {...state, settlementData: state.settlementData.map((x: any) => ({...x, edicts: [...x.edicts, action.motion]}))}
    case 'CHANGE_VOTE':
      return {
        ...state,
        motionVotes: state.motionVotes.map(motion => {
          if (motion.id === action.motionId) {
            return {...motion, voters: motion.voters.map(vote => vote.id === action.actorId ? {...vote, vote: action.vote, reason: action.reason} : vote)};
          } else {
            return motion;
          }
        })
      };
    case 'TABLE_MOTION':
      return { ...state, motionsTabled: [...state.motionsTabled, { id: action.motion, tabledBy: action.tabledBy }] };
    case 'RESCIND_MOTION':
      let index = state.motionsTabled.findIndex(x => x.id === action.motion);
      return { ...state, motionsTabled: [...state.motionsTabled.slice(0, index), ...state.motionsTabled.slice(index + 1)] };
    case 'CHANGE_SCREEN':
      return { ...state, screen: action.screen };
    case 'CHANGE_CURRENT_PHASE':
      return { ...state, currentPhase: action.currentPhase, currentPhaseCountdown: 0 };
    case 'CHANGE_CURRENT_PHASE_COUNTDOWN':
      return { ...state, currentPhaseCountdown: action.currentPhaseCountdown };
    case 'REFRESH_AVAILABLE_MOTIONS':
      const motions = [];
      for (let i = 0; i < 6; i++) {
        const effects: { stat: string, amount: number }[] = [];
        for (let ii = 0; ii < 1 + Math.round(Math.random()); ii++) {
          const allowedStats = ['faith', 'joy', 'vigilance', 'education'].filter(x => !effects.find(y => y.stat === x));
          effects.push({
            stat: allowedStats[Math.floor(Math.random() * allowedStats.length)],
            amount: Math.round((1 + Math.random() * 9) * (Math.random() * 100 > 50 ? 1 : -1))
          });
        }
        motions.push({
          id: i,
          name: 'Motion ' + (i + 1),
          effects: effects,
          costToTable: effects.reduce((acc, curr) => acc + Math.abs(curr.amount), 0) * 20
        });
      }
      return {
        ...state,
        motionsTabled: [],
        motionVotes: motions.map(motion => (
          {id: motion.id, voters: state.actors.map(actor => ({id: actor.id, reason: 'freely', vote: 'abstain'}))}
        )),
        availableMotions: motions
      };
    default:
      return state;
  }
}
