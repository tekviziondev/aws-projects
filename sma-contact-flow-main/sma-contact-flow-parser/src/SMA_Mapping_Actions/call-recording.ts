import { getLegACallDetails } from "../utility/call-details";
import { ChimeActions } from "../utility/chime-action-types";
import { Attributes } from "../utility/constant-values";
import { terminatingFlowAction } from "../utility/termination-action";

/**
  * Making a SMA action to perform Call Recording and Start storing it in the S3 Bucket Location
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */

export class CallRecording {
    async processFlowActionUpdateContactRecordingBehavior(smaEvent: any, action: any, pauseAction: any, defaultLogger: string, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>) {
        let callId: string;
        try {
            let smaAction1: any;
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            if (action.Parameters.RecordingBehavior.RecordedParticipants.length < 1) {
                let smaAction = {
                    Type: ChimeActions.STOP_CALL_RECORDING,
                    Parameters: {
                        "CallId": legA.CallId
                    }
                };
                if (pauseAction) {
                    smaAction1 = pauseAction;
                    pauseAction = null;
                    return {
                        "SchemaVersion": Attributes.SCHEMA_VERSION,
                        "Actions": [
                            smaAction1, smaAction
                        ],
                        "TransactionAttributes": {
                            "currentFlowBlock": action
                        }
                    }

                }

                return {
                    "SchemaVersion": Attributes.SCHEMA_VERSION,
                    "Actions": [
                        smaAction
                    ],
                    "TransactionAttributes": {
                        "currentFlowBlock": action
                    }
                }
            }
            let smaAction = {
                Type: ChimeActions.START_CALL_RECORDING,
                Parameters: {
                    "CallId": legA.CallId,
                    "Track": Attributes.TRACK,
                    Destination: {
                        "Type": Attributes.DESTINATION_TYPE,
                        "Location": Attributes.destinationLocation
                    }
                }
            };
            if (pauseAction) {
                smaAction1 = pauseAction;
                pauseAction = null;
                return {
                    "SchemaVersion": Attributes.SCHEMA_VERSION,
                    "Actions": [
                        smaAction1, smaAction
                    ],
                    "TransactionAttributes": {
                        "currentFlowBlock": action
                    }
                }

            }
            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction
                ],
                "TransactionAttributes": {
                    "currentFlowBlock": action
                }
            }
        } catch (error) {
            console.error(defaultLogger + callId + " There is an Error in execution UpdateContactRecordingBehavior |" + error.message);
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction, "error")
        }
    }
}