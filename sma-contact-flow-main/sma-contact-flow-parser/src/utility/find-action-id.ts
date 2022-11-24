/**
  * This function returns contact flow action object from the list of action, based on the action identifier 
  * @param actions
  * @param identifier
  * @returns Amazon Connect Action ID
  */
export function findActionByID(actions: any[], identifier: string) {
  return actions.find((action: any) => action.Identifier === identifier);
}
