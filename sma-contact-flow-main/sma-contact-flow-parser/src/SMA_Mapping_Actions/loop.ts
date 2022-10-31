import { getLegACallDetails } from "../utility/call-details";
import { processFlowAction } from "../contact-flow-processor";
import { findActionByID } from "../utility/find-action-id";
import { terminatingFlowAction } from "../utility/termination-event";

/**
  * Making a SMA action to perform Repeats the looping branch for the specified number of times. After which, the complete branch is followed.
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
export class Loop {
    async processFlowActionLoop(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, defaultLogger: string, puaseAction: any, loopMap: Map<string, string>, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>) {
        let smaAction: any;
        let smaAction1: any;
        let callId: string;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            if (!loopMap.has(callId) || loopMap.get(callId) != action.Parameters.LoopCount) {
                const nextAction = findActionByID(actions, action.Transitions.Conditions[1].NextAction);
                console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.Conditions[1].NextAction);
                smaAction = await (await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName)).Actions[0];
                let count = String(Number.parseInt(loopMap.get(callId)) + 1)
                if (!loopMap.has(callId))
                    loopMap.set(callId, "1");
                else
                    loopMap.set(callId, count);
                console.log("Next Action Data:" + smaAction);
                if (puaseAction != null && puaseAction && puaseAction != "") {
                    smaAction1 = puaseAction;
                    puaseAction = null;
                    return {
                        "SchemaVersion": "1.0",
                        "Actions": [
                            smaAction1, smaAction
                        ],
                        "TransactionAttributes": {
                            "currentFlowBlock": nextAction
                        }
                    }
                }
                return {
                    "SchemaVersion": "1.0",
                    "Actions": [
                        smaAction
                    ],
                    "TransactionAttributes": {
                        "currentFlowBlock": nextAction
                    }
                }
            } else {
                loopMap.delete(callId);
                let nextAction = findActionByID(actions, action.Transitions.Conditions[0].NextAction);
                console.log(defaultLogger + callId + " Next Action identifier:" + action.Transitions.Conditions[0].NextAction);
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
            }
        } catch (error) {
            console.log(defaultLogger + callId + " There is an Error in execution of Loop " + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error")
        }

    }
}