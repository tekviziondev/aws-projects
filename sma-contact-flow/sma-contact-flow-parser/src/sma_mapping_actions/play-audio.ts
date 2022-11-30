import { CallDetailsUtil } from "../utility/call-details";
import { ChimeActions } from "../const/chime-action-types";
import { AudioParameter } from "./audio-parameters";
import { TerminatingFlowUtil } from "../utility/default-termination-action";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { CloudWatchMetric } from "../utility/metric-updation"
/**
  * Making a SMA action to play the Audio File from S3 bucket location
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA action
  */

export class PlayAudio extends AudioParameter {
    async execute(smaEvent: any, action: any, contextStore: IContextStore) {
        let callId: string;
        let smaAction1: any;
        // creating cloud watch metric parameter and updating the metric details in cloud watch
        let metric = new CloudWatchMetric();
        let params = metric.createParams(contextStore, smaEvent);
        try {
            // getting the CallID of the Active call from the SMA Event
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent) as any;
            callId = legA.CallId;
            let pauseAction = contextStore[ContextStore.PAUSE_ACTION];
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            console.log(Attributes.DEFAULT_LOGGER + callId + "Play Audio Action");
            let audio_parameters = await this.getAudioParameters(smaEvent, action, "PlayAudio");
            let smaAction = {
                Type: ChimeActions.PLAY_AUDIO,
                Parameters: {
                    "CallId": callId, //Optional
                    "AudioSource": audio_parameters //Mandatory
                }
            };
            params.MetricData[0].MetricName = "PlayAudioSuccess"
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
            params.MetricData[0].MetricName = "PlayAudioFailure"
            metric.updateMetric(params);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of PlayAudio " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }
    }

}
