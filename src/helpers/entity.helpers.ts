export const getById = (arr: any[], id: string) => {
  return arr.find((x: any) => x.id === id);
}
