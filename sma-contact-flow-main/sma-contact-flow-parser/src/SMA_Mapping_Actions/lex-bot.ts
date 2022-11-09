import { getLegACallDetails } from "../utility/call-details";
import { ChimeActions } from "../utility/chime-action-types";
import { Attributes } from "../utility/constant-values";
import { terminatingFlowAction } from "../utility/termination-action";

/**
  * Making a SMA action to perform delvier a Chat message and obtain customer input.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */
export class LexBot {
  async processFlowActionConnectParticipantWithLexBot(smaEvent: any, action: any, contextStore:any) {
    let smaAction;
    let smaAction1: any;
    let callId: string;
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
      let pauseAction=contextStore['PauseAction']
      if (pauseAction) {
        smaAction1 = pauseAction;
        contextStore['PauseAction']=null
        return {
          "SchemaVersion": Attributes.SCHEMA_VERSION,
          "Actions": [
            smaAction1, smaAction
          ],
          "TransactionAttributes": {
            "currentFlowBlock": action,
            "ConnectContextStore":contextStore
          }
        }

      }

      return {
        "SchemaVersion": Attributes.SCHEMA_VERSION,
        "Actions": [
          smaAction
        ],
        "TransactionAttributes": {
          "currentFlowBlock": action,
          "ConnectContextStore":contextStore
        }
      }
    } catch (error) {
      console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of ConnectParticipantWithLexBot " + error.message);
      return await terminatingFlowAction(smaEvent, "error")
    }

  }

}