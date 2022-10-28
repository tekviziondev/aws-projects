"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFlowAction = exports.processRootFlowBlock = exports.processFlow = void 0;
const contact_flow_loader_1 = require("./contact-flow-loader");
const call_recording_1 = require("./SMA_Mapping_Actions/call-recording");
const compare_attribute_1 = require("./SMA_Mapping_Actions/compare-attribute");
const disconnect_participant_1 = require("./SMA_Mapping_Actions/disconnect-participant");
const end_module_1 = require("./SMA_Mapping_Actions/end-module");
const get_participant_input_1 = require("./SMA_Mapping_Actions/get-participant-input");
const invoke_lambda_1 = require("./SMA_Mapping_Actions/invoke-lambda");
const invoke_module_1 = require("./SMA_Mapping_Actions/invoke-module");
const lex_bot_1 = require("./SMA_Mapping_Actions/lex-bot");
const loop_1 = require("./SMA_Mapping_Actions/loop");
const message_participant_1 = require("./SMA_Mapping_Actions/message-participant");
const set_voice_1 = require("./SMA_Mapping_Actions/set-voice");
const transfer_flow_1 = require("./SMA_Mapping_Actions/transfer-flow");
const transfer_to_thirdparty_1 = require("./SMA_Mapping_Actions/transfer-to-thirdparty");
const update_contact_attributes_1 = require("./SMA_Mapping_Actions/update-contact-attributes");
const wait_1 = require("./SMA_Mapping_Actions/wait");
const AmazonConnectActionTypes_1 = require("./utility/AmazonConnectActionTypes");
const call_details_1 = require("./utility/call-details");
const condition_validation_1 = require("./utility/condition-validation");
const ConstantValues_1 = require("./utility/ConstantValues");
const ErrorTypes_1 = require("./utility/ErrorTypes");
const EventTypes_1 = require("./utility/EventTypes");
const find_action_id_1 = require("./utility/find-action-id");
const next_action_error_1 = require("./utility/next-action-error");
const termination_event_1 = require("./utility/termination-event");
const connectContextStore = "ConnectContextStore";
let loopMap = new Map();
let ContactFlowARNMap = new Map();
let InvokeModuleARNMap = new Map();
let InvokationModuleNextAction = new Map();
let ActualFlowARN = new Map();
const SpeechAttributeMap = new Map();
const contextAttributes = new Map();
let tmpMap = new Map();
const defaultLogger = "SMA-Contact-Flow-Builder | Call ID - ";
let puaseAction;
/**
  * This function get connect flow data from contact flow loader
  * and send the connect flow data to respective functions.
  * @param smaEvent
  * @param amazonConnectInstanceID
  * @param amazonConnectFlowID
  * @param bucketName
  * @returns SMA Action
  */
async function processFlow(smaEvent, amazonConnectInstanceID, amazonConnectFlowID, bucketName) {
    let type = "Contact_Flow";
    let callId;
    const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
    callId = legA.CallId;
    if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
    if (!ActualFlowARN.has(callId)) {
        ActualFlowARN.set(callId, amazonConnectFlowID);
    }
    if (ContactFlowARNMap.has(callId)) {
        amazonConnectFlowID = (ContactFlowARNMap.get(callId));
    }
    if (InvokeModuleARNMap.has(callId)) {
        type = "Invoke_Module";
        amazonConnectFlowID = (InvokeModuleARNMap.get(callId));
    }
    const contactFlow = await (0, contact_flow_loader_1.loadContactFlow)(amazonConnectInstanceID, amazonConnectFlowID, bucketName, smaEvent, type);
    console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Loaded Contact Flow" + contactFlow);
    console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " CallDetails:" + smaEvent.CallDetails);
    const transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
    console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " TransactionAttributes:" + transactionAttributes);
    if (transactionAttributes && transactionAttributes.currentFlowBlock) {
        console.log(defaultLogger + callId + " InvocationEventType:" + smaEvent.InvocationEventType);
        if (smaEvent.InvocationEventType === EventTypes_1.EventTypes.ACTION_SUCCESSFUL || smaEvent.InvocationEventType === EventTypes_1.EventTypes.CALL_ANSWERED) {
            if (smaEvent.ActionData.ReceivedDigits != null) {
                const recieved_digits = smaEvent.ActionData.ReceivedDigits;
                return await (0, condition_validation_1.processFlowConditionValidation)(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, recieved_digits, amazonConnectInstanceID, bucketName, defaultLogger, puaseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap);
            }
            return await processFlowActionSuccess(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, amazonConnectInstanceID, bucketName);
        }
        else if (smaEvent.InvocationEventType === EventTypes_1.EventTypes.ACTION_FAILED || smaEvent.InvocationEventType === EventTypes_1.EventTypes.INVALID_LAMBDA_RESPONSE) {
            return await processFlowActionFailed(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, amazonConnectInstanceID, bucketName);
        }
        else {
            let disconnect = new disconnect_participant_1.DisconnectParticipant();
            return await disconnect.processFlowActionDisconnectParticipant(smaEvent, transactionAttributes.currentFlowBlock, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction);
            // processFlowActionDisconnectParticipant(smaEvent, transactionAttributes.currentFlowBlock);
        }
    }
    else {
        if (smaEvent.InvocationEventType === EventTypes_1.EventTypes.NEW_INBOUND_CALL)
            storeSystemAttributs(smaEvent, amazonConnectFlowID, amazonConnectFlowID);
        // We're at the root start from there
        return await processRootFlowBlock(smaEvent, contactFlow, transactionAttributes, amazonConnectInstanceID, bucketName);
    }
}
exports.processFlow = processFlow;
/**
  * This function stores the System attributes in the Map, when new NEW_INBOUND_CALL is recieved
  * @param smaEvent
  * @param amazonConnectFlowID
  * @param amazonConnectInstanceID
  * @returns SMA Action
  */
