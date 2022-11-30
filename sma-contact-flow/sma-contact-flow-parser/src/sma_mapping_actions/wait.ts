import { processFlowAction } from "../contact-flow-processor";
import { CallDetailsUtil } from "../utility/call-details";
import { ChimeActions } from "../const/chime-action-types";
import { ContextStore } from "../const/constant-values";
import { TerminatingFlowUtil } from "../utility/default-termination-action";
import { Attributes } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
/**
  * Making a SMA action to perform Wait for a specified period of time.
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns SMA action
  */
export class Wait {
    async processFlowActionWait(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
        let callId: string;
        try {
            // getting the CallID of the Active call from the SMA Event
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            console.log(Attributes.DEFAULT_LOGGER + callId + " Pause Action");
            let timeLimit = getWaitTimeParameter(action)
            let smaAction = {
                Type: ChimeActions.PAUSE,
                Parameters: {
                    "DurationInMilliseconds": timeLimit //Mandatory
                }
            };
            const nextAction = callDetails.findActionObjectByID(actions, action.Transitions.Conditions[0].NextAction);
            console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + nextAction);
            console.log(Attributes.DEFAULT_LOGGER + callId + " Pause action is Performed for " + timeLimit + " Milliseconds");
            contextStore[ContextStore.PAUSE_ACTION] = smaAction;
            return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore)
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of Wait action " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
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
