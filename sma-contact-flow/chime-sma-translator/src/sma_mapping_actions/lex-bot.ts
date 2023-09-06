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
import { ChimeActions } from "../const/chime-action-types";
import { Attributes, ContextStore } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { TerminatingFlowUtil } from "../utility/default-termination-action";
import { CloudWatchMetric } from "../utility/metric-updation"

/**
  * Making a SMA action to perform delvier a Chat/Voice message and obtain customer input.
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA action
  */
export class LexBot {
  async processFlowActionConnectParticipantWithLexBot(smaEvent: any, action: any, contextStore: IContextStore) {
    let smaAction;
    let smaAction1: any;
    let callId: string;
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
      console.log(Attributes.DEFAULT_LOGGER + callId + " Start Bot Conversation");
      // checking user specified any lex session attributes in the Contact Flow
      if (action.Parameters.hasOwnProperty("LexSessionAttributes")) {
        smaAction = {
          Type: ChimeActions.START_BOT_CONVERSATION,
          Parameters: {
            CallId:callId,
            ParticipantTag: "LEG-A",
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
            CallId:callId,
            ParticipantTag: "LEG-A",
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
      params.MetricData[0].MetricName = "LexBotFailure"
      metric.updateMetric(params);
      console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of ConnectParticipantWithLexBot " + error.message);
      return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
    }

  }

}
