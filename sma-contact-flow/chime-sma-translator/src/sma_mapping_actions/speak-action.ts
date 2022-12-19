import { CallDetailsUtil } from "../utility/call-details";
import { ChimeActions } from "../const/chime-action-types";
import { TerminatingFlowUtil } from "../utility/default-termination-action";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { CloudWatchMetric } from "../utility/metric-updation";
import { SpeechParameter } from "./speech-parameter";
/**
  * Making the SMA action for converting the Text or SSML to perform speak action.
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA action
  */
export class SpeakAction extends SpeechParameter {
    async execute(smaEvent: any, action: any, contextStore: IContextStore) {
        let callId: string;
        // getting the CallID of the Active call from the SMA Event
        let callDetails = new CallDetailsUtil();
        const legA = callDetails.getLegACallDetails(smaEvent) as any;
        // creating cloud watch metric parameter and updating the metric details in cloud watch
        let metric = new CloudWatchMetric();
        let params = metric.createParams(contextStore, smaEvent);
        try {
            let smaAction1: any;
            let engine = Attributes.ENGINE
            let pauseAction = contextStore[ContextStore.PAUSE_ACTION];
            // verifing if there are any Invalid_Text present.
            let speech_parameter = await this.getSpeechParameters(smaEvent, action, contextStore, "SpeechParameters")
            if (speech_parameter['Text'].includes("$.")) {
                return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "Invalid_Text")
            }
            let smaAction = {
                Type: ChimeActions.SPEAK,
                Parameters: {
                    Engine: engine,
                    CallId: legA.CallId,
                    Text: speech_parameter['Text'],
                    TextType: speech_parameter['TextType'],
                    LanguageCode: speech_parameter['LanguageCode'],
                    VoiceId: speech_parameter['VoiceId']

                }
            };
            params.MetricData[0].MetricName = "SpeakSuccess"
            metric.updateMetric(params);
            // checking if the pause action is there to perform before the actual action
            if (pauseAction) {
                smaAction1 = pauseAction;
                contextStore[ContextStore.PAUSE_ACTION] = null
                return {
                    "SchemaVersion": Attributes.SCHEMA_VERSION,
                    "Actions": [
                        smaAction1, smaAction
                    ],
                    "TransactionAttributes": {
                        [Attributes.CURRENT_FLOW_BLOCK]: action,
                        [Attributes.CONNECT_CONTEXT_STORE]: contextStore
                    }
                }

            }
            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction
                ],
                "TransactionAttributes": {
                    [Attributes.CURRENT_FLOW_BLOCK]: action,
                    [Attributes.CONNECT_CONTEXT_STORE]: contextStore
                }
            }

        } catch (error) {
            params.MetricData[0].MetricName = "SpeakFailure"
            metric.updateMetric(params);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of MessageParticipant " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }

    }
}
