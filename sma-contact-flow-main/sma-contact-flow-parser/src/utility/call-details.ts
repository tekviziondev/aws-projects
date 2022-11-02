export function getLegACallDetails(event: any) {
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
        console.error(" There is an Error in execution of getting the call Details" + error.message);
    }
}
