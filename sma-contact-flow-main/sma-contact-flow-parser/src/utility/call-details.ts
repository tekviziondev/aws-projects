
export class CallDetailsUtil{

/**
  * This function process SMA Event and returns the Call Details from Phone number and To Phone Number
  * @param event 
  */
 async getLegACallDetails(event: any){
    try {
        let rv = null;
        if (event && event.CallDetails && event.CallDetails.Participants && event.CallDetails.Participants.length > 0) {
            for (let i = 0; i < event.CallDetails.Participants.length; i++) {
                if (event.CallDetails.Participants[i].ParticipantTag === 'LEG-A') {
                    rv = event.CallDetails.Participants[i];
                    break;
                }
            }
        }
        return rv;
    } catch (error) {
        console.error(" There is an error in execution of getting the call Details" + error.message);
    }
}

/**
  * This function returns contact flow action object from the list of actions, based on the action identifier 
  * @param actions
  * @param identifier
  * @returns Amazon Connect Action ID
  */
 async findActionByID(actions: any[], identifier: string) {
    return actions.find((action: any) => action.Identifier === identifier);
  }
  
  /**
  * This function will count the number of occurences of the of string in the Text 
  * @param str 
  * @param find
  * @returns count
  */
async count(str, find) {
    return (str.split(find)).length - 1;
  }
}