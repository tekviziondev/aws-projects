import { getLegACallDetails } from "../utility/call-details";
import { processFlowAction } from "../contact-flow-processor";
import { findActionByID } from "../utility/find-action-id";
import { terminatingFlowAction } from "../utility/termination-action";
import { Attributes } from "../utility/constant-values";

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
    async processFlowActionLoop(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore:any) {
        let smaAction: any;
        let smaAction1: any;
        let callId: string;

        try {
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let ActualloopCountVal = action.Parameters.LoopCount;
            let loopCountVal = contextStore['LoopCount']
            console.log("loopCountVal: "+loopCountVal);
            if (loopCountVal!==ActualloopCountVal){
                    let nextAction = "";
                    if(action.Transitions.Conditions[0].Condition.Operands[0]==='ContinueLooping')
                    nextAction= findActionByID(actions, action.Transitions.Conditions[0].NextAction)
                    else
                    nextAction= findActionByID(actions, action.Transitions.Conditions[1].NextAction)
                    console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.Conditions[0].NextAction);
                    smaAction = await (await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore)).Actions[0];
                    let count = String(Number.parseInt(loopCountVal) + 1)
                    contextStore["LoopCount"]=count;
                    let pauseAction=contextStore['PauseAction']
                    if (pauseAction) {
                        smaAction1 = pauseAction;
                        contextStore['PauseAction']=null
                        return {
                            "SchemaVersion": Attributes.SCHEMA_VERSION,
                            "Actions": [
                                smaAction1, smaAction
                            ],
                            "TransactionAttributes": {
                                "currentFlowBlock": nextAction,
                                "ConnectContextStore": contextStore
                            }
                        }
                    }
                    return {
                        "SchemaVersion": Attributes.SCHEMA_VERSION,
                        "Actions": [
                            smaAction
                        ],
                        "TransactionAttributes": {
                            "currentFlowBlock": nextAction,
                            "ConnectContextStore": contextStore
                        }
                    }
                } else {
                    contextStore['LoopCount']="0";
                    let nextAction = "";
                    if(action.Transitions.Conditions[0].Condition.Operands[0]==='DoneLooping')
                    nextAction= findActionByID(actions, action.Transitions.Conditions[0].NextAction)
                    else
                    nextAction= findActionByID(actions, action.Transitions.Conditions[1].NextAction)
                    console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.Conditions[1].NextAction);
                    return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
                }
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of Loop " + error.message);
            return await terminatingFlowAction(smaEvent, "error")
        }

    }
}