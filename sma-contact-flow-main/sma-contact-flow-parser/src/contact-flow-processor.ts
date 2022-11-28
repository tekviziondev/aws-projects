import { loadContactFlow } from "./contact-flow-loader";
import { CallRecording } from "./SMA_Mapping_Actions/call-recording";
import { CompareAttribute } from "./SMA_Mapping_Actions/compare-attribute";
import { DisconnectParticipant } from "./SMA_Mapping_Actions/disconnect-participant";
import { EndModule } from "./SMA_Mapping_Actions/end-module";
import { GetParticipantInput } from "./SMA_Mapping_Actions/get-participant-input";
import { InvokeLambda } from "./SMA_Mapping_Actions/invoke-lambda";
import { InvokeModule } from "./SMA_Mapping_Actions/invoke-module";
import { LexBot } from "./SMA_Mapping_Actions/lex-bot";
import { Loop } from "./SMA_Mapping_Actions/loop";
import { MessageParticipant } from "./SMA_Mapping_Actions/message-participant";
import { SetVoice } from "./SMA_Mapping_Actions/set-voice";
import { TrasferToFlow } from "./SMA_Mapping_Actions/transfer-flow";
import { TransferTOThirdParty } from "./SMA_Mapping_Actions/transfer-to-thirdparty";
import { UpdateContactAttrbts } from "./SMA_Mapping_Actions/update-contact-attributes";
import { Wait } from "./SMA_Mapping_Actions/wait";
import { AmazonConnectActions } from "./const/amazon-connect-actionTypes";
import { CallDetailsUtil } from "./utility/call-details";
import { ConditionValidationUtil } from "./utility/condition-validation";
import { Attributes, ContextAttributes, ContextStore } from "./const/constant-values";
import { ErrorTypes } from "./const/error-types";
import { EventTypes } from "./const/event-types";
import { NextActionValidationUtil } from "./utility/next-action-error";
import { TerminatingFlowUtil } from "./utility/termination-action";
import { METRIC_PARAMS } from "./const/constant-values"
import { UpdateMetricUtil } from "./utility/metric-updation"
const connectContextStore: string = "ConnectContextStore";

/**
  * This function gets the  contact flow data from contact flow loader function and sends the contact flow data to the respective SMA Mapping functions.
  * @param smaEvent 
  * @param amazonConnectInstanceID
  * @param amazonConnectFlowID
  * @param bucketName
  * @returns SMA Action
  */
