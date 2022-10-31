import { getLegACallDetails } from "../utility/call-details";
import { ChimeActions } from "../utility/ChimeActionTypes";
import { ConstData } from "../utility/ConstantValues";
import { terminatingFlowAction } from "../utility/termination-event";

/**
  * Making a SMA action to perform delvier a Chat message and obtain customer input.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */

export class LexBot {
  async processFlowActionConnectParticipantWithLexBot(smaEvent: any, action: any, defaultLogger: string, puaseAction: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>) {
    let smaAction;
    const legA = getLegACallDetails(smaEvent);
    let smaAction1: any;
    let callId: string;
    callId = legA.CallId;
    if (!callId)
      callId = smaEvent.ActionData.Parameters.CallId;
    console.log(defaultLogger + callId + " Start Bot Conversation");
    try {
      if (action.Parameters.hasOwnProperty("LexSessionAttributes")) {
        smaAction = {
          Type: ChimeActions.StartBotConversation,
          Parameters: {
            BotAliasArn: action.Parameters.LexV2Bot.AliasArn,
            LocaleId: 'en_US',
            Configuration: {
              SessionState: {
                SessionAttributes: action.Parameters.LexSessionAttributes,
                DialogAction: {
                  Type: ConstData.dialogType
                }
              },
              WelcomeMessages: [
                {
                  ContentType: ConstData.ContentType,
                  Content: action.Parameters.Text
                },
              ]
            }
          }
        }
      }
      else {
        smaAction = {
          Type: ChimeActions.StartBotConversation,
          Parameters: {
            BotAliasArn: action.Parameters.LexV2Bot.AliasArn,
            LocaleId: 'en_US',
            Configuration: {
              SessionState: {
                DialogAction: {
                  Type: ConstData.dialogType
                }
              },
              WelcomeMessages: [
                {
                  ContentType: ConstData.ContentType,
                  Content: action.Parameters.Text
                },
              ]
            }
          }
        }
      }
      if (puaseAction != null && puaseAction && puaseAction != "") {
        smaAction1 = puaseAction;
        puaseAction = null;
        return {
          "SchemaVersion": "1.0",
          "Actions": [
            smaAction1, smaAction
          ],
          "TransactionAttributes": {
            "currentFlowBlock": action
          }
        }

      }

      return {
        "SchemaVersion": "1.0",
        "Actions": [
          smaAction
        ],
        "TransactionAttributes": {
          "currentFlowBlock": action
        }
      }
    } catch (error) {
      console.log(defaultLogger + callId + " There is an Error in execution of ConnectParticipantWithLexBot " + error.message);
      return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error")
    }

  }

}