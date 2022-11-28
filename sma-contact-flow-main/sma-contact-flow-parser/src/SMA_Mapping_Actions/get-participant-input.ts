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
