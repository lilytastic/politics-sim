import { ActorBaseData, ActorWithState } from "../models/actor.model";
import { Motion } from "../models/motion.model";
import { PolicyBaseData } from "../models/policy.model";
import * as Policies from "../content/policies.json";
import { SettlementState, SettlementBaseData } from "../models/settlement.model";
import { POLITICAL_STRUCTURE_TRIBAL } from "../content/politicalStructure.const";
import { Vote } from "../models/vote.model";
import { SaveData } from "../models/save-data.model";

declare global {
  interface Array<T> {
    shuffle(): T[];
    toEntities(): { [id: string]: T };
  }
}
if (!Array.prototype.shuffle) {
  Array.prototype.shuffle = function <T>() {
    const woo = [...this];
    var currentIndex = this.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = woo[currentIndex];
      woo[currentIndex] = woo[randomIndex];
      woo[randomIndex] = temporaryValue;
    }

    return woo;
  }
}
if (!Array.prototype.toEntities) {
  Array.prototype.toEntities = function <T>(prop: string = 'id', preserveId: boolean = true) {
    const obj: { [id: string]: T } = {};
    for (let i = 0; i < this.length; i++) {
      const entity = { ...this[i] }
      if (preserveId) {
        delete entity[prop];
      }
      obj[this[i][prop]] = entity;
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

const initialState: State = {
  screen: 'title',
  actors: [],
  // @ts-ignore;
  policies: Policies.default,
  settlements: [{id: 'test', name: 'TestSettlement'}],
  phases: [{ id: 'table', label: 'Draft', countdown: 30 }, { id: 'vote', label: 'Vote', countdown: 90 }],
  saveData: {
    actorState: {},
    inspectedMotion: '',
    notifications: [],
    timePassed: 0,
    settlementState: {
      'test': {
        policies: {},
        history: [],
        availableMotions: [],
        motionsTabled: [],
        motionVotes: {}, // type can be 'motivated', 'bought', 'respect'
        currentVoteOffers: {},
        currentPhase: 0,
        currentPhaseCountdown: 0,
        ...POLITICAL_STRUCTURE_TRIBAL,
        actorPositions: {
          'shireen': {rank: 4},
          'abigail': {rank: 4},
          'vex': {rank: 3},
          'gretchen': {rank: 3},
          'matilda': {rank: 3},
          'player': {rank: 1}
        },
        officeOccupants: {
          chieftain: 'shireen',
          elder: 'abigail',
          admin: 'vex',
          defense_sec: 'gretchen',
          education_sec: 'matilda'
        }
      }
    }
  }
};

export function rootReducer(state = initialState, action: any): State {
  const ignoredTypes = ['PASS_TIME', 'CHANGE_VOTE', 'CHANGE_CURRENT_PHASE_COUNTDOWN'];
  if (ignoredTypes.indexOf(action.type) === -1) {
    console.log(action);
  }
  switch (action.type) {
    case 'PASS_TIME':
      return {
        ...state,
        saveData: {
          ...state.saveData,
          timePassed: (state.saveData.timePassed || 0) + action.time
        }
      };
    case 'LOAD_ACTORS': {
      const newState = action.actors.map((x: ActorWithState) => ({...state.saveData.actorState, ...x.state, id: x.id})).toEntities('id', false);
      return {
        ...state,
        actors: action.actors.map((x: ActorWithState) => {const mutated = {...x}; delete mutated.state; return mutated;}),
        saveData: {
          ...state.saveData,
          actorState: {...state.saveData.actorState, ...newState}
        }
      };
    }
    case 'UPDATE_ACTORS': {
      const newState = action.changes.map((x: any) => ({...state.saveData.actorState[x.id], ...x.changes})).toEntities('id', false);
      return {
        ...state,
        saveData: {
          ...state.saveData,
          actorState: {...state.saveData.actorState, ...newState}
        }
      };
    }
    case 'PASS_MOTION':
      switch (action.motion.change.type) {
        case 'CHANGE_POLICY': {
          const settlementState = Object.keys(state.saveData.settlementState)
            .map((key) => {
              const currentState = state.saveData.settlementState[key];
              const newPolicies = {...currentState.policies};
              newPolicies[action.motion.change.payload.policyId] = action.motion.change.payload.stanceId;
              return {
                ...state.saveData.settlementState[key],
                id: key,
                history: [...currentState.history, {...action.motion.change.payload, time: state.saveData.timePassed}],
                policies: newPolicies
              };
            });
          console.log(settlementState, settlementState.toEntities());
          return {
            ...state,
            saveData: {
              ...state.saveData,
              settlementState: settlementState.toEntities()
            }
          };
        }
        case 'REPEAL_POLICY': {
          const settlementState = Object.keys(state.saveData.settlementState)
            .map((key) => {
              const currentState = state.saveData.settlementState[key];
              const newPolicies = {...currentState.policies};
              delete newPolicies[action.motion.change.payload.policyId];
              return {...state.saveData.settlementState[key], id: key, policies: newPolicies};
            });
          console.log(settlementState, settlementState.toEntities());
          return {
            ...state,
            saveData: {
              ...state.saveData,
              settlementState: settlementState.toEntities()
            }
          };
        }
        default:
          return state;
      }
    case 'ADD_ALERT':
      return {
        ...state,
        saveData: {
          ...state.saveData,
          notifications: [...state.saveData.notifications, action.alert]
        }
      };
    case 'CHANGE_VOTE': {
      const settlementState = {...state.saveData.settlementState};
      const change = action.change;
      const motionVotes = settlementState[action.settlementId]?.motionVotes;
      motionVotes[change.motionId] = motionVotes[change.motionId] || {};
      motionVotes[change.motionId][change.actorId] = {purchaseAgreement: change.purchaseAgreement, vote: change.vote, reason: change.reason};
      settlementState[action.settlementId].motionVotes = motionVotes;
      return {
        ...state,
        saveData: {
          ...state.saveData,
          settlementState
        }
      };
    }
    case 'CHANGE_VOTES': {
      const settlementState = {...state.saveData.settlementState};
      const changes: Vote[] = action.changes;
      const motionVotes = settlementState[action.settlementId]?.motionVotes;
      changes.forEach(change => {
        motionVotes[change.motionId] = motionVotes[change.motionId] || {};
        motionVotes[change.motionId][change.actorId] = {purchaseAgreement: change.purchaseAgreement, vote: change.vote, reason: change.reason};
      });
      settlementState[action.settlementId].motionVotes = motionVotes;
      return {
        ...state,
        saveData: {
          ...state.saveData,
          settlementState
        }
      };
    }
    case 'ADD_VOTE_OFFERS': {
      const settlementState = {...state.saveData.settlementState};
      const offers = settlementState[action.settlementId]?.currentVoteOffers;
      if (!!offers) {
        action.offers.forEach((offer: Vote) => {
          offers[offer.actorId] = offers[offer.actorId] || [];
          offers[offer.actorId].push(offer);
        });
        settlementState[action.settlementId].currentVoteOffers = offers
      }
      return {
        ...state,
        saveData: {
          ...state.saveData,
          settlementState
        }
      };
    }
    case 'SET_VOTE_OFFERS': {
      const settlementState = {...state.saveData.settlementState};
      settlementState[action.settlementId] = action.offers;
      return {
        ...state,
        saveData: {
          ...state.saveData,
          settlementState
        }
      };
    }
    case 'INSPECT_MOTION': {
      return {
        ...state,
        saveData: {
          ...state.saveData,
          inspectedMotion: state.saveData.inspectedMotion === action.motion ? '' : action.motion
        }
      };
    }
    case 'TABLE_MOTION': {
      const settlementState = {...state.saveData.settlementState};
      settlementState[action.settlementId].motionsTabled = [
        ...settlementState[action.settlementId].motionsTabled,
        { id: action.motion, tabledBy: action.tabledBy }
      ]
      return {
        ...state,
        saveData: {
          ...state.saveData,
          settlementState
        }
      };
    }
    case 'RESCIND_MOTION': {
      const settlementState = {...state.saveData.settlementState};
      let index = settlementState[action.settlementId].motionsTabled.findIndex(x => x.id === action.motion);
      settlementState[action.settlementId].motionsTabled = [...settlementState[action.settlementId].motionsTabled.slice(0, index), ...settlementState[action.settlementId].motionsTabled.slice(index + 1)]
      return {
        ...state,
        saveData: {
          ...state.saveData,
          settlementState
        }
      };
    }
    case 'CHANGE_SCREEN':
      return { ...state, screen: action.screen };
    case 'CHANGE_CURRENT_PHASE': {
      const settlementState = {...state.saveData.settlementState};
      settlementState[action.settlementId].currentPhase = action.currentPhase;
      settlementState[action.settlementId].currentPhaseCountdown = 0;
      return { ...state, saveData: {...state.saveData, settlementState }};
    }
    case 'CHANGE_CURRENT_PHASE_COUNTDOWN': {
      const settlementState = {...state.saveData.settlementState};
      settlementState[action.settlementId].currentPhaseCountdown = action.currentPhaseCountdown;
      return { ...state, saveData: {...state.saveData, settlementState }};
    }
    case 'REFRESH_AVAILABLE_MOTIONS': {
      let motions: Motion[] = [];
      const settlementState = {...state.saveData.settlementState};
      const possibleMotions: Motion[] = [];

      state.policies.forEach(policy => {
        const existingStance = settlementState[action.settlementId]?.policies[policy.id];
        if (policy.canBeRepealed && existingStance) {
          const effects = policy.stances[existingStance].effects.map(x => ({stat: x.stat, amount: -x.amount}));
          const effectCost = effects.reduce((acc, curr) => {
            let amount = curr.amount;
            return acc + Math.abs(amount);
          }, 0) * 20;
          possibleMotions.push({
            id: `repeal_${policy.id}`,
            name: `Repeal Stance on ${policy.label}`,
            change: {
              type: 'REPEAL_POLICY',
              payload: {policyId: policy.id}
            },
            rewardForPassing: effectCost * 3,
            costToTable: effectCost,
            effects: effects
          });
        }
        Object.keys(policy.stances).forEach(key => {
          const stance = policy.stances[key];
          const effects = stance.effects.map(x => {
            const relevantEffect = existingStance ? policy.stances[existingStance].effects.find(eff => eff.stat === x.stat) : null;
            return {
              ...x,
              amount: existingStance ? x.amount - (relevantEffect ? relevantEffect.amount : 0) : x.amount
            };
          });
          const effectCost = effects.reduce((acc, curr) => {
            let amount = curr.amount;
            return acc + Math.abs(amount);
          }, 0) * 20;
          possibleMotions.push({
            id: `${policy.id}_${key}`,
            name: `Declare ${policy.label} ${stance.label}`,
            change: {
              type: 'CHANGE_POLICY',
              payload: {policyId: policy.id, stanceId: key}
            },
            rewardForPassing: effectCost * 3,
            costToTable: effectCost,
            effects: effects
          });
        });
      });

      motions = possibleMotions.filter(x => x.effects.reduce((acc, curr) => acc + Math.abs(curr.amount), 0) > 0).shuffle().slice(0, 6);

      settlementState[action.settlementId] = {
        ...settlementState[action.settlementId],
        motionsTabled: [],
        motionVotes: {},
        currentVoteOffers: {},
        availableMotions: motions
      }

      return {
        ...state,
        saveData: {
          ...state.saveData,
          inspectedMotion: '',
          settlementState
        }
      };
    }
    default:
      return state;
  }
}
