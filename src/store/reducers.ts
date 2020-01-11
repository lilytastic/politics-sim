import { ActorBaseData, ActorState, ActorWithState } from "../models/actor.model";
import { Motion } from "../models/motion.model";
import { PolicyBaseData, PolicyState } from "../models/policy.model";

declare global {
  interface Array<T> {
    toEntities(): {[id: string]: T};
  }
}

if (!Array.prototype.toEntities) {
  Array.prototype.toEntities = function<T>(preserveId: boolean = true) {
    const obj: {[id: string]: T} = {};
    for (let i = 0; i < this.length; i++) {
      const entity = {...this[i]}
      if (preserveId) {
        delete entity.id;
      }
      obj[this[i].id] = entity;
    }
    return obj;
  }
}

export interface State {
  screen: string;
  actors: ActorBaseData[];
  policies: PolicyBaseData[];
  settlements: SettlementBaseData[];
  phases: {id: string, label: string, countdown: number}[];
  saveData: SaveData;
}

export interface SaveData {
  settlementState: {[id: string]: SettlementState};
  actorState: {[id: string]: ActorState};
  availableMotions: Motion[];
  motionsTabled: {id: string; tabledBy: string}[];
  motionVotes: {[id: string]: {[id: string]: {vote: string, reason: string}}};
  currentPhase: number;
  currentPhaseCountdown: number;
}

export interface SettlementBaseData {
  id: string;
}

export interface SettlementState {
  policies: PolicyState[];
}

const initialState: State = {
  screen: 'title',
  actors: [],
  policies: [],
  settlements: [{id: 'test'}],
  phases: [{ id: 'table', label: 'Table', countdown: 20 }, { id: 'vote', label: 'Vote', countdown: 40 }],
  saveData: {
    actorState: {},
    availableMotions: [],
    motionsTabled: [],
    motionVotes: {}, // type can be 'motivated', 'bought', 'respect'
    settlementState: {
      'test': {
        policies: []
      }
    },
    currentPhase: 0,
    currentPhaseCountdown: 0
  }
};

export function rootReducer(state = initialState, action: any): State {
  if (action.type !== 'CHANGE_CURRENT_PHASE_COUNTDOWN') {
    console.log(action);
  }
  switch (action.type) {
    case 'LOAD_ACTORS':
      const newState = action.actors.map((x: ActorWithState) => ({...state.saveData.actorState, ...x.state, id: x.id})).toEntities(false);
      return {
        ...state,
        actors: action.actors.map((x: ActorWithState) => {const mutated = {...x}; delete mutated.state; return mutated;}),
        saveData: {
          ...state.saveData,
          actorState: {...state.saveData.actorState, ...newState}
        }
      };
    case 'UPDATE_ACTORS':
      const _newState = action.changes.map((x: any) => ({...state.saveData.actorState[x.id], ...x.changes})).toEntities(false);
      return {
        ...state,
        saveData: {
          ...state.saveData,
          actorState: {...state.saveData.actorState, ..._newState}
        }
      };
    case 'PASS_MOTION':
      const settlementState = Object.keys(state.saveData.settlementState)
        .map((key) => {
          const currentState = state.saveData.settlementState[key];
          return {...currentState, policies: [...currentState.policies, action.motion]};
        })
        .toEntities();
      return {
        ...state,
        saveData: {
          ...state.saveData,
          settlementState: settlementState
        }
      };
    case 'CHANGE_VOTE':
      const change = action.change;
      const _motionVotes = {...state.saveData.motionVotes};
      _motionVotes[change.motionId] = _motionVotes[change.motionId] || {};
      _motionVotes[change.motionId][change.actorId] = {vote: change.vote, reason: change.reason};
      return {
        ...state,
        saveData: {
          ...state.saveData,
          motionVotes: _motionVotes
        }
      };
    case 'CHANGE_VOTES':
      const changes: {actorId: string, motionId: string, vote: string, reason: string}[] = action.changes;
      const motionVotes = {...state.saveData.motionVotes};
      changes.forEach(change => {
        motionVotes[change.motionId] = motionVotes[change.motionId] || {};
        motionVotes[change.motionId][change.actorId] = {vote: change.vote, reason: change.reason};
      });
      return {
        ...state,
        saveData: {
          ...state.saveData,
          motionVotes: motionVotes
        }
      };
    case 'TABLE_MOTION':
      return {
        ...state,
        saveData: {
          ...state.saveData,
          motionsTabled: [...state.saveData.motionsTabled, { id: action.motion, tabledBy: action.tabledBy }]
        }
      };
    case 'RESCIND_MOTION':
      let index = state.saveData.motionsTabled.findIndex(x => x.id === action.motion);
      return {
        ...state,
        saveData: {...state.saveData, motionsTabled: [...state.saveData.motionsTabled.slice(0, index), ...state.saveData.motionsTabled.slice(index + 1)] }
      };
    case 'CHANGE_SCREEN':
      return { ...state, screen: action.screen };
    case 'CHANGE_CURRENT_PHASE':
      return { ...state, saveData: {...state.saveData, currentPhase: action.currentPhase, currentPhaseCountdown: 0 }};
    case 'CHANGE_CURRENT_PHASE_COUNTDOWN':
      return { ...state, saveData: {...state.saveData, currentPhaseCountdown: action.currentPhaseCountdown }};
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
          id: i.toString(),
          name: 'Motion ' + (i + 1),
          effects: effects,
          costToTable: effects.reduce((acc, curr) => acc + Math.abs(curr.amount), 0) * 20
        });
      }
      return {
        ...state,
        saveData: {
          ...state.saveData,
          motionsTabled: [],
          motionVotes: {},
          availableMotions: motions
        }
      };
    default:
      return state;
  }
}
