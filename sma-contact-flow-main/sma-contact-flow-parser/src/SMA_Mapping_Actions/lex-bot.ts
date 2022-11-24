import { getLegACallDetails } from "../utility/call-details";
import { ChimeActions } from "../utility/chime-action-types";
import { Attributes, ContextStore } from "../utility/constant-values";
import { IContextStore } from "../utility/context-store";
import { terminatingFlowAction } from "../utility/termination-action";
import { METRIC_PARAMS } from "../utility/constant-values"
import { updateMetric } from "../utility/metric-updation"

/**
  * Making a SMA action to perform delvier a Chat message and obtain customer input.
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA Action
  */
export class LexBot {
  async processFlowActionConnectParticipantWithLexBot(smaEvent: any, action: any, contextStore: IContextStore) {
    let smaAction;
    let smaAction1: any;
    let callId: string;
    let params = METRIC_PARAMS
    try {
      params.MetricData[0].Dimensions[0].Value = contextStore.ContextAttributes['$.InstanceARN']
      if (contextStore['InvokeModuleARN']) {
        params.MetricData[0].Dimensions[1].Name = 'Module Flow ID'
        params.MetricData[0].Dimensions[1].Value = contextStore['InvokeModuleARN']
      }
      else if (contextStore['TransferFlowARN']) {
        params.MetricData[0].Dimensions[1].Name = 'Contact Flow ID'
        params.MetricData[0].Dimensions[1].Value = contextStore['TransferFlowARN']
      }
      else {
        params.MetricData[0].Dimensions[1].Name = 'Contact Flow ID'
        params.MetricData[0].Dimensions[1].Value = contextStore['ActualFlowARN']
      }
    } catch (error) {
      console.error(Attributes.DEFAULT_LOGGER + smaEvent.ActionData.Parameters.CallId + " There is an Error in creating the Metric Params " + error.message);
    }
    try {
      const legA = getLegACallDetails(smaEvent);
      callId = legA.CallId;
      if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
      console.log(Attributes.DEFAULT_LOGGER + callId + " Start Bot Conversation");
      if (action.Parameters.hasOwnProperty("LexSessionAttributes")) {
        smaAction = {
          Type: ChimeActions.START_BOT_CONVERSATION,
          Parameters: {
            BotAliasArn: action.Parameters.LexV2Bot.AliasArn,
            LocaleId: 'en_US',
            Configuration: {
              SessionState: {
                SessionAttributes: action.Parameters.LexSessionAttributes,
                DialogAction: {
                  Type: Attributes.DIALOG_TYPE
                }
              },
              WelcomeMessages: [
                {
                  ContentType: Attributes.CONTENT_TYPE,
                  Content: action.Parameters.Text
                },
              ]
            }
          }
        }
      }
      else {
        smaAction = {
          Type: ChimeActions.START_BOT_CONVERSATION,
          Parameters: {
            BotAliasArn: action.Parameters.LexV2Bot.AliasArn,
            LocaleId: 'en_US',
            Configuration: {
              SessionState: {
                DialogAction: {
                  Type: Attributes.DIALOG_TYPE
                }
              },
              WelcomeMessages: [
                {
                  ContentType: Attributes.CONTENT_TYPE,
                  Content: action.Parameters.Text
                },
              ]
            }
          }
        }
      }
      let pauseAction = contextStore[ContextStore.PAUSE_ACTION]
      params.MetricData[0].MetricName = "LexBotSuccess"
      updateMetric(params);
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
      params.MetricData[0].MetricName = "LexBotFailure"
      updateMetric(params);
      console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of ConnectParticipantWithLexBot " + error.message);
      return await terminatingFlowAction(smaEvent, "error")
    }

  }

}
