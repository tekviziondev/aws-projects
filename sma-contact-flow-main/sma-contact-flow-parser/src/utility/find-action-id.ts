/**
  * This function gets the ID of the Action and Returns the corresponding Amazon Connect Action Object
  * @param actions
  * @param identifier
  * @returns Amazon Connect Action Object
  */
export function findActionByID(actions: any[], identifier: string) {
    return actions.find((action: any) => action.Identifier === identifier);
}
