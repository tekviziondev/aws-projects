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

import { CallDetailsUtil } from "./call-details";
import { TerminatingFlowUtil } from "./default-termination-action";
import { Attributes } from "../const/constant-values";

export class NextActionValidationUtil {

    /**
      * Based on the Error condition, the Next SMA action will be performed
      * @param smaEvent 
      * @param currentAction
      * @param contactFlow
      * @param ErrorType
      * @returns SMA action
      */
    async getNextActionForError(currentAction: any, contactFlow: any, ErrorType: any, smaEvent: any) {
        let callId: string;
        try {
            let callDetails = new CallDetailsUtil();
            // getting the CallID of the Active call from the SMA Event
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let nextAction: any;
            console.log(Attributes.DEFAULT_LOGGER + callId + " Error Action Count:" + currentAction.Transitions.Errors);
            console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action Validation:" + currentAction.Transitions.Errors.length);
            //Based on the error type the next action will be performed
            if (currentAction.Transitions.Errors.length > 2 && currentAction.Transitions.Errors[2].ErrorType.includes(ErrorType)) {
                nextAction = callDetails.findActionObjectByID(contactFlow, currentAction.Transitions.Errors[2].NextAction);
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + currentAction.Transitions.Errors[2].NextAction);
            } else if (currentAction.Transitions.Errors.length > 1 && currentAction.Transitions.Errors[1].ErrorType.includes(ErrorType)) {
                nextAction = callDetails.findActionObjectByID(contactFlow, currentAction.Transitions.Errors[1].NextAction);
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + currentAction.Transitions.Errors[1].NextAction);
            }
            else if (currentAction.Transitions.Errors.length > 0 && currentAction.Transitions.Errors[0].ErrorType.includes(ErrorType)) {
                nextAction = callDetails.findActionObjectByID(contactFlow, currentAction.Transitions.Errors[0].NextAction);
                console.log(Attributes.DEFAULT_LOGGER + callId + " Next Action identifier:" + currentAction.Transitions.Errors[0].NextAction);
            }
            return nextAction;
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of getting the Next action for Error case " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }
    }
}
