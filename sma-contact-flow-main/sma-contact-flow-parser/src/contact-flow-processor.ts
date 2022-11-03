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
import { AmazonConnectActions } from "./utility/amazon-connect-actionTypes";
import { getLegACallDetails } from "./utility/call-details";
import { processFlowConditionValidation } from "./utility/condition-validation";
import { Attributes } from "./utility/constant-values";
import { ErrorTypes } from "./utility/error-types";
import { EventTypes } from "./utility/event-types";
import { findActionByID } from "./utility/find-action-id";
import { getNextActionForError } from "./utility/next-action-error";
import { terminatingFlowAction } from "./utility/termination-action";

const connectContextStore: string = "ConnectContextStore";
let loopMap = new Map<string, string>();
let ContactFlowARNMap = new Map<string, string>();
let InvokeModuleARNMap = new Map<string, string>();
let InvokationModuleNextAction = new Map<string, string>();
let ActualFlowARN = new Map<string, string>();
const SpeechAttributeMap: Map<string, string> = new Map<string, string>();
const contextAttributes: Map<any, any> = new Map<any, any>();
let tmpMap: Map<any, any> = new Map<any, any>();
const defaultLogger = "SMA-Contact-Flow-Builder | Call ID - "
let pauseAction: any;

/**
  * This function get connect flow data from contact flow loader 
  * and send the connect flow data to respective functions.
  * @param smaEvent 
  * @param amazonConnectInstanceID
  * @param amazonConnectFlowID
  * @param bucketName
  * @returns SMA Action
  */
export async function processFlow(smaEvent: any, amazonConnectInstanceID: string, amazonConnectFlowID: string, bucketName: string) {
    let callId: string;
    try {
        let type = "Contact_Flow";
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        if (!ActualFlowARN.has(callId)) {
            ActualFlowARN.set(callId, amazonConnectFlowID)
        }
        if (ContactFlowARNMap.has(callId)) {
            amazonConnectFlowID = (ContactFlowARNMap.get(callId))
        }
        if (InvokeModuleARNMap.has(callId)) {
            type = "Invoke_Module"
            amazonConnectFlowID = (InvokeModuleARNMap.get(callId))
        }
        const contactFlow = await loadContactFlow(amazonConnectInstanceID, amazonConnectFlowID, bucketName, smaEvent, type);
        console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Loaded Contact Flow" + contactFlow);
        console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " CallDetails:" + smaEvent.CallDetails);
        const transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
        console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " TransactionAttributes:" + transactionAttributes);
        if (transactionAttributes && transactionAttributes.currentFlowBlock) {
            console.log(defaultLogger + callId + " InvocationEventType:" + smaEvent.InvocationEventType);
            if (smaEvent.InvocationEventType === EventTypes.ACTION_SUCCESSFUL || smaEvent.InvocationEventType === EventTypes.CALL_ANSWERED) {
                if (smaEvent.ActionData.ReceivedDigits != null) {
                    const recieved_digits = smaEvent.ActionData.ReceivedDigits;
                    return await processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, recieved_digits, amazonConnectInstanceID, bucketName, defaultLogger, pauseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap);
                }
                return await processFlowActionSuccess(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, amazonConnectInstanceID, bucketName);
            }
            else if (smaEvent.InvocationEventType === EventTypes.ACTION_FAILED || smaEvent.InvocationEventType === EventTypes.INVALID_LAMBDA_RESPONSE) {
                return await processFlowActionFailed(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, amazonConnectInstanceID, bucketName);
            } else {
                let disconnect = new DisconnectParticipant();
                return await disconnect.processFlowActionDisconnectParticipant(smaEvent, transactionAttributes.currentFlowBlock, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction)
                // processFlowActionDisconnectParticipant(smaEvent, transactionAttributes.currentFlowBlock);
            }
        }
        else {
            if (smaEvent.InvocationEventType === EventTypes.NEW_INBOUND_CALL)
                storeSystemAttributs(smaEvent, amazonConnectFlowID, amazonConnectFlowID)
            // We're at the root start from there
            return await processRootFlowBlock(smaEvent, contactFlow, transactionAttributes, amazonConnectInstanceID, bucketName);
        }
    } catch (error) {
        console.log(defaultLogger + callId + " There is an Error in processing the SMA Event" + error.message);
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
    const legA = getLegACallDetails(smaEvent);
    contextAttributes.set("$.CustomerEndpoint.Address", legA.From)
    contextAttributes.set("$.SystemEndpoint.Address", legA.To)
    contextAttributes.set("$.InitiationMethod", legA.Direction)
    contextAttributes.set("$.ContactId", amazonConnectFlowID)
    contextAttributes.set("$.InstanceARN", amazonConnectInstanceID)
    contextAttributes.set("$.Channel", Attributes.CHANNEL)
    contextAttributes.set("$.CustomerEndpoint.Type", Attributes.CUSTOMER_ENDPOINT_TYPE)
    contextAttributes.set("$.SystemEndpoint.Type", Attributes.SYSTEM_ENDPOINT_TYPE)
}