async function storeSystemAttributs(smaEvent, amazonConnectFlowID, amazonConnectInstanceID) {
    const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
    contextAttributes.set("$.CustomerEndpoint.Address", legA.From);
    contextAttributes.set("$.SystemEndpoint.Address", legA.To);
    contextAttributes.set("$.InitiationMethod", legA.Direction);
    contextAttributes.set("$.ContactId", amazonConnectFlowID);
    contextAttributes.set("$.InstanceARN", amazonConnectInstanceID);
    contextAttributes.set("$.Channel", ConstantValues_1.ConstData.channel);
    contextAttributes.set("$.CustomerEndpoint.Type", ConstantValues_1.ConstData.customerEndpointType);
    contextAttributes.set("$.SystemEndpoint.Type", ConstantValues_1.ConstData.systemEndpointType);
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
async function processRootFlowBlock(smaEvent, contactFlow, _transactionAttributes, amazonConnectInstanceID, bucketName) {
    // OK, time to figure out the root of the flow
    let callId;
    const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
    callId = legA.CallId;
    if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
    if (contactFlow.StartAction !== null) {
        const actions = contactFlow.Actions;
        console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Root Flow Block The actions are" + actions);
        if (actions !== null && actions.length > 0) {
            const currentAction = (0, find_action_id_1.findActionByID)(actions, contactFlow.StartAction);
            let actionType = currentAction.Type;
            if (!AmazonConnectActionTypes_1.AmazonConnectActions.hasOwnProperty(actionType)) {
                return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, actionType);
            }
            console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Root Flow Block The current Action is " + currentAction.Type);
            if (currentAction !== null) {
                return await processFlowAction(smaEvent, currentAction, actions, amazonConnectInstanceID, bucketName);
            }
        }
    }
}
exports.processRootFlowBlock = processRootFlowBlock;
/**
  * This function process the flow actions and call the respective SMA Mapping Class based on the action type.
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
async function processFlowAction(smaEvent, action, actions, amazonConnectInstanceID, bucketName) {
    console.log("ProcessFlowAction:" + action);
    switch (action.Type) {
        case AmazonConnectActionTypes_1.AmazonConnectActions.GetParticipantInput:
            let getParticipantInput = new get_participant_input_1.GetParticipantInput();
            return await getParticipantInput.processFlowActionGetParticipantInput(smaEvent, action, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction);
        case AmazonConnectActionTypes_1.AmazonConnectActions.MessageParticipant:
            let message_participant = new message_participant_1.MessageParticipant();
            return await message_participant.processFlowActionMessageParticipant(smaEvent, action, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction);
        case AmazonConnectActionTypes_1.AmazonConnectActions.DisconnectParticipant:
            let disconnect = new disconnect_participant_1.DisconnectParticipant();
            return await disconnect.processFlowActionDisconnectParticipant(smaEvent, action, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction);
        case AmazonConnectActionTypes_1.AmazonConnectActions.Wait:
            let wait = new wait_1.Wait();
            return await wait.processFlowActionWait(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, puaseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap);
        case AmazonConnectActionTypes_1.AmazonConnectActions.UpdateContactRecordingBehavior:
            let callRecording = new call_recording_1.CallRecording();
            return await callRecording.processFlowActionUpdateContactRecordingBehavior(smaEvent, action, puaseAction, defaultLogger, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap);
        case AmazonConnectActionTypes_1.AmazonConnectActions.Loop:
            let loop = new loop_1.Loop();
            return await loop.processFlowActionLoop(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, puaseAction, loopMap, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap);
        case AmazonConnectActionTypes_1.AmazonConnectActions.TransferParticipantToThirdParty:
            let transferThirdParty = new transfer_to_thirdparty_1.TransferTOThirdParty();
            return await transferThirdParty.processFlowActionTransferParticipantToThirdParty(smaEvent, action, defaultLogger, puaseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap);
        case AmazonConnectActionTypes_1.AmazonConnectActions.ConnectParticipantWithLexBot:
            let lexbot = new lex_bot_1.LexBot();
            return await lexbot.processFlowActionConnectParticipantWithLexBot(smaEvent, action, defaultLogger, puaseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap);
        case AmazonConnectActionTypes_1.AmazonConnectActions.TransferToFlow:
            let transferToFlow = new transfer_flow_1.TrasferToFlow();
            return await transferToFlow.processFlowActionTransferToFlow(smaEvent, action, amazonConnectInstanceID, bucketName, defaultLogger, ContactFlowARNMap, puaseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN);
        case AmazonConnectActionTypes_1.AmazonConnectActions.UpdateContactTextToSpeechVoice:
            let updateVoice = new set_voice_1.SetVoice();
            return await updateVoice.processFlowActionUpdateContactTextToSpeechVoice(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, SpeechAttributeMap, puaseAction, contextAttributes, ActualFlowARN, ContactFlowARNMap);
        case AmazonConnectActionTypes_1.AmazonConnectActions.InvokeLambdaFunction:
            let invokeLambda = new invoke_lambda_1.InvokeLambda();
            return await invokeLambda.processFlowActionInvokeLambdaFunction(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, contextAttributes, loopMap, tmpMap, puaseAction, SpeechAttributeMap, ContactFlowARNMap, ActualFlowARN);
        case AmazonConnectActionTypes_1.AmazonConnectActions.UpdateContactAttributes:
            let update = new update_contact_attributes_1.UpdateContactAttrbts();
            return await update.processFlowActionUpdateContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, tmpMap, contextAttributes);
        case AmazonConnectActionTypes_1.AmazonConnectActions.Compare:
            let compare = new compare_attribute_1.CompareAttribute();
            return await compare.processFlowActionCompareContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, contextAttributes);
        case AmazonConnectActionTypes_1.AmazonConnectActions.InvokeFlowModule:
            let invoke = new invoke_module_1.InvokeModule();
            return await invoke.processFlowActionInvokeFlowModule(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, InvokeModuleARNMap, InvokationModuleNextAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, puaseAction);
        case AmazonConnectActionTypes_1.AmazonConnectActions.EndFlowModuleExecution:
            let endModule = new end_module_1.EndModule();
            return await endModule.processFlowActionEndFlowModuleExecution(smaEvent, action, actions, amazonConnectInstanceID, bucketName, InvokeModuleARNMap, InvokationModuleNextAction, ActualFlowARN, defaultLogger, puaseAction, SpeechAttributeMap, contextAttributes, ContactFlowARNMap);
        default:
            null;
    }
}
exports.processFlowAction = processFlowAction;
/**
  * After received success event from SMA,process the next action.
  * @param smaEvent
  * @param action
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns Process Flow Action
  */
