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
import { TerminatingFlowUtil } from "../utility/default-termination-action";
import { PlayAudioAndGetDigits } from "./play-audio-getdigits";
import { SpeakAndGetDigits } from "./speak-and-getdigits";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
/**
  * Making a SMA action to perform delivering an audio message or speech to obtain customer input.
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA action
  */
export class GetParticipantInput {
    async execute(smaEvent: any, action: any, contextStore: IContextStore) {
        let callId: string;
        try {
            // getting the CallID of the Active call from the SMA Event
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            if (action.Parameters.Media) {
                console.log(Attributes.DEFAULT_LOGGER + callId + " Play Audio And Get Digits");
                let playAudioGetDigits = new PlayAudioAndGetDigits();
                return await playAudioGetDigits.execute(smaEvent, action, contextStore);
            }
            else {
                console.log(Attributes.DEFAULT_LOGGER + callId + " Speak And Get Digits");
                let speakAndGetDigits = new SpeakAndGetDigits();
                return await speakAndGetDigits.execute(smaEvent, action, contextStore);
            }

        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of GetParticipantInput" + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }
    }
}