export async function processFlow(smaEvent: any, amazonConnectInstanceID: string, amazonConnectFlowID: string, bucketName: string) {
    let callId: string;
    let contextStore: any;
    try {
        let type = "Contact_Flow";
        const transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
        if (transactionAttributes) {
            if (transactionAttributes[Attributes.CONNECT_CONTEXT_STORE]) {
                contextStore = transactionAttributes[Attributes.CONNECT_CONTEXT_STORE]
            }

            if (transactionAttributes[Attributes.CONNECT_CONTEXT_STORE] && !transactionAttributes[Attributes.CONNECT_CONTEXT_STORE][ContextStore.ACTUAL_FLOW_ARN]) {
                transactionAttributes[Attributes.CONNECT_CONTEXT_STORE][ContextStore.ACTUAL_FLOW_ARN] = amazonConnectFlowID;
            }

            if (transactionAttributes[Attributes.CONNECT_CONTEXT_STORE] && transactionAttributes[Attributes.CONNECT_CONTEXT_STORE][ContextStore.TRANSFER_FLOW_ARN]) {
                amazonConnectFlowID = transactionAttributes[Attributes.CONNECT_CONTEXT_STORE][ContextStore.TRANSFER_FLOW_ARN];
            }

            if (transactionAttributes[Attributes.CONNECT_CONTEXT_STORE] && transactionAttributes[Attributes.CONNECT_CONTEXT_STORE][ContextStore.INVOKE_MODULE_ARN]) {
                type = "Invoke_Module"
                amazonConnectFlowID = transactionAttributes[Attributes.CONNECT_CONTEXT_STORE][ContextStore.INVOKE_MODULE_ARN];
            }
        }
        let updateMetric=new UpdateMetricUtil();
        let callDetails = new CallDetailsUtil();
        const legA = callDetails.getLegACallDetails(smaEvent)as any;
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        var flowLodingStartTime = new Date().getTime();
        const contactFlow = await loadContactFlow(amazonConnectInstanceID, amazonConnectFlowID, bucketName, smaEvent, type);
        var flowLoadingTime = new Date().getTime() - flowLodingStartTime;
        let params = METRIC_PARAMS
        const flowLoadingParams = {
            MetricData: [
                {
                    MetricName: "ContactFlowLoadingTime",
                    Dimensions: [
                        {
                            Name: 'InstanceId',
                            Value: amazonConnectInstanceID
                        },
                        {
                            Name: '',
                            Value: amazonConnectFlowID
                        }
                    ],
                    Unit: 'Milliseconds',
                    Value: flowLoadingTime,
                    Timestamp:new Date()
                },
            ],
            Namespace: 'FlowLoading_Time'
        };
        try {
            flowLoadingParams.MetricData[0].Dimensions[1].Name = "Contact Flow ID"
            if (type === "Invoke_Module") {
                flowLoadingParams.MetricData[0].Dimensions[1].Name = 'Module Flow ID'
            }
        } catch (error) {
            console.error(Attributes.DEFAULT_LOGGER + smaEvent.ActionData.Parameters.CallId + Attributes.METRIC_ERROR + error.message);
        }
        updateMetric.updateMetric(flowLoadingParams)
        console.log(Attributes.DEFAULT_LOGGER + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Loaded Contact Flow" + contactFlow);
        if (transactionAttributes && transactionAttributes.currentFlowBlock) {
            console.log(Attributes.DEFAULT_LOGGER + callId + " InvocationEventType:" + smaEvent.InvocationEventType);
            if (smaEvent.InvocationEventType === EventTypes.ACTION_SUCCESSFUL || smaEvent.InvocationEventType === EventTypes.CALL_ANSWERED) {
                if (smaEvent.ActionData.ReceivedDigits != null) {
                    const recieved_digits = smaEvent.ActionData.ReceivedDigits;
                    return await new ConditionValidationUtil().processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, recieved_digits, amazonConnectInstanceID, bucketName, contextStore);
                }
                return await processFlowActionSuccess(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, amazonConnectInstanceID, bucketName, contextStore);
            }
            else if (smaEvent.InvocationEventType === EventTypes.ACTION_FAILED || smaEvent.InvocationEventType === EventTypes.INVALID_LAMBDA_RESPONSE) {
                return await processFlowActionFailed(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, amazonConnectInstanceID, bucketName, contextStore);
            } else {
                let disconnect = new DisconnectParticipant();
                return await disconnect.processFlowActionDisconnectParticipant(smaEvent, contextStore)
            }
        }
        else {
            if (smaEvent.InvocationEventType === EventTypes.NEW_INBOUND_CALL) {
                let params = METRIC_PARAMS
                try {
                    params.MetricData[0].MetricName = "NO_OF_INCOMING_CALLS"
                    params.MetricData[0].Dimensions[0].Value = amazonConnectInstanceID
                    params.MetricData[0].Dimensions[1].Name = 'Contact Flow ID'
                    params.MetricData[0].Dimensions[1].Value = amazonConnectFlowID
                    updateMetric.updateMetric(params);
                } catch (error) {
                    console.error(Attributes.DEFAULT_LOGGER + smaEvent.ActionData.Parameters.CallId + Attributes.METRIC_ERROR + error.message);
                }

                let contextAttributes = await storeSystemAttributs(smaEvent, amazonConnectFlowID, amazonConnectInstanceID)
                contextStore = {
                    [ContextStore.LOOP_COUNT]: "0",
                    [ContextStore.TRANSFER_FLOW_ARN]: "",
                    [ContextStore.INVOKE_MODULE_ARN]: "",
                    [ContextStore.INVOKATION_MODULE_NEXT_ACTION]: "",
                    [ContextStore.ACTUAL_FLOW_ARN]: "",
                    [ContextStore.SPEECH_ATTRIBUTES]: {},
                    [ContextStore.CONTEXT_ATTRIBUTES]: contextAttributes,
                    [ContextStore.TMP_MAP]: {},
                    [ContextStore.PAUSE_ACTION]: null

                }
                const keys = Object.keys(contextAttributes);
                keys.forEach((key, index) => {
                    contextStore[ContextStore.CONTEXT_ATTRIBUTES][key] = contextAttributes[key];
                });

            }
            // We're at the root start from there
            return await processRootFlowBlock(smaEvent, contactFlow, amazonConnectInstanceID, bucketName, contextStore);
        }
    } catch (error) {
        console.log(Attributes.DEFAULT_LOGGER + callId + " There is an Error in processing the SMA Event" + error.message);
        return null;
    }
}

