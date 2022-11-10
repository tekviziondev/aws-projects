import { getLegACallDetails } from "../utility/call-details";
import { Attributes, ContextStore } from "../utility/constant-values"
import { ChimeActions } from "../utility/chime-action-types";
import { terminatingFlowAction } from "../utility/termination-action";

/**
  * Making a SMA action to perform Transfer a call to a phone number for voice interactions.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */

export class TransferTOThirdParty {
    async processFlowActionTransferParticipantToThirdParty(smaEvent: any, action: any,  contextStore: any){
        let callId: string;
        let smaAction1: any;
        try {
            const legA = getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let fromNumber = legA.From;
            if (action.Parameters.hasOwnProperty("CallerId")) {
                fromNumber = action.Parameters.CallerId.Number;
            }
            console.log(Attributes.DEFAULT_LOGGER + callId + " Transfering call to Third Party Number");
            let smaAction = {
                Type: ChimeActions.CALL_AND_BRIDGE,
                Parameters: {
                    "CallTimeoutSeconds": action.Parameters.ThirdPartyConnectionTimeLimitSeconds,
                    "CallerIdNumber": fromNumber,
                    "Endpoints": [
                        {
                            "BridgeEndpointType": Attributes.BRDIGE_ENDPOINT_TYPE,
                            "Uri": action.Parameters.ThirdPartyPhoneNumber
                        }
                    ]
                }

            };
            let pauseAction=contextStore[ContextStore.PAUSE_ACTION]
            if (pauseAction) {
                smaAction1 = pauseAction;
                contextStore[ContextStore.PAUSE_ACTION]=null
                return {
                    "SchemaVersion": Attributes.SCHEMA_VERSION,
                    "Actions": [
                        smaAction1, smaAction
                    ],
                    "TransactionAttributes": {
                        [Attributes.CURRENT_FLOW_BLOCK]: action,
                        [Attributes.CONNECT_CONTEXT_STORE]:contextStore
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
                    [Attributes.CONNECT_CONTEXT_STORE]:contextStore
                }
            }
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in execution of TransferToThirdParty " + error.message);
            return await terminatingFlowAction(smaEvent, "error")
        }

    }

}