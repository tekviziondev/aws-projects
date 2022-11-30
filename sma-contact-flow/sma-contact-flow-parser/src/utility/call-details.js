"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallDetailsUtil = void 0;
class CallDetailsUtil {
    /**
      * This Method process SMA Event and returns the Call Details like "From Phone number" and "To Phone Number"
      * @param event
      */
    getLegACallDetails(event) {
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
        }
        catch (error) {
            console.error(" There is an error in execution of getting the call Details" + error.message);
        }
    }
    /**
      * This Method returns Contact Flow Action object from the list of actions, based on the Action ID
      * @param actions
      * @param identifier
      * @returns Contact Flow Action ID
      */
    findActionObjectByID(actions, identifier) {
        return actions.find((action) => action.Identifier === identifier);
    }
}
exports.CallDetailsUtil = CallDetailsUtil;
