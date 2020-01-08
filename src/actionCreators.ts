
export const changeScreen = (screen: string) => ({
  type: 'CHANGE_SCREEN',
  screen: screen
});

export const loadSave = (data: any) => ({type: 'LOAD_SAVE', data})