/**
  * Updating the Contact Attribute Details
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns The Next SMA Action to perform
  */
async function processFlowActionUpdateContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName) {
    const legA = getLegACallDetails(smaEvent);
    let callId;
    callId = legA.CallId;
    if (callId == "NaN")
        callId = smaEvent.ActionData.Parameters.CallId;
    let ContactAttributes = Object.entries(action.Parameters.Attributes);
    try {
        for (let i = 0; i < ContactAttributes.length; i++) {
            let x = ContactAttributes[i][1];
            if (x.includes("$.External.")) {
                let tmp = x.split("$.External.");
                if (tmpMap.has(tmp[1])) {
                    contextAttributs.set("$.Attributes." + ContactAttributes[i][0], tmpMap.get(tmp[1]));
                }
            }
            else if (x.includes("$.Attributes.")) {
                let tmp = x.split("$.Attributes.");
                if (tmpMap.has(tmp[1])) {
                    contextAttributs.set("$.Attributes." + ContactAttributes[i][0], tmpMap.get(tmp[1]));
                }
            }
            else {
                contextAttributs.set("$.Attributes." + ContactAttributes[i][0], ContactAttributes[i][1]);
            }
        }
    }
    catch (e) {
        let nextAction = await getNextActionForError(action, actions, ErrorTypes.NoMatchingError, smaEvent);
        return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
    }
    tmpMap.clear();
    let nextAction = findActionByID(actions, action.Transitions.NextAction);
    console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.NextAction);
    return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
}
