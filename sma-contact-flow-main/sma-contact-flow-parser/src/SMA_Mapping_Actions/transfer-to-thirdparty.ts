import { getLegACallDetails } from "../utility/call-details";
import { Attributes, ContextStore } from "../utility/constant-values"
import { ChimeActions } from "../utility/chime-action-types";
import { terminatingFlowAction } from "../utility/termination-action";
import { IContextStore } from "../utility/context-store";
import { METRIC_PARAMS } from "../utility/constant-values"
import { updateMetric } from "../utility/metric-updation"


/**
  * Making a SMA action to perform Transfer a call to a phone number for voice interactions.
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA Action
  */

export class TransferTOThirdParty {
    async processFlowActionTransferParticipantToThirdParty(smaEvent: any, action: any, contextStore: IContextStore) {
        let callId: string;
        let smaAction1: any;
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
            console.error(Attributes.DEFAULT_LOGGER + smaEvent.ActionData.Parameters.CallId+ Attributes.METRIC_ERROR + error.message);
        }
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
            params.MetricData[0].MetricName = "TransferToThirdPartySuccess"
            updateMetric(params);
            let pauseAction = contextStore[ContextStore.PAUSE_ACTION]
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
            params.MetricData[0].MetricName = "TransferToThirdPartyFailure"
            updateMetric(params);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of TransferToThirdParty " + error.message);
            return await terminatingFlowAction(smaEvent, "error")
        }

    }
}