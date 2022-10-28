import { getLegACallDetails } from "../utility/call-details";
import { ChimeActions } from "../utility/ChimeActionTypes";
import { constActions, ConstData } from "../utility/ConstantValues";
import { terminatingFlowAction } from "../utility/termination-event";
/**
  * Making a SMA action to perform Call Recording.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */

export class CallRecording {
    async processFlowActionUpdateContactRecordingBehavior(smaEvent: any, action: any, puaseAction: any, defaultLogger: string, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>) {
        let callId: string;
        let smaAction1: any;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        try {
            if (action.Parameters.RecordingBehavior.RecordedParticipants.length < 1) {
                let smaAction = {
                    Type: ChimeActions.StopCallRecording,
                    Parameters: {
                        "CallId": legA.CallId
                    }
                };
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
            }
            let smaAction = {
                Type: ChimeActions.StartCallRecording,
                Parameters: {
                    "CallId": legA.CallId,
                    "Track": ConstData.Track,
                    Destination: {
                        "Type": ConstData.destinationType,
                        "Location": ConstData.destinationLocation
                    }
                }
            };
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
            console.log(defaultLogger + callId + " There is an Error in execution UpdateContactRecordingBehavior" + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, "error")
        }
    }
}