/**
  * This function is starting of the flow exection.
  * Get current action from the flow block and send to process flow action
  * @param smaEvent 
  * @param contactFlow
  * @param _transactionAttributes
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
export async function processRootFlowBlock(smaEvent: any, contactFlow: any, _transactionAttributes: any, amazonConnectInstanceID: string, bucketName: string) {
    // OK, time to figure out the root of the flow
    let callId: string;
    try {
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        if (contactFlow.StartAction) {
            const actions: any[] = contactFlow.Actions;
            console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Root Flow Block The actions are" + actions)
            if (actions && actions.length > 0) {
                const currentAction = findActionByID(actions, contactFlow.StartAction);
                let actionType = currentAction.Type;
                if (!AmazonConnectActions.hasOwnProperty(actionType)) {
                    return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction, actionType)
                }
                console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Root Flow Block The current Action is " + currentAction.Type)
                if (currentAction) {
                    return await processFlowAction(smaEvent, currentAction, actions, amazonConnectInstanceID, bucketName);
                }
            }
        }
    } catch (error) {
        console.error(defaultLogger + callId + " There is an Error in getting the Root Flow Block" + error.message);
        return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction, "error")
    }
}

/**
  * This function process the flow actions and call the respective SMA Mapping Class based on the action type.
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
export async function processFlowAction(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string) {
    console.log("ProcessFlowAction:" + action);
    switch (action.Type) {
        case AmazonConnectActions.GET_PARTICIPANT_INPUT:
            let getParticipantInput = new GetParticipantInput();
            return await getParticipantInput.processFlowActionGetParticipantInput(smaEvent, action, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction);
        case AmazonConnectActions.MESSAGE_PARTICIPANT:
            let message_participant = new MessageParticipant();
            return await message_participant.processFlowActionMessageParticipant(smaEvent, action, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction);
        case AmazonConnectActions.DISCONNECT_PARTICIPANT:
            let disconnect = new DisconnectParticipant();
            return await disconnect.processFlowActionDisconnectParticipant(smaEvent, action, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction);
        case AmazonConnectActions.WAIT:
            let wait = new Wait();
            return await wait.processFlowActionWait(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, pauseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap);
        case AmazonConnectActions.UPDATE_CONTACT_RECORDING_BEHAVIOUR:
            let callRecording = new CallRecording();
            return await callRecording.processFlowActionUpdateContactRecordingBehavior(smaEvent, action, pauseAction, defaultLogger, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap)
        case AmazonConnectActions.LOOP:
            let loop = new Loop();
            return await loop.processFlowActionLoop(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, pauseAction, loopMap, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap)
        case AmazonConnectActions.TRANSFER_PARTICIPANT_TO_THIRD_PARTY:
            let transferThirdParty = new TransferTOThirdParty();
            return await transferThirdParty.processFlowActionTransferParticipantToThirdParty(smaEvent, action, defaultLogger, pauseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap)
        case AmazonConnectActions.CONNECT_PARTICIPANT_WITH_LEX_BOT:
            let lexbot = new LexBot();
            return await lexbot.processFlowActionConnectParticipantWithLexBot(smaEvent, action, defaultLogger, pauseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap)
        case AmazonConnectActions.TRANSFER_TO_FLOW:
            let transferToFlow = new TrasferToFlow()
            return await transferToFlow.processFlowActionTransferToFlow(smaEvent, action, amazonConnectInstanceID, bucketName, defaultLogger, ContactFlowARNMap, pauseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN)
        case AmazonConnectActions.UPDATE_CONTACT_TEXT_TO_SPEECH:
            let updateVoice = new SetVoice();
            return await updateVoice.processFlowActionUpdateContactTextToSpeechVoice(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, SpeechAttributeMap, pauseAction, contextAttributes, ActualFlowARN, ContactFlowARNMap)
        case AmazonConnectActions.INVOKE_LAMBDA_FUNCTION:
            let invokeLambda = new InvokeLambda();
            return await invokeLambda.processFlowActionInvokeLambdaFunction(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, contextAttributes, loopMap, tmpMap, pauseAction, SpeechAttributeMap, ContactFlowARNMap, ActualFlowARN)
        case AmazonConnectActions.UPDATE_CONTACT_ATTRIBUTES:
            let update = new UpdateContactAttrbts();
            return await update.processFlowActionUpdateContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, tmpMap, contextAttributes, SpeechAttributeMap, ActualFlowARN, ContactFlowARNMap, pauseAction)
        case AmazonConnectActions.COMPARE:
            let compare = new CompareAttribute();
            return await compare.processFlowActionCompareContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, contextAttributes, SpeechAttributeMap, ActualFlowARN, ContactFlowARNMap, pauseAction)
        case AmazonConnectActions.INVOKE_FLOW_MODULE:
            let invoke = new InvokeModule();
            return await invoke.processFlowActionInvokeFlowModule(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, InvokeModuleARNMap, InvokationModuleNextAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, pauseAction)
        case AmazonConnectActions.END_FLOW_MODULE_EXECUTION:
            let endModule = new EndModule()
            return await endModule.processFlowActionEndFlowModuleExecution(smaEvent, action, actions, amazonConnectInstanceID, bucketName, InvokeModuleARNMap, InvokationModuleNextAction, ActualFlowARN, defaultLogger, pauseAction, SpeechAttributeMap, contextAttributes, ContactFlowARNMap)
        default:
            null;
    }
}
/**
  * After received success event from SMA,process the next action.
  * @param smaEvent 
  * @param action
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns Process Flow Action
  */

