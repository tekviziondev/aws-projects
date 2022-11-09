import { processFlowAction } from "../contact-flow-processor";
import { getLegACallDetails } from "../utility/call-details";
import { ChimeActions } from "../utility/chime-action-types";
import { Supported_Actions } from "../utility/constant-values";
import { findActionByID } from "../utility/find-action-id";
import { terminatingFlowAction } from "../utility/termination-action";
import { Attributes } from "../utility/constant-values";
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
    async processFlowActionWait(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore:any){
        let callId: string;
        try {
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            console.log(Attributes.DEFAULT_LOGGER + callId + " Pause Action");
            let timeLimit = getWaitTimeParameter(action)
            let smaAction = {
                Type: ChimeActions.PAUSE,
                Parameters: {
                    "DurationInMilliseconds": timeLimit
                }
            };
            const nextAction = findActionByID(actions, action.Transitions.Conditions[0].NextAction);
            console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.Conditions[0].NextAction);
            let smaAction1 = await (await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName,contextStore)).Actions[0];
            let smaAction1_Type: string = nextAction.Type
            if (Supported_Actions.includes(smaAction1_Type)) {
                console.log(Attributes.DEFAULT_LOGGER + callId + " Pause action is Performed for " + timeLimit + " Milliseconds");
                contextStore['PauseAction'] = smaAction;
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore)
            }
            console.log(Attributes.DEFAULT_LOGGER + callId + "Next Action Data:" + smaAction1);
            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction, smaAction1
                ],
                "TransactionAttributes": {
                    "currentFlowBlock": nextAction,
                    "ConnectContextStore":contextStore
                    
                }
            }
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of TransferToThirdParty " + error.message);
            return await terminatingFlowAction(smaEvent, "error")
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