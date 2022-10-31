import { processFlowAction } from "../contact-flow-processor";
import { getLegACallDetails } from "../utility/call-details";
import { ChimeActions } from "../utility/ChimeActionTypes";
import { constActions } from "../utility/ConstantValues";
import { findActionByID } from "../utility/find-action-id";
import { terminatingFlowAction } from "../utility/termination-event";
/**
  * Making a SMA action to perform Wait for a specified period of time.
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
export class Wait {
    async processFlowActionWait(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, puaseAction: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>) {
        let callId: string;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            console.log(defaultLogger + callId + " Pause Action");
            let timeLimit = getWaitTimeParameter(action)
            let smaAction = {
                Type: ChimeActions.Pause,
                Parameters: {
                    "DurationInMilliseconds": timeLimit
                }
            };
            const nextAction = findActionByID(actions, action.Transitions.Conditions[0].NextAction);
            console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.Conditions[0].NextAction);
            let smaAction1 = await (await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName)).Actions[0];
            let smaAction1_Type: string = nextAction.Type
            if (constActions.includes(smaAction1_Type)) {
                console.log(defaultLogger + callId + " Pause action is Performed for " + timeLimit + " Milliseconds");
                puaseAction = smaAction;
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName)
            }
            console.log(defaultLogger + callId + "Next Action Data:" + smaAction1);
            return {
                "SchemaVersion": "1.0",
                "Actions": [
                    smaAction, smaAction1
                ],
                "TransactionAttributes": {
                    "currentFlowBlock": nextAction
                }
            }
        } catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution of TransferToThirdParty " + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error")
        }

    }
}
function getWaitTimeParameter(action: any) {
    let rv: string;
    if (action.TimeLimitSeconds !== null) {
        const timeLimitSeconds: number = Number.parseInt(action.Parameters.TimeLimitSeconds);
        rv = String(timeLimitSeconds * 1000)
    }
    console.log("Wait Parameter : " + rv);
    return rv;
}