
export interface Actor {
  id: string;
  name: string;
  positions: PoliticalPosition[];
  capital: number;
}

export interface PoliticalPosition {
  stat: string;
  attitude: string;
  passion: number;
}

export const actors: Actor[] = [
  {
    id: '0',
    name: 'Ananth',
    positions: [
    {
      stat: 'faith',
      attitude: 'raise',
      passion: 50
    },
    {
      stat: 'vigilance',
      attitude: 'lower',
      passion: 50
    }
    ]
  },
  {
    id: '1',
    name: 'Guy 1',
    positions: [
    {
      stat: 'education',
      attitude: 'raise',
      passion: 50
    },
    {
      stat: 'faith',
      attitude: 'lower',
      passion: 50
    }
    ]
  },
  {
    id: '2',
    name: 'Guy 2',
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
  },
  {
    id: '3',
    name: 'Guy 3',
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
  },
  {
    id: '4',
    name: 'Guy 4',
    positions: [
    {
      stat: 'vigilance',
      attitude: 'lower',
      passion: 50
    },
    {
      stat: 'faith',
      attitude: 'raise',
      passion: 50
    }
    ]
  },
  {
    id: '5',
    name: 'Guy 5',
    positions: [
    {
      stat: 'faith',
      attitude: 'lower',
      passion: 50
    },
    {
      stat: 'joy',
      attitude: 'raise',
      passion: 50
    }
    ]
  },
  {
    id: '6',
    name: 'Guy 6',
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
  ].map(x => ({...x, capital: 0}));
  