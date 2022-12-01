import { CallDetailsUtil } from "../utility/call-details";
import { Attributes, ContextStore } from "../const/constant-values"
import { ChimeActions } from "../const/chime-action-types";
import { TerminatingFlowUtil } from "../utility/default-termination-action";
import { IContextStore } from "../const/context-store";
import { CloudWatchMetric } from "../utility/metric-updation"


/**
  * Making a SMA action to perform Transfer a call to a third party PSTN number
  * @param smaEvent 
  * @param action
  * @param contextStore
  * @returns SMA action
  */

export class TransferTOThirdParty {
    async processFlowActionTransferParticipantToThirdParty(smaEvent: any, action: any, contextStore: IContextStore) {
        let callId: string;
        let smaAction1: any;
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
            metric.updateMetric(params);
            let pauseAction = contextStore[ContextStore.PAUSE_ACTION]
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
            params.MetricData[0].MetricName = "TransferToThirdPartyFailure"
            metric.updateMetric(params);
            console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of TransferToThirdParty " + error.message);
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
        }

    }
}