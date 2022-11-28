import { CallDetailsUtil } from "../utility/call-details";
import { processFlowAction } from "../contact-flow-processor";
import { TerminatingFlowUtil } from "../utility/termination-action";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";

/**
  * Making a SMA action to perform Repeats the looping branch for the specified number of times. After which, the complete branch is followed.
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns SMA Action
  */
export class Loop {
    async processFlowActionLoop(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
        let callId: string;
        try {
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent)as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let ActualloopCountVal = action.Parameters.LoopCount;
            let loopCountVal = contextStore[ContextStore.LOOP_COUNT]
            if (loopCountVal !== ActualloopCountVal) {
                let nextAction = "";
                if (action.Transitions.Conditions[0].Condition.Operands[0] === 'ContinueLooping')
                    nextAction = callDetails.findActionByID(actions, action.Transitions.Conditions[0].NextAction) as any;
                else
                    nextAction = callDetails.findActionByID(actions, action.Transitions.Conditions[1].NextAction) as any;
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.Conditions[0].NextAction);
                let count = String(Number.parseInt(loopCountVal) + 1)
                contextStore[ContextStore.LOOP_COUNT] = count;
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
            } else {
                contextStore[ContextStore.LOOP_COUNT] = "0";
                let nextAction = "";
                if (action.Transitions.Conditions[0].Condition.Operands[0] === 'DoneLooping')
                    nextAction = callDetails.findActionByID(actions, action.Transitions.Conditions[0].NextAction) as any;
                else
                    nextAction = callDetails.findActionByID(actions, action.Transitions.Conditions[1].NextAction) as any;
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.Conditions[1].NextAction);
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
            }
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of Loop " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }

    }
}