async function processFlowActionSuccess(smaEvent, action, contactFlow, amazonConnectInstanceID, bucketName) {
    let transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
    if (action.Parameters && action.Parameters.StoreInput == "True") {
        smaEvent.CallDetails.TransactionAttributes = updateConnectContextStore(transactionAttributes, "StoredCustomerInput", smaEvent.ActionData.ReceivedDigits);
    }
    if (smaEvent.ActionData.IntentResult != null) {
        let intentName = smaEvent.ActionData.IntentResult.SessionState.Intent.Name;
        return await (0, condition_validation_1.processFlowConditionValidation)(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, intentName, amazonConnectInstanceID, bucketName, defaultLogger, puaseAction, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap);
    }
    const nextAction = (0, find_action_id_1.findActionByID)(contactFlow.Actions, action.Transitions.NextAction);
    let actionType = nextAction.Type;
    if (!AmazonConnectActionTypes_1.AmazonConnectActions.hasOwnProperty(actionType)) {
        return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, actionType);
    }
    return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName);
}
function updateConnectContextStore(transactionAttributes, key, value) {
    if (transactionAttributes[connectContextStore])
        transactionAttributes[connectContextStore][key] = value;
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
async function processFlowActionFailed(smaEvent, actionObj, contactFlow, amazonConnectInstanceID, bucketName) {
    let callId;
    let smaAction1;
    const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
    callId = legA.CallId;
    if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
    let currentAction = contactFlow.Actions.find((action) => action.Identifier === actionObj.Identifier);
    let smaAction;
    let nextAction;
    if (smaEvent != null && smaEvent.ActionData.ErrorType.includes(ErrorTypes_1.ErrorTypes.InputTimeLimitExceeded) || smaEvent.ActionData.ErrorType.includes(ErrorTypes_1.ErrorTypes.InvalidDigitsReceived)) {
        nextAction = await (0, next_action_error_1.getNextActionForError)(currentAction, contactFlow.Actions, ErrorTypes_1.ErrorTypes.InputTimeLimitExceeded, smaEvent, defaultLogger);
        smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
    }
    else if (smaEvent != null && smaEvent.ActionData.ErrorType.includes(ErrorTypes_1.ErrorTypes.NoMatchingCondition)) {
        nextAction = await (0, next_action_error_1.getNextActionForError)(currentAction, contactFlow, ErrorTypes_1.ErrorTypes.NoMatchingCondition, smaEvent, defaultLogger);
        smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
    }
    else if (smaEvent != null && smaEvent.ActionData.ErrorType.includes(ErrorTypes_1.ErrorTypes.ConnectionTimeLimitExceeded)) {
        nextAction = await (0, next_action_error_1.getNextActionForError)(currentAction, contactFlow, ErrorTypes_1.ErrorTypes.ConnectionTimeLimitExceeded, smaEvent, defaultLogger);
        smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
    }
    else if (smaEvent != null && smaEvent.ActionData.ErrorType.includes(ErrorTypes_1.ErrorTypes.CallFailed)) {
        nextAction = await (0, next_action_error_1.getNextActionForError)(currentAction, contactFlow, ErrorTypes_1.ErrorTypes.CallFailed, smaEvent, defaultLogger);
        smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
    }
    else if (smaEvent != null && smaEvent.ActionData.ErrorType.includes(ErrorTypes_1.ErrorTypes.InvalidPhoneNumber)) {
        nextAction = await (0, next_action_error_1.getNextActionForError)(currentAction, contactFlow, ErrorTypes_1.ErrorTypes.InvalidPhoneNumber, smaEvent, defaultLogger);
        smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
    }
    else {
        let count;
        for (let i = 0; i < currentAction.Transitions.Errors.length; i++) {
            if (currentAction.Transitions.Errors[i].ErrorType == ErrorTypes_1.ErrorTypes.NoMatchingError) {
                count = i;
                break;
            }
        }
        nextAction = (0, find_action_id_1.findActionByID)(contactFlow.Actions, currentAction.Transitions.Errors[count].NextAction);
        console.log(defaultLogger + callId + "Next Action identifier:" + currentAction.Transitions.Errors[count].NextAction);
        smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
    }
    let actionType = nextAction.Type;
    if (!AmazonConnectActionTypes_1.AmazonConnectActions.hasOwnProperty(actionType)) {
        return await (0, termination_event_1.terminatingFlowAction)(smaEvent, SpeechAttributeMap, contextAttributes, ActualFlowARN, ContactFlowARNMap, defaultLogger, puaseAction, actionType);
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
                "currentFlowBlock": nextAction
            }
        };
    }
    return {
        "SchemaVersion": "1.0",
        "Actions": [
            smaAction
        ],
        "TransactionAttributes": {
            "currentFlowBlock": nextAction
        }
    };
}
