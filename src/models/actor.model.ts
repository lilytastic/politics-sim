import { PoliticalOffice } from "./politicalOffice.model";
import { SettlementState, SettlementWithState } from "./settlement.model";

export interface ActorBaseData {
  id: string;
  gender: string;
  name: string;
}
export interface ActorState {
  positions: PoliticalPosition[];
  capital: number;
}
export interface ActorWithState extends ActorBaseData {
  state: ActorState;
}
export interface ActorWithStateAndOffices extends ActorWithState {
  voteWeight: number;
  offices: PoliticalOffice[];
}

export interface ActorPoliticalStatus {
  rank: number;
}

export const returnActorWithState = (baseData: ActorBaseData, state: ActorState | null | undefined): ActorWithState => {
  return {
    ...baseData,
    state: { capital: 0, positions: [], ...state }
  }
}

export const returnActorWithStateAndOffices = (baseData: ActorBaseData, state: ActorState | null | undefined, settlement: SettlementWithState): ActorWithStateAndOffices => {
  const actor = returnActorWithState(baseData, state);
  let level = settlement.state.actorPositions[actor.id]?.rank || 0;
  let offices = Object.keys(settlement.state.officeOccupants).filter(x => settlement.state.officeOccupants[x] === actor.id).map(x => settlement.state.offices[x]);
  offices = [...offices, settlement.state.standardPositions[Math.min(level, settlement.state.standardPositions.length - 1)]];
  return {...actor, offices: offices, voteWeight: offices.reduce((acc, curr) => acc + curr.voteWeight, 0)};
}

export interface PoliticalPosition {
  stat: string;
  attitude: string;
  passion: number;
}

export const actors: ActorWithState[] = [
  {
    id: 'player',
    name: 'Ananth',
    gender: 'm',
    state: {
      positions: []
    }
  },
  {
    id: 'shireen',
    name: 'Shireen',
    gender: 'f',
    state: {
      positions: [
        {
          stat: 'education',
          attitude: 'raise',
          passion: 50
        },
        {
          stat: 'dignity',
          attitude: 'raise',
          passion: 50
        }
      ]
    }
  },
  {
    id: 'gretchen',
    name: 'Gretchen',
    gender: 'f',
    state: {
      positions: [
        {
          stat: 'vigilance',
          attitude: 'raise',
          passion: 50
        },
        {
          stat: 'joy',
          attitude: 'lower',
          passion: 50
        }
      ]
    }
  },
  {
    id: 'vex',
    name: 'Vex',
    gender: 'f',
    state: {
      positions: [
        {
          stat: 'vigilance',
          attitude: 'raise',
          passion: 50
        },
        {
          stat: 'education',
          attitude: 'raise',
          passion: 50
        }
      ]
    }
  },
  {
    id: 'abigail',
    name: 'Abigail',
    gender: 'f',
    state: {
      positions: [
        {
          stat: 'openness',
          attitude: 'raise',
          passion: 50
        },
        {
          stat: 'purpose',
          attitude: 'raise',
          passion: 50
        }
      ]
    }
  },
  {
    id: 'cecilia',
    name: 'Cecilia',
    gender: 'f',
    state: {
      positions: [
        {
          stat: 'dignity',
          attitude: 'raise',
          passion: 50
        },
        {
          stat: 'joy',
          attitude: 'raise',
          passion: 50
        }
      ]
    }
  },
  {
    id: 'matilda',
    name: 'Matilda',
    gender: 'f',
    state: {
      positions: [
        {
          stat: 'charity',
          attitude: 'raise',
          passion: 50
        },
        {
          stat: 'education',
          attitude: 'raise',
          passion: 50
        }
      ]
    }
  }
].map(x => ({ ...x, state: { ...x.state, capital: 0 } }));