/**
  * This function stores the System attributes in the Map, when new NEW_INBOUND_CALL is recieved
  * @param smaEvent 
  * @param amazonConnectFlowID
  * @param amazonConnectInstanceID
  * @returns SMA Action
  */
async function storeSystemAttributs(smaEvent: any, amazonConnectFlowID: any, amazonConnectInstanceID: any) {
    let callDetails = new CallDetailsUtil();
        const legA = callDetails.getLegACallDetails(smaEvent)as any;

    let contextAttributes = {
        [ContextAttributes.CUSTOMER_ENDPOINT_ADDRESS]: legA.From,
        [ContextAttributes.SYSTEM_ENDPOINT_ADDRESS]: legA.To,
        [ContextAttributes.INITIATION_METHOD]: legA.Direction,
        [ContextAttributes.CONTACTID]: amazonConnectFlowID,
        [ContextAttributes.INSTANCE_ARN]: amazonConnectInstanceID,
        [ContextAttributes.CHANNEL]: Attributes.CHANNEL,
        [ContextAttributes.CUSTOMER_ENDPOINT_TYPE]: Attributes.CUSTOMER_ENDPOINT_TYPE,
        [ContextAttributes.SYSTEM_ENDPOINT_TYPE]: Attributes.SYSTEM_ENDPOINT_TYPE
    }

    return contextAttributes;
}

/**
  * This function is starting of the flow exection and gets the current action from the flow block and send to process flow action
  * @param smaEvent 
  * @param contactFlow
  * @param TransactionAttributes
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
export async function processRootFlowBlock(smaEvent: any, contactFlow: any, amazonConnectInstanceID: string, bucketName: string, contextStore: any) {
    // OK, time to figure out the root of the flow
    let callId: string;
    try {
        let callDetails = new CallDetailsUtil();
        const legA = callDetails.getLegACallDetails(smaEvent)as any;
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        if (contactFlow.StartAction) {
            const actions: any[] = contactFlow.Actions;
            console.log(Attributes.DEFAULT_LOGGER + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Root Flow Block The actions are" + actions)
            if (actions && actions.length > 0) {
                const currentAction = callDetails.findActionByID(actions, contactFlow.StartAction) as any;
                let actionType = currentAction.Type;
                if (!Object.values(AmazonConnectActions).includes(actionType)) {
                    return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, actionType)
                }
                console.log(Attributes.DEFAULT_LOGGER + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Root Flow Block The current Action is " + currentAction.Type)
                if (currentAction) {
                    return await processFlowAction(smaEvent, currentAction, actions, amazonConnectInstanceID, bucketName, contextStore);
                }
            }
        }
        return null;
    } catch (error) {
        console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in getting the Root Flow Block" + error.message);
        return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
    }
}

/**
  * This function process the flow actions and call the respective SMA Mapping Class based on the action type.
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns SMA Action
  */
