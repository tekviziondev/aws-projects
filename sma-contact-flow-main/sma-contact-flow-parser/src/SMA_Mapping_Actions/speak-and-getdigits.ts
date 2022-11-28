import { CallDetailsUtil } from "../utility/call-details";
import { ChimeActions } from "../const/chime-action-types";
import { TerminatingFlowUtil } from "../utility/default-termination-action";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { CloudWatchMetric } from "../utility/metric-updation";
import { SpeechParameter } from "./speech-parameter";
/**
  * Making the SMA action for converting the Text or SSML to perform speak and getdigits action.
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA action
  */
export class SpeakAndGetDigits extends SpeechParameter {
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
      if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
      console.log(Attributes.DEFAULT_LOGGER + callId + " Speak and Get Digits Action");

      let speech_parameter = await this.getSpeechParameters(smaEvent, action, contextStore, "SpeechParameters")
      let failure_parameter = await this.getSpeechParameters(smaEvent, action, contextStore, "FailureSpeechParameters")
      let smaAction = {
        Type: ChimeActions.SPEAK_AND_GET_DIGITS,
        Parameters: {
          "CallId": legA.CallId,
          "SpeechParameters": speech_parameter,
          "FailureSpeechParameters": failure_parameter,
          "MinNumberOfDigits": 1,
          "Repeat": 3,
        }
      };
      let text = smaAction.Parameters.SpeechParameters.Text
      // verifing if there are any Invalid_Text present.
      if (text.includes("$.")) {
        return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "Invalid_Text")
      }

      if (action.Parameters?.InputValidation) {
        if (action.Parameters?.InputValidation?.CustomValidation) {
          if (action.Parameters?.InputValidation?.CustomValidation?.MaximumLength) {
            smaAction.Parameters['MaxNumberOfDigits'] = action.Parameters?.InputValidation?.CustomValidation?.MaximumLength;
          }
        }
      }
      if (action.Parameters.DTMFConfiguration && action.Parameters.DTMFConfiguration.InputTerminationSequence) {
        smaAction.Parameters["TerminatorDigits"] = action.Parameters.DTMFConfiguration.InputTerminationSequence;
      }
      if (action.Parameters.InputTimeLimitSeconds) {
        const timeLimit: number = Number.parseInt(action.Parameters.InputTimeLimitSeconds);
        smaAction.Parameters["RepeatDurationInMilliseconds"] = timeLimit * 1000;
      }
      params.MetricData[0].MetricName = "SpeakAndGetDigitsSuccess"
      metric.updateMetric(params);
      let pauseAction = contextStore[ContextStore.PAUSE_ACTION];
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
    }
    catch (error) {
      params.MetricData[0].MetricName = "SpeakAndGetDigitsFailure"
      metric.updateMetric(params);
      console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of GetParticipantInput" + error.message);
      return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
    }
  }
}