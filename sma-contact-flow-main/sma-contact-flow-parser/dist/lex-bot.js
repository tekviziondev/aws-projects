"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LexBot = void 0;
const call_details_1 = require("./utility/call-details");
const ChimeActionTypes_1 = require("./utility/ChimeActionTypes");
const ConstantValues_1 = require("./utility/ConstantValues");
/**
  * Making a SMA action to perform delvier a Chat message and obtain customer input.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
class LexBot {
    async processFlowActionConnectParticipantWithLexBot(smaEvent, action, defaultLogger, puaseAction) {
        let smaAction;
        const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
        let smaAction1;
        let callId;
        callId = legA.CallId;
        if (callId == "NaN")
            callId = smaEvent.ActionData.Parameters.CallId;
        console.log(defaultLogger + callId + " Start Bot Conversation");
        if (action.Parameters.hasOwnProperty("LexSessionAttributes")) {
            smaAction = {
                Type: ChimeActionTypes_1.ChimeActions.StartBotConversation,
                Parameters: {
                    BotAliasArn: action.Parameters.LexV2Bot.AliasArn,
                    LocaleId: 'en_US',
                    Configuration: {
                        SessionState: {
                            SessionAttributes: action.Parameters.LexSessionAttributes,
                            DialogAction: {
                                Type: ConstantValues_1.ConstData.dialogType
                            }
                        },
                        WelcomeMessages: [
                            {
                                ContentType: ConstantValues_1.ConstData.ContentType,
                                Content: action.Parameters.Text
                            },
                        ]
                    }
                }
            };
        }
        else {
            smaAction = {
                Type: ChimeActionTypes_1.ChimeActions.StartBotConversation,
                Parameters: {
                    BotAliasArn: action.Parameters.LexV2Bot.AliasArn,
                    LocaleId: 'en_US',
                    Configuration: {
                        SessionState: {
                            DialogAction: {
                                Type: ConstantValues_1.ConstData.dialogType
                            }
                        },
                        WelcomeMessages: [
                            {
                                ContentType: ConstantValues_1.ConstData.ContentType,
                                Content: action.Parameters.Text
                            },
                        ]
                    }
                }
            };
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
            };
        }
        return {
            "SchemaVersion": "1.0",
            "Actions": [
                smaAction
            ],
            "TransactionAttributes": {
                "currentFlowBlock": action
            }
        };
    }
}
exports.LexBot = LexBot;