export async function processFlowAction(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string, contextStore: any) {

    switch (action.Type) {
        case AmazonConnectActions.GET_PARTICIPANT_INPUT:
            let getParticipantInput = new GetParticipantInput();
            return await getParticipantInput.execute(smaEvent, action, contextStore);
        case AmazonConnectActions.MESSAGE_PARTICIPANT:
            let message_participant = new MessageParticipant();
            return await message_participant.execute(smaEvent, action, contextStore);
        case AmazonConnectActions.DISCONNECT_PARTICIPANT:
            let disconnect = new DisconnectParticipant();
            return await disconnect.processFlowActionDisconnectParticipant(smaEvent, contextStore);
        case AmazonConnectActions.WAIT:
            let wait = new Wait();
            return await wait.processFlowActionWait(smaEvent, action, actions, amazonConnectInstanceID, bucketName, contextStore);
        case AmazonConnectActions.UPDATE_CONTACT_RECORDING_BEHAVIOUR:
            let callRecording = new CallRecording();
            return await callRecording.processFlowActionUpdateContactRecordingBehavior(smaEvent, action, contextStore)
        case AmazonConnectActions.LOOP:
            let loop = new Loop();
            return await loop.processFlowActionLoop(smaEvent, action, actions, amazonConnectInstanceID, bucketName, contextStore)
        case AmazonConnectActions.TRANSFER_PARTICIPANT_TO_THIRD_PARTY:
            let transferThirdParty = new TransferTOThirdParty();
            return await transferThirdParty.processFlowActionTransferParticipantToThirdParty(smaEvent, action, contextStore)
        case AmazonConnectActions.CONNECT_PARTICIPANT_WITH_LEX_BOT:
            let lexbot = new LexBot();
            return await lexbot.processFlowActionConnectParticipantWithLexBot(smaEvent, action, contextStore)
        case AmazonConnectActions.TRANSFER_TO_FLOW:
            let transferToFlow = new TrasferToFlow()
            return await transferToFlow.processFlowActionTransferToFlow(smaEvent, action, amazonConnectInstanceID, bucketName, contextStore)
        case AmazonConnectActions.UPDATE_CONTACT_TEXT_TO_SPEECH:
            let updateVoice = new SetVoice();
            return await updateVoice.processFlowActionUpdateContactTextToSpeechVoice(smaEvent, action, actions, amazonConnectInstanceID, bucketName, contextStore)
        case AmazonConnectActions.INVOKE_LAMBDA_FUNCTION:
            let invokeLambda = new InvokeLambda();
            return await invokeLambda.processFlowActionInvokeLambdaFunction(smaEvent, action, actions, amazonConnectInstanceID, bucketName, contextStore)
        case AmazonConnectActions.UPDATE_CONTACT_ATTRIBUTES:
            let update = new UpdateContactAttrbts();
            return await update.processFlowActionUpdateContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName, contextStore)
        case AmazonConnectActions.COMPARE:
            let compare = new CompareAttribute();
            return await compare.processFlowActionCompareContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName, contextStore)
        case AmazonConnectActions.INVOKE_FLOW_MODULE:
            let invoke = new InvokeModule();
            return await invoke.processFlowActionInvokeFlowModule(smaEvent, action, amazonConnectInstanceID, bucketName, contextStore)
        case AmazonConnectActions.END_FLOW_MODULE_EXECUTION:
            let endModule = new EndModule()
            return await endModule.processFlowActionEndFlowModuleExecution(smaEvent, amazonConnectInstanceID, bucketName, contextStore)
        default:
            return null;
    }
}
/**
  * Processing the contact flow after recieving the successfull SMA event
  * @param smaEvent 
  * @param action
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns Process Flow Action or processFlowConditionValidation or terminatingFlowAction
  */

