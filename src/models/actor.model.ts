
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

export const returnActorWithState = (baseData: ActorBaseData, state: ActorState | null | undefined): ActorWithState => {
  return {
    ...baseData,
    state: { capital: 0, positions: [], ...state }
  }
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
          stat: 'purpose',
          attitude: 'lower',
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
          attitude: 'lower',
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
          stat: 'vigilance',
          attitude: 'lower',
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
          stat: 'purpose',
          attitude: 'lower',
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
          stat: 'joy',
          attitude: 'lower',
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
