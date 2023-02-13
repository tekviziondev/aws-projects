/*
Copyright (c) 2023 tekVizion PVS, Inc. 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { CallDetailsUtil } from "../utility/call-details";
import { processFlowAction } from "../contact-flow-processor";
import { TerminatingFlowUtil } from "../utility/default-termination-action";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";

/**
  * Making a SMA action to perform Repeats the looping action block for the specified number of times. After which, the loop complete block will be executed
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns SMA action
  */
export class Loop {
    async processFlowActionLoop(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore: IContextStore) {
        let callId: string;
        try {
            // getting the CallID of the Active call from the SMA Event
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let ActualloopCountVal = action.Parameters.LoopCount;
            let loopCountVal = contextStore[ContextStore.LOOP_COUNT]
            // checking the loop count value in the context store with the loop count value defined in the Contact Flow
            if (loopCountVal !== ActualloopCountVal) {
                let nextAction = "";
                if (action.Transitions.Conditions[0].Condition.Operands[0] === 'ContinueLooping')
                    nextAction = callDetails.findActionObjectByID(actions, action.Transitions.Conditions[0].NextAction) as any;
                else
                    nextAction = callDetails.findActionObjectByID(actions, action.Transitions.Conditions[1].NextAction) as any;
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.Conditions[0].NextAction);
                // increasing the loop count by 1 in the contextstore
                let count = String(Number.parseInt(loopCountVal) + 1)
                contextStore[ContextStore.LOOP_COUNT] = count;
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
            } else {
                // update the loop count value as 0 in the contextstore, once both actual and contextstore loop count values are equal
                contextStore[ContextStore.LOOP_COUNT] = "0";
                let nextAction = "";
                if (action.Transitions.Conditions[0].Condition.Operands[0] === 'DoneLooping')
                    nextAction = callDetails.findActionObjectByID(actions, action.Transitions.Conditions[0].NextAction) as any;
                else
                    nextAction = callDetails.findActionObjectByID(actions, action.Transitions.Conditions[1].NextAction) as any;
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + action.Transitions.Conditions[1].NextAction);
                return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName, contextStore);
            }
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of Loop " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }

    }
}