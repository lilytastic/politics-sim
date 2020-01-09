
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

export const tableMotion = (motion: number, tabledBy: number) => ({
  type: 'TABLE_MOTION',
  motion,
  tabledBy
});

export const rescindMotion = (motion: number) => ({
  type: 'RESCIND_MOTION',
  motion
});

export const loadSave = (data: any) => ({type: 'LOAD_SAVE', data})