import { CallDetailsUtil } from "../utility/call-details";
import { Attributes, ContextStore } from "../const/constant-values"
import { ChimeActions } from "../const/chime-action-types";
import { TerminatingFlowUtil } from "../utility/termination-action";
import { IContextStore } from "../const/context-store";
import { METRIC_PARAMS } from "../const/constant-values"
import { UpdateMetricUtil } from "../utility/metric-updation"


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
        let updateMetric=new UpdateMetricUtil();
        try {
            let callDetails = new CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent)as any;
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
                    "CallTimeoutSeconds": action.Parameters.ThirdPartyConnectionTimeLimitSeconds, //Optional
                    "CallerIdNumber": fromNumber, //Mandatory
                    "Endpoints": [
                        {
                            "BridgeEndpointType": Attributes.BRDIGE_ENDPOINT_TYPE, //Mandatory
                            "Uri": action.Parameters.ThirdPartyPhoneNumber //Mandatory
                        }
                    ]
                }

            };
            params.MetricData[0].MetricName = "TransferToThirdPartySuccess"
            updateMetric.updateMetric(params);
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
            updateMetric.updateMetric(params);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of TransferToThirdParty " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }

    }
}