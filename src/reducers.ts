
const initialState = {
  screen: 'title',
  actors: [],
  availableMotions: [{ id: 0, name: 'Motion 1', effects: [{ stat: 'faith', amount: 0 }] }],
  motionsTabled: [{ id: 1, tabledBy: 1 }],
  motionVotes: [{ id: 1, voters: [{ id: 3, type: 'bought' }] }], // type can be 'motivated', 'bought', 'respect'
  phases: [{ name: 'table', countdown: 15 }, { name: 'vote', countdown: 60 }],
  currentPhase: 0,
  currentPhaseCountdown: 0
};

export function rootReducer(state = initialState, action: any) {
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
      return { ...state, motionsTabled: [], motionVotes: [], availableMotions: motions };
    default:
      return state;
  }
}
