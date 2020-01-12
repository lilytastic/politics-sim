
export interface ActorBaseData {
  id: string;
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
    state: {
      positions: []
    }
  },
  {
    id: '1',
    name: 'Guy 1',
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
    id: '2',
    name: 'Guy 2',
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
    id: '3',
    name: 'Guy 3',
    state: {
      positions: [
        {
          stat: 'education',
          attitude: 'lower',
          passion: 50
        },
        {
          stat: 'vigilance',
          attitude: 'raise',
          passion: 50
        }
      ]
    }
  },
  {
    id: '4',
    name: 'Guy 4',
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
    id: '5',
    name: 'Guy 5',
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
    id: '6',
    name: 'Guy 6',
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