async function processFlowActionSuccess(smaEvent: any, action: any, contactFlow: any, amazonConnectInstanceID: string, bucketName: string, contextStore: any) {
    let callId: string;
    try {
        let callDetails = new CallDetailsUtil();
        const legA = callDetails.getLegACallDetails(smaEvent)as any;
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        let transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
        if (action.Parameters && action.Parameters.StoreInput == "True") {
            smaEvent.CallDetails.TransactionAttributes = updateConnectContextStore(transactionAttributes, "StoredCustomerInput", smaEvent.ActionData.ReceivedDigits);
        }
        if (smaEvent.ActionData.IntentResult) {
            let intentName = smaEvent.ActionData.IntentResult.SessionState.Intent.Name;
            return await new ConditionValidationUtil().processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, intentName, amazonConnectInstanceID, bucketName, contextStore);
        }
        const nextAction = callDetails.findActionByID(contactFlow.Actions, action.Transitions.NextAction) as any;
        let actionType = nextAction.Type;
        if (!Object.values(AmazonConnectActions).includes(actionType)) {
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, actionType)
        }
        return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName, smaEvent.CallDetails.TransactionAttributes[Attributes.CONNECT_CONTEXT_STORE]);
    } catch (error) {
        console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in proccessing the success SMA Event " + error.message);
        return null;
    }
}

function updateConnectContextStore(transactionAttributes: any, key: string, value: any) {
    if (transactionAttributes[connectContextStore]) transactionAttributes[connectContextStore][key] = value;
    else {
        transactionAttributes[connectContextStore] = {};
        transactionAttributes[connectContextStore][key] = value;
    }
    return transactionAttributes;


}

/**
  * Processing the contact flow after receiving the failure event from SMA
  * @param smaEvent 
  * @param actionObj 
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param contextStore
  * @returns Process Flow Action or terminatingFlowAction
  */
async function processFlowActionFailed(smaEvent: any, actionObj: any, contactFlow: any, amazonConnectInstanceID: string, bucketName: string, contextStore: any) {
    let callId: string;
    try {
        let callDetails = new CallDetailsUtil();
        const legA = callDetails.getLegACallDetails(smaEvent)as any;
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        let currentAction = contactFlow.Actions.find((action: any) => action.Identifier === actionObj.Identifier);
        let nextAction: any;
        if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.INPUT_TIME_LIMIT_EXCEEDS) || smaEvent.ActionData.ErrorType.includes(ErrorTypes.INVALID_DIGITS_RECEIVED)) {
            nextAction = await new NextActionValidationUtil().getNextActionForError(currentAction, contactFlow.Actions, ErrorTypes.INPUT_TIME_LIMIT_EXCEEDS, smaEvent);
        } else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.NO_MATCHING_CONDITION)) {
            nextAction = await new NextActionValidationUtil().getNextActionForError(currentAction, contactFlow, ErrorTypes.NO_MATCHING_CONDITION, smaEvent);
        }
        else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.CONNECTION_TIME_LIMIT_EXCEEDED)) {
            nextAction = await new NextActionValidationUtil().getNextActionForError(currentAction, contactFlow, ErrorTypes.CONNECTION_TIME_LIMIT_EXCEEDED, smaEvent);
        }
        else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.CALL_FAILED)) {
            nextAction = await new NextActionValidationUtil().getNextActionForError(currentAction, contactFlow, ErrorTypes.CALL_FAILED, smaEvent);
        } else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.INVALID_PHONE_NUMBER)) {
            nextAction = await new NextActionValidationUtil().getNextActionForError(currentAction, contactFlow, ErrorTypes.INVALID_PHONE_NUMBER, smaEvent);
        }
        else {
            let count: number;
            for (let i = 0; i < currentAction.Transitions.Errors.length; i++) {
                if (currentAction.Transitions.Errors[i].ErrorType == ErrorTypes.NO_MATCHING_ERROR) {
                    count = i;
                    break;
                }
            }
            nextAction = callDetails.findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[count].NextAction);
            console.log(Attributes.DEFAULT_LOGGER + callId + "Next Action identifier:" + nextAction);
        }

        let actionType = nextAction.Type;
        if (!Object.values(AmazonConnectActions).includes(actionType)) {
            return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, actionType)
        }
        return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName, contextStore);

    } catch (error) {
        console.error(Attributes.DEFAULT_LOGGER + callId + " There is an error in proccessing the failed SMA Event " + error.message);
        return null;
    }
}