async function processFlowActionSuccess(smaEvent: any, action: any, contactFlow: any, amazonConnectInstanceID: string, bucketName: string) {
    let callId: string;
    try {
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        let transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
        if (action.Parameters && action.Parameters.StoreInput == "True") {
            smaEvent.CallDetails.TransactionAttributes = updateConnectContextStore(transactionAttributes, "StoredCustomerInput", smaEvent.ActionData.ReceivedDigits);
        }
        if (smaEvent.ActionData.IntentResult) {
            let intentName = smaEvent.ActionData.IntentResult.SessionState.Intent.Name;
            return await processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, intentName, amazonConnectInstanceID, bucketName, defaultLogger, pauseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap);
        }
        const nextAction = findActionByID(contactFlow.Actions, action.Transitions.NextAction);
        let actionType = nextAction.Type;
        if (!AmazonConnectActions.hasOwnProperty(actionType)) {
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction, actionType)
        }
        return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName);
    } catch (error) {
        console.error(defaultLogger + callId + " There is an Error in Proccessing the Success SMA Event " + error.message);
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
  * After received failure event from SMA,process the next action.
  * @param smaEvent 
  * @param action
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns Process Flow Action
  */
async function processFlowActionFailed(smaEvent: any, actionObj: any, contactFlow: any, amazonConnectInstanceID: string, bucketName: string) {
    let callId: string;
    let smaAction1: any;
    try {
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        let currentAction = contactFlow.Actions.find((action: any) => action.Identifier === actionObj.Identifier);
        let smaAction: any;
        let nextAction: any;
        if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.INPUT_TIME_LIMIT_EXCEEDS) || smaEvent.ActionData.ErrorType.includes(ErrorTypes.INVALID_DIGITS_RECEIVED)) {
            nextAction = await getNextActionForError(currentAction, contactFlow.Actions, ErrorTypes.INPUT_TIME_LIMIT_EXCEEDS, smaEvent, defaultLogger, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, pauseAction);
            smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
        } else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.NO_MATCHING_CONDITION)) {
            nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes.NO_MATCHING_CONDITION, smaEvent, defaultLogger, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, pauseAction);
            smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
        }
        else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.CONNECTION_TIME_LIMIT_EXCEEDED)) {
            nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes.CONNECTION_TIME_LIMIT_EXCEEDED, smaEvent, defaultLogger, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, pauseAction);
            smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
        }
        else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.CALL_FAILED)) {
            nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes.CALL_FAILED, smaEvent, defaultLogger, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, pauseAction);
            smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];

        } else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.INVALID_PHONE_NUMBER)) {
            nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes.INVALID_PHONE_NUMBER, smaEvent, defaultLogger, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, pauseAction);
            smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];

        }
        else {
            let count: number;
            for (let i = 0; i < currentAction.Transitions.Errors.length; i++) {
                if (currentAction.Transitions.Errors[i].ErrorType == ErrorTypes.NO_MATCHING_ERROR) {
                    count = i;
                    break;
                }
            }
            nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[count].NextAction);
            console.log(defaultLogger + callId + "Next Action identifier:" + currentAction.Transitions.Errors[count].NextAction);
            smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];

        }
        let actionType = nextAction.Type;
        if (!AmazonConnectActions.hasOwnProperty(actionType)) {
            return await terminatingFlowAction(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, pauseAction, actionType)
        }
        if (pauseAction) {
            smaAction1 = pauseAction;
            pauseAction = null;
            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction1, smaAction
                ],
                "TransactionAttributes": {
                    "currentFlowBlock": nextAction
                }
            }

        }
        return {
            "SchemaVersion": Attributes.SCHEMA_VERSION,
            "Actions": [
                smaAction
            ],
            "TransactionAttributes": {
                "currentFlowBlock": nextAction
            }
        }
    } catch (error) {
        console.error(defaultLogger + callId + " There is an Error in Proccessing the Failed SMA Event " + error.message);
        return null;
    }
}