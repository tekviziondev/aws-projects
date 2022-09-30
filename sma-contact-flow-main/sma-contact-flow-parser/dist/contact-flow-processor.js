"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFlow = void 0;
const contact_flow_loader_1 = require("./contact-flow-loader");
const EventTypes_1 = require("./EventTypes");
const ErrorTypes_1 = require("./ErrorTypes");
const ComparisonOperators_1 = require("./ComparisonOperators");
const ChimeActionTypes_1 = require("./ChimeActionTypes");
const AmazonConnectActionTypes_1 = require("./AmazonConnectActionTypes");
const ConstantValues_1 = require("./ConstantValues");
const connectContextStore = "ConnectContextStore";
let loop = new Map();
let ContactFlowARNMap = new Map();
const SpeechAttributeMap = new Map();
const contextAttributs = new Map();
let tmpMap = new Map();
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
    let callId;
    const legA = getLegACallDetails(smaEvent);
    console.log("Action Data: " + ConstantValues_1.ConstData.voiceId);
    callId = legA.CallId;
    if (callId == "NaN")
        callId = smaEvent.ActionData.Parameters.CallId;
    if (ContactFlowARNMap.has(callId)) {
        amazonConnectFlowID = (ContactFlowARNMap.get(callId));
    }
    const contactFlow = await (0, contact_flow_loader_1.loadContactFlow)(amazonConnectInstanceID, amazonConnectFlowID, bucketName);
    console.log("ConnectInstanceId:" + amazonConnectInstanceID + " Loaded Contact Flow" + contactFlow);
    console.log("ConnectInstanceId:" + amazonConnectInstanceID + " CallDetails:" + smaEvent.CallDetails);
    const transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
    console.log("ConnectInstanceId:" + amazonConnectInstanceID + " TransactionAttributes:" + transactionAttributes);
    if (transactionAttributes && transactionAttributes.currentFlowBlock) {
        console.log("InvocationEventType:" + smaEvent.InvocationEventType);
        if (smaEvent.InvocationEventType === EventTypes_1.EventTypes.ACTION_SUCCESSFUL || smaEvent.InvocationEventType === EventTypes_1.EventTypes.CALL_ANSWERED) {
            if (smaEvent.ActionData.ReceivedDigits != null) {
                const recieved_digits = smaEvent.ActionData.ReceivedDigits;
                return await processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, recieved_digits, amazonConnectInstanceID, bucketName);
            }
            return await processFlowActionSuccess(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, amazonConnectInstanceID, bucketName);
        }
        else if (smaEvent.InvocationEventType === EventTypes_1.EventTypes.ACTION_FAILED || smaEvent.InvocationEventType === EventTypes_1.EventTypes.INVALID_LAMBDA_RESPONSE) {
            return await processFlowActionFailed(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, amazonConnectInstanceID, bucketName);
        }
        else {
            return await processFlowActionDisconnectParticipant(smaEvent, transactionAttributes.currentFlowBlock);
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
async function storeSystemAttributs(smaEvent, amazonConnectFlowID, amazonConnectInstanceID) {
    const legA = getLegACallDetails(smaEvent);
    contextAttributs.set("$.CustomerEndpoint.Address", legA.From);
    contextAttributs.set("$.SystemEndpoint.Address", legA.To);
    contextAttributs.set("$.InitiationMethod", legA.Direction);
    contextAttributs.set("$.ContactId", amazonConnectFlowID);
    contextAttributs.set("$.InstanceARN", amazonConnectInstanceID);
    contextAttributs.set("$.Channel", "VOICE");
    contextAttributs.set("$.CustomerEndpoint.Type", "TELEPHONE_NUMBER");
    contextAttributs.set("$.SystemEndpoint.Type", "TELEPHONE_NUMBER");
}
/**
  * This function is starting of the flow exection.
  * Get current action from the flow block and send to process flow action
  * @param smaEvent
  * @param contactFlow
  * @param transactionAttributes
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
async function processRootFlowBlock(smaEvent, contactFlow, transactionAttributes, amazonConnectInstanceID, bucketName) {
    // OK, time to figure out the root of the flow
    if (contactFlow.StartAction !== null) {
        const actions = contactFlow.Actions;
        console.log("ConnectInstanceId:" + amazonConnectInstanceID + " Root Flow Block The actions are" + actions);
        if (actions !== null && actions.length > 0) {
            const currentAction = findActionByID(actions, contactFlow.StartAction);
            console.log("ConnectInstanceId:" + amazonConnectInstanceID + " Root Flow Block The current Action is " + currentAction.Type);
            if (currentAction !== null) {
                return await processFlowAction(smaEvent, currentAction, actions, amazonConnectInstanceID, bucketName);
            }
        }
    }
}
/**
  * This function process the flow actions and call the respective functions based on the action type.
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
            return await processFlowActionGetParticipantInput(smaEvent, action);
        case AmazonConnectActionTypes_1.AmazonConnectActions.MessageParticipant:
            return await processFlowActionMessageParticipant(smaEvent, action);
        case AmazonConnectActionTypes_1.AmazonConnectActions.DisconnectParticipant:
            return await processFlowActionDisconnectParticipant(smaEvent, action);
        case AmazonConnectActionTypes_1.AmazonConnectActions.Wait:
            return await processFlowActionWait(smaEvent, action, actions, amazonConnectInstanceID, bucketName);
        case AmazonConnectActionTypes_1.AmazonConnectActions.UpdateContactRecordingBehavior:
            return await processFlowActionUpdateContactRecordingBehavior(smaEvent, action);
        case AmazonConnectActionTypes_1.AmazonConnectActions.Loop:
            return await processFlowActionLoop(smaEvent, action, actions, amazonConnectInstanceID, bucketName);
        case AmazonConnectActionTypes_1.AmazonConnectActions.TransferParticipantToThirdParty:
            return await processFlowActionTransferParticipantToThirdParty(smaEvent, action);
        case AmazonConnectActionTypes_1.AmazonConnectActions.ConnectParticipantWithLexBot:
            return await processFlowActionConnectParticipantWithLexBot(smaEvent, action);
        case AmazonConnectActionTypes_1.AmazonConnectActions.TransferToFlow:
            return await processFlowActionTransferToFlow(smaEvent, action, amazonConnectInstanceID, bucketName);
        case AmazonConnectActionTypes_1.AmazonConnectActions.UpdateContactTextToSpeechVoice:
            return await processFlowActionUpdateContactTextToSpeechVoice(smaEvent, action, actions, amazonConnectInstanceID, bucketName);
        case AmazonConnectActionTypes_1.AmazonConnectActions.InvokeLambdaFunction:
            return await processFlowActionInvokeLambdaFunction(smaEvent, action, actions, amazonConnectInstanceID, bucketName);
        case AmazonConnectActionTypes_1.AmazonConnectActions.UpdateContactAttributes:
            return await processFlowActionUpdateContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName);
        case AmazonConnectActionTypes_1.AmazonConnectActions.Compare:
            return await processFlowActionCompareContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName);
        default:
            null;
    }
}
/**
  * Making a SMA action to perform delivering an audio message to obtain customer input.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
async function processFlowActionGetParticipantInput(smaEvent, action) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (action.Parameters.Media != null) {
        console.log("Play Audio And Get Digits");
        return await processPlayAudioAndGetDigits(smaEvent, action);
    }
    const legA = getLegACallDetails(smaEvent);
    console.log("Speak and Get Digits Action");
    let smaAction = {
        Type: ChimeActionTypes_1.ChimeActions.SpeakAndGetDigits,
        Parameters: {
            "CallId": legA.CallId,
            "SpeechParameters": getSpeechParameters(action),
            "FailureSpeechParameters": getSpeechParameters(action),
            "MinNumberOfDigits": 1
        }
    };
    if ((_a = action.Parameters) === null || _a === void 0 ? void 0 : _a.InputValidation) {
        if ((_c = (_b = action.Parameters) === null || _b === void 0 ? void 0 : _b.InputValidation) === null || _c === void 0 ? void 0 : _c.CustomValidation) {
            if ((_f = (_e = (_d = action.Parameters) === null || _d === void 0 ? void 0 : _d.InputValidation) === null || _e === void 0 ? void 0 : _e.CustomValidation) === null || _f === void 0 ? void 0 : _f.MaximumLength) {
                smaAction.Parameters['MaxNumberOfDigits'] = (_j = (_h = (_g = action.Parameters) === null || _g === void 0 ? void 0 : _g.InputValidation) === null || _h === void 0 ? void 0 : _h.CustomValidation) === null || _j === void 0 ? void 0 : _j.MaximumLength;
            }
        }
    }
    if (action.Parameters.DTMFConfiguration && action.Parameters.DTMFConfiguration.InputTerminationSequence) {
        smaAction.Parameters["TerminatorDigits"] = action.Parameters.DTMFConfiguration.InputTerminationSequence;
    }
    if (action.Parameters.InputTimeLimitSeconds) {
        const timeLimit = Number.parseInt(action.Parameters.InputTimeLimitSeconds);
        smaAction.Parameters["RepeatDurationInMilliseconds"] = timeLimit * 1000;
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
/**
  * Making play audio json object for sma action.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
async function processPlayAudio(smaEvent, action) {
    console.log("Play Audio Action");
    let callId;
    const legA = getLegACallDetails(smaEvent);
    callId = legA.CallId;
    if (callId == "NaN")
        callId = smaEvent.ActionData.Parameters.CallId;
    let smaAction = {
        Type: ChimeActionTypes_1.ChimeActions.PlayAudio,
        Parameters: {
            "CallId": callId,
            "AudioSource": getAudioParameters(action)
        }
    };
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
/**
  * Making play audio and get digits json object for sma action.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
async function processPlayAudioAndGetDigits(smaEvent, action) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    let callId;
    const legA = getLegACallDetails(smaEvent);
    callId = legA.CallId;
    if (callId == "NaN")
        callId = smaEvent.ActionData.Parameters.CallId;
    let smaAction = {
        Type: ChimeActionTypes_1.ChimeActions.PlayAudioAndGetDigits,
        Parameters: {
            "CallId": callId,
            "AudioSource": getAudioParameters(action),
            "FailureAudioSource": getAudioParameters(action),
            "MinNumberOfDigits": 5
        }
    };
    if ((_a = action.Parameters) === null || _a === void 0 ? void 0 : _a.InputValidation) {
        if ((_c = (_b = action.Parameters) === null || _b === void 0 ? void 0 : _b.InputValidation) === null || _c === void 0 ? void 0 : _c.CustomValidation) {
            if ((_f = (_e = (_d = action.Parameters) === null || _d === void 0 ? void 0 : _d.InputValidation) === null || _e === void 0 ? void 0 : _e.CustomValidation) === null || _f === void 0 ? void 0 : _f.MaximumLength) {
                smaAction.Parameters['MaxNumberOfDigits'] = (_j = (_h = (_g = action.Parameters) === null || _g === void 0 ? void 0 : _g.InputValidation) === null || _h === void 0 ? void 0 : _h.CustomValidation) === null || _j === void 0 ? void 0 : _j.MaximumLength;
            }
        }
    }
    if (action.Parameters.DTMFConfiguration && action.Parameters.DTMFConfiguration.InputTerminationSequence) {
        smaAction.Parameters["TerminatorDigits"] = action.Parameters.DTMFConfiguration.InputTerminationSequence;
    }
    if (action.Parameters.InputTimeLimitSeconds) {
        const timeLimit = Number.parseInt(action.Parameters.InputTimeLimitSeconds);
        smaAction.Parameters["RepeatDurationInMilliseconds"] = timeLimit * 1000;
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
        return await processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, intentName, amazonConnectInstanceID, bucketName);
    }
    const nextAction = findActionByID(contactFlow.Actions, action.Transitions.NextAction);
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
  * Making a SMA action to perform Ends the interaction.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
async function processFlowActionDisconnectParticipant(smaEvent, action) {
    let callId;
    const legA = getLegACallDetails(smaEvent);
    callId = legA.CallId;
    if (callId == "NaN")
        callId = smaEvent.ActionData.Parameters.CallId;
    ContactFlowARNMap.delete(callId);
    contextAttributs.clear();
    console.log("Hangup Action");
    let smaAction = {
        Type: ChimeActionTypes_1.ChimeActions.Hangup,
        Parameters: {
            "SipResponseCode": "0",
            "CallId": callId
        }
    };
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
/**
  * Making a SMA action to perform Wait for a specified period of time.
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
async function processFlowActionWait(smaEvent, action, actions, amazonConnectInstanceID, bucketName) {
    console.log("Pause Action");
    let smaAction = {
        Type: ChimeActionTypes_1.ChimeActions.Pause,
        Parameters: {
            "DurationInMilliseconds": getWaitTimeParameter(action)
        }
    };
    const nextAction = findActionByID(actions, action.Transitions.Conditions[0].NextAction);
    console.log("Next Action identifier:" + action.Transitions.Conditions[0].NextAction);
    let smaAction1 = await (await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName)).Actions[0];
    console.log("Next Action Data:" + smaAction1);
    return {
        "SchemaVersion": "1.0",
        "Actions": [
            smaAction, smaAction1
        ],
        "TransactionAttributes": {
            "currentFlowBlock": nextAction
        }
    };
}
/**
  * Making a SMA action to perform Delivers an audio or chat message.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
async function processFlowActionMessageParticipant(smaEvent, action) {
    if (action.Parameters.Media != null) {
        console.log("Play Audio Action");
        return await processPlayAudio(smaEvent, action);
    }
    const legA = getLegACallDetails(smaEvent);
    let text;
    let type;
    let voiceId = ConstantValues_1.ConstData.voiceId;
    let engine = ConstantValues_1.ConstData.engine;
    let languageCode = ConstantValues_1.ConstData.languageCode;
    console.log("DEBUG Message Participant 1" + JSON.stringify(smaEvent));
    console.log("DEBUG Message Participant 2" + JSON.stringify(action));
    if (SpeechAttributeMap.has("TextToSpeechVoice")) {
        voiceId = SpeechAttributeMap.get("TextToSpeechVoice");
    }
    if (SpeechAttributeMap.has("TextToSpeechEngine")) {
        engine = SpeechAttributeMap.get("TextToSpeechEngine").toLowerCase();
    }
    if (SpeechAttributeMap.has("LanguageCode")) {
        languageCode = SpeechAttributeMap.get("LanguageCode");
    }
    if (action.Parameters.Text !== null && action.Parameters.Text !== "" && action.Parameters.Text && action.Parameters.Text !== "undefined") {
        text = action.Parameters.Text;
        if (text.includes("$.External.") || text.includes("$.Attributes.")) {
            //text=textConvertor(text);
            contextAttributs.forEach((value, key) => {
                if (text.includes(key))
                    text = text.replace(key, value);
            });
        }
        type = ConstantValues_1.ConstData.text;
    }
    else if (action.Parameters.SSML !== null && action.Parameters.SSML && action.Parameters.SSML !== "undefined") {
        text = action.Parameters.SSML;
        type = ConstantValues_1.ConstData.ssml;
    }
    let smaAction = {
        Type: ChimeActionTypes_1.ChimeActions.Speak,
        Parameters: {
            Engine: engine,
            CallId: legA.CallId,
            Text: text,
            TextType: type,
            LanguageCode: languageCode,
            VoiceId: voiceId
        }
    };
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
function getSpeechParameters(action) {
    let rv = null;
    let voiceId = ConstantValues_1.ConstData.voiceId;
    let engine = ConstantValues_1.ConstData.engine;
    let languageCode = ConstantValues_1.ConstData.languageCode;
    if (SpeechAttributeMap.has("TextToSpeechVoice")) {
        voiceId = SpeechAttributeMap.get("TextToSpeechVoice");
    }
    if (SpeechAttributeMap.has("TextToSpeechEngine")) {
        engine = SpeechAttributeMap.get("TextToSpeechEngine").toLowerCase();
    }
    if (SpeechAttributeMap.has("LanguageCode")) {
        languageCode = SpeechAttributeMap.get("LanguageCode");
    }
    if (action.Text !== null || action.SSML !== null) {
        let text;
        let type;
        if (action.Parameters.Text !== null && action.Parameters.Text !== "" && action.Parameters.Text && action.Parameters.Text !== "undefined") {
            text = action.Parameters.Text;
            if (text.includes("$.External.") || text.includes("$.Attributes.")) {
                contextAttributs.forEach((value, key) => {
                    if (text.includes(key))
                        text = text.replace(key, value);
                });
            }
            type = ConstantValues_1.ConstData.text;
        }
        else if (action.Parameters.SSML !== null && action.Parameters.SSML && action.Parameters.SSML !== "undefined") {
            text = action.Parameters.SSML;
            type = ConstantValues_1.ConstData.ssml;
        }
        rv = {
            Text: text,
            TextType: type,
            Engine: engine,
            LanguageCode: languageCode,
            VoiceId: voiceId,
        };
    }
    console.log("Speech Parameter : " + rv);
    return rv;
}
function getAudioParameters(action) {
    let rv = null;
    let bucketName;
    let type;
    let uri;
    let uriObj;
    let key;
    if (action.Parameters.SourceType !== null) {
        console.log("Audio Parameters SourceType Exists");
        uri = action.Parameters.Media.Uri;
        uriObj = uri.split("/");
        bucketName = uriObj[2];
        key = uriObj[3];
        type = action.Parameters.Media.SourceType;
    }
    rv = {
        Type: type,
        BucketName: bucketName,
        Key: key
    };
    console.log("Audio Parameters : " + rv);
    return rv;
}
function getWaitTimeParameter(action) {
    let rv;
    if (action.TimeLimitSeconds !== null) {
        let seconds;
        const timeLimitSeconds = Number.parseInt(action.Parameters.TimeLimitSeconds);
        rv = String(timeLimitSeconds * 1000);
    }
    console.log("Wait Parameter : " + rv);
    return rv;
}
function findActionByID(actions, identifier) {
    return actions.find((action) => action.Identifier === identifier);
}
/**
  * Making a SMA action to perform Call Recording.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
async function processFlowActionUpdateContactRecordingBehavior(smaEvent, action) {
    const legA = getLegACallDetails(smaEvent);
    if (action.Parameters.RecordingBehavior.RecordedParticipants.length < 1) {
        let smaAction = {
            Type: ChimeActionTypes_1.ChimeActions.StopCallRecording,
            Parameters: {
                "CallId": legA.CallId
            }
        };
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
    let smaAction = {
        Type: ChimeActionTypes_1.ChimeActions.StartCallRecording,
        Parameters: {
            "CallId": legA.CallId,
            "Track": "BOTH",
            Destination: {
                "Type": "S3",
                "Location": " flow-cache1"
            }
        }
    };
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
async function processFlowActionFailed(smaEvent, actionObj, contactFlow, amazonConnectInstanceID, bucketName) {
    let currentAction = contactFlow.Actions.find((action) => action.Identifier === actionObj.Identifier);
    let smaAction;
    let nextAction;
    if (smaEvent != null && smaEvent.ActionData.ErrorType.includes(ErrorTypes_1.ErrorTypes.InputTimeLimitExceeded)) {
        nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes_1.ErrorTypes.InputTimeLimitExceeded);
        smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
    }
    else if (smaEvent != null && smaEvent.ActionData.ErrorType.includes(ErrorTypes_1.ErrorTypes.NoMatchingCondition)) {
        nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes_1.ErrorTypes.NoMatchingCondition);
        smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
    }
    else if (smaEvent != null && smaEvent.ActionData.ErrorType.includes(ErrorTypes_1.ErrorTypes.ConnectionTimeLimitExceeded)) {
        nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes_1.ErrorTypes.ConnectionTimeLimitExceeded);
        smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
    }
    else if (smaEvent != null && smaEvent.ActionData.ErrorType.includes(ErrorTypes_1.ErrorTypes.CallFailed)) {
        nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes_1.ErrorTypes.CallFailed);
        smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
    }
    else if (smaEvent != null && smaEvent.ActionData.ErrorType.includes(ErrorTypes_1.ErrorTypes.InvalidPhoneNumber)) {
        nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes_1.ErrorTypes.InvalidPhoneNumber);
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
        nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[count].NextAction);
        console.log("Next Action identifier:" + currentAction.Transitions.Errors[count].NextAction);
        smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
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
/**
  * Making a SMA action to perform delivering an audio or chat message to obtain customer input.
  * @param smaEvent
  * @param actionObj
  * @param contactFlow
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param recieved_digits
  * @returns SMA Action
  */
async function processFlowConditionValidation(smaEvent, actionObj, contactFlow, recieved_digits, amazonConnectInstanceID, bucketName) {
    let currentAction = contactFlow.Actions.find((action) => action.Identifier === actionObj.Identifier);
    let smaAction;
    let nextAction;
    let nextAction_id;
    const condition = currentAction.Transitions.Conditions;
    if (smaEvent != null && condition.length > 0) {
        for (let index = 0; index < condition.length; index++) {
            console.log("Recieved Digits " + recieved_digits);
            console.log("Condition Operands " + condition[index].Condition.Operands[0]);
            if (condition[index].Condition.Operands[0] === recieved_digits) {
                nextAction_id = condition[index].NextAction;
                console.log("The condition passsed with recieved digit " + recieved_digits);
                console.log("Next Action identifier" + nextAction_id);
                nextAction = findActionByID(contactFlow.Actions, nextAction_id);
                break;
            }
        }
        if (nextAction_id === null && nextAction_id === "undefined" && !nextAction_id && actionObj.Parameters && actionObj.Parameters.StoreInput == "false") {
            nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes_1.ErrorTypes.NoMatchingCondition);
            console.log("Conditions are not matching with Recieved Digits ");
        }
        else if ((nextAction_id === null && nextAction_id === "undefined" && !nextAction_id && actionObj.Parameters && actionObj.Parameters.StoreInput == "true")) {
            nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes_1.ErrorTypes.NoMatchingError);
            console.log("Conditions are not matching with Recieved Digits ");
        }
        console.log("Next Action identifier:" + nextAction_id);
        smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
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
}
/**
  * Making a SMA action to perform Repeats the looping branch for the specified number of times. After which, the complete branch is followed.
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
async function processFlowActionLoop(smaEvent, action, actions, amazonConnectInstanceID, bucketName) {
    let smaAction;
    let callId;
    const legA = getLegACallDetails(smaEvent);
    callId = legA.CallId;
    if (callId == "NaN")
        callId = smaEvent.ActionData.Parameters.CallId;
    if (!loop.has(callId) || loop.get(callId) != action.Parameters.LoopCount) {
        const nextAction = findActionByID(actions, action.Transitions.Conditions[1].NextAction);
        console.log("Next Action identifier:" + action.Transitions.Conditions[1].NextAction);
        smaAction = await (await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName)).Actions[0];
        let count = String(Number.parseInt(loop.get(callId)) + 1);
        if (!loop.has(callId))
            loop.set(callId, "1");
        else
            loop.set(callId, count);
        console.log("Next Action Data:" + smaAction);
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
    else {
        loop.delete(callId);
        let nextAction = findActionByID(actions, action.Transitions.Conditions[0].NextAction);
        console.log("Next Action identifier:" + action.Transitions.Conditions[0].NextAction);
        smaAction = await (await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName)).Actions[0];
        console.log("Next Action Data:" + smaAction);
        return {
            "SchemaVersion": "1.0",
            "Actions": [
                smaAction
            ],
            "TransactionAttributes": {
                "currentFlowBlock": nextAction,
            }
        };
    }
}
/**
  * Making a SMA action to perform Transfer a call to a phone number for voice interactions.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
async function processFlowActionTransferParticipantToThirdParty(smaEvent, action) {
    const legA = getLegACallDetails(smaEvent);
    let fromNumber = legA.From;
    if (action.Parameters.hasOwnProperty("CallerId")) {
        fromNumber = action.Parameters.CallerId.Number;
    }
    let smaAction = {
        Type: ChimeActionTypes_1.ChimeActions.CallAndBridge,
        Parameters: {
            "CallTimeoutSeconds": action.Parameters.ThirdPartyConnectionTimeLimitSeconds,
            "CallerIdNumber": fromNumber,
            "Endpoints": [
                {
                    "BridgeEndpointType": "PSTN",
                    "Uri": action.Parameters.ThirdPartyPhoneNumber
                }
            ]
        }
    };
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
/**
  * Making a SMA action to perform delvier a Chat message and obtain customer input.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
async function processFlowActionConnectParticipantWithLexBot(smaEvent, action) {
    let smaAction;
    if (action.Parameters.hasOwnProperty("LexSessionAttributes")) {
        smaAction = {
            Type: ChimeActionTypes_1.ChimeActions.StartBotConversation,
            Parameters: {
                BotAliasArn: action.Parameters.LexV2Bot.AliasArn,
                LocaleId: ConstantValues_1.ConstData.languageCode,
                Configuration: {
                    SessionState: {
                        SessionAttributes: action.Parameters.LexSessionAttributes,
                        DialogAction: {
                            Type: "ElicitIntent"
                        }
                    },
                    WelcomeMessages: [
                        {
                            ContentType: "PlainText",
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
                LocaleId: ConstantValues_1.ConstData.languageCode,
                Configuration: {
                    SessionState: {
                        DialogAction: {
                            Type: "ElicitIntent"
                        }
                    },
                    WelcomeMessages: [
                        {
                            ContentType: "PlainText",
                            Content: action.Parameters.Text
                        },
                    ]
                }
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
/**
  * Making a SMA action to Ends the current flow and transfers the customer to a flow of type contact flow.
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
async function processFlowActionTransferToFlow(smaEvent, action, amazonConnectInstanceID, bucketName) {
    let TransferFlowARN = action.Parameters.ContactFlowId;
    let callId;
    const legA = getLegACallDetails(smaEvent);
    callId = legA.CallId;
    if (callId == "NaN")
        callId = smaEvent.ActionData.Parameters.CallId;
    ContactFlowARNMap.set(callId, TransferFlowARN);
    const contactFlow = await (0, contact_flow_loader_1.loadContactFlow)(amazonConnectInstanceID, TransferFlowARN, bucketName);
    console.log("Transfering to Another contact FLow function");
    return await processRootFlowBlock(smaEvent, contactFlow, smaEvent.CallDetails.TransactionAttributes, amazonConnectInstanceID, bucketName);
}
/**
  * Invokes the External Lambda Function and stores the result of the Lambda function in Key Value Pair
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns The Next SMA Action to perform
  */
async function processFlowActionInvokeLambdaFunction(smaEvent, action, actions, amazonConnectInstanceID, bucketName) {
    let smaAction;
    const AWS = require("aws-sdk");
    const lambda = new AWS.Lambda({ region: ConstantValues_1.ConstData.region });
    let LambdaARN = action.Parameters.LambdaFunctionARN;
    let inputForInvoking = await inputForInvokingLambda(action);
    const params = { FunctionName: LambdaARN,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(inputForInvoking)
    };
    let result = await lambda.invoke(params).promise();
    if (result === null && result === "undefined" && !result) {
        let nextAction = await getNextActionForError(action, actions, ErrorTypes_1.ErrorTypes.NoMatchingError);
        return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
    }
    let x = JSON.parse(result.Payload);
    console.log("The Result After Invoking Lambda is" + JSON.stringify(x));
    const keys = Object.keys(x);
    keys.forEach((key, index) => {
        contextAttributs.set("$.External." + key, x[key]);
        tmpMap.set(key, x[key]);
    });
    let nextAction = findActionByID(actions, action.Transitions.NextAction);
    console.log("Next Action identifier:" + action.Transitions.NextAction);
    return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
}
async function inputForInvokingLambda(action) {
    let InvocationAttributes = Object.entries(action.Parameters.LambdaInvocationAttributes);
    for (let i = 0; i < InvocationAttributes.length; i++) {
        if (InvocationAttributes[i][1].includes("$.External.") || InvocationAttributes[i][1].includes("$.Attributes.")) {
            contextAttributs.forEach((value, key) => {
                if (InvocationAttributes[i][1] == key)
                    InvocationAttributes[i][1] = InvocationAttributes[i][1].replace(key, value);
            });
        }
    }
    let lambdaFunctionParameters = Object.fromEntries(InvocationAttributes.map(([k, v]) => [k, v]));
    let inputForInvoking = {
        "Details": {
            "ContactData": {
                "Attributes": {},
                "Channel": contextAttributs.get("$.Channel"),
                "ContactId": contextAttributs.get("$.ContactId"),
                "CustomerEndpoint": {
                    "Address": contextAttributs.get("$.CustomerEndpoint.Address"),
                    "Type": contextAttributs.get("$.CustomerEndpoint.Type")
                },
                "InitialContactId": contextAttributs.get("$.ContactId"),
                "InitiationMethod": contextAttributs.get("$.InitiationMethod"),
                "InstanceARN": contextAttributs.get("$.InstanceARN"),
                "SystemEndpoint": {
                    "Address": contextAttributs.get("$.SystemEndpoint.Address"),
                    "Type": contextAttributs.get("$.SystemEndpoint.Type")
                }
            },
            "Parameters": lambdaFunctionParameters
        },
        "Name": "ContactFlowEvent"
    };
    return inputForInvoking;
}
/**
  * Updating the Contact Attribute Details
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns The Next SMA Action to perform
  */
async function processFlowActionUpdateContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName) {
    let ContactAttributes = Object.entries(action.Parameters.Attributes);
    try {
        for (let i = 0; i < ContactAttributes.length; i++) {
            let x = ContactAttributes[i][1];
            console.log("The value of x is" + x);
            if (x.includes("$.External.")) {
                let tmp = x.split("$.External.");
                if (tmpMap.has(tmp[1])) {
                    contextAttributs.set("$.Attributes." + ContactAttributes[i][0], tmpMap.get(tmp[1]));
                }
            }
            else if (x.includes("$.Attributes.")) {
                let tmp = x.split("$.Attributes.");
                if (tmpMap.has(tmp[1])) {
                    contextAttributs.set("$.Attributes." + ContactAttributes[i][0], tmpMap.get(tmp[1]));
                }
            }
            else {
                contextAttributs.set("$.Attributes." + ContactAttributes[i][0], ContactAttributes[i][1]);
            }
        }
    }
    catch (e) {
        let nextAction = await getNextActionForError(action, actions, ErrorTypes_1.ErrorTypes.NoMatchingError);
        return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
    }
    tmpMap.clear();
    let nextAction = findActionByID(actions, action.Transitions.NextAction);
    console.log("Next Action identifier:" + action.Transitions.NextAction);
    return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
}
async function processFlowActionCompareContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName) {
    let comparVariable = action.Parameters.ComparisonValue;
    let nextAction;
    try {
        let ComparisonValue = contextAttributs.get(comparVariable);
        const condition = action.Transitions.Conditions;
        for (let index = 0; index < condition.length; index++) {
            console.log("Recieved Value " + ComparisonValue);
            console.log("Condition Operands " + condition[index].Condition.Operands[0]);
            switch (condition[index].Condition.Operator) {
                case ComparisonOperators_1.Operators.Equals:
                    if (condition[index].Condition.Operands[0] === ComparisonValue) {
                        let nextAction_id = condition[index].NextAction;
                        console.log("Next Action identifier" + nextAction_id);
                        nextAction = findActionByID(actions, nextAction_id);
                    }
                    break;
                case ComparisonOperators_1.Operators.NumberLessThan:
                    if (condition[index].Condition.Operands[0] < ComparisonValue) {
                        let nextAction_id = condition[index].NextAction;
                        console.log("Next Action identifier" + nextAction_id);
                        nextAction = findActionByID(actions, nextAction_id);
                    }
                    break;
                case ComparisonOperators_1.Operators.NumberLessOrEqualTo:
                    if (condition[index].Condition.Operands[0] <= ComparisonValue) {
                        let nextAction_id = condition[index].NextAction;
                        console.log("Next Action identifier" + nextAction_id);
                        nextAction = findActionByID(actions, nextAction_id);
                    }
                    break;
                case ComparisonOperators_1.Operators.NumberGreaterThan:
                    if (condition[index].Condition.Operands[0] > ComparisonValue) {
                        let nextAction_id = condition[index].NextAction;
                        console.log("Next Action identifier" + nextAction_id);
                        nextAction = findActionByID(actions, nextAction_id);
                    }
                    break;
                case ComparisonOperators_1.Operators.NumberLessOrEqualTo:
                    if (condition[index].Condition.Operands[0] >= ComparisonValue) {
                        let nextAction_id = condition[index].NextAction;
                        console.log("Next Action identifier" + nextAction_id);
                        nextAction = findActionByID(actions, nextAction_id);
                    }
                    break;
                case ComparisonOperators_1.Operators.TextStartsWith:
                    if (condition[index].Condition.Operands[0].startsWith(ComparisonValue)) {
                        let nextAction_id = condition[index].NextAction;
                        console.log("Next Action identifier" + nextAction_id);
                        nextAction = findActionByID(actions, nextAction_id);
                    }
                    break;
                case ComparisonOperators_1.Operators.TextEndsWith:
                    if (condition[index].Condition.Operands[0].endsWith(ComparisonValue)) {
                        let nextAction_id = condition[index].NextAction;
                        console.log("Next Action identifier" + nextAction_id);
                        nextAction = findActionByID(actions, nextAction_id);
                    }
                    break;
                case ComparisonOperators_1.Operators.TextContains:
                    if (condition[index].Condition.Operands[0].includes(ComparisonValue)) {
                        let nextAction_id = condition[index].NextAction;
                        console.log("Next Action identifier" + nextAction_id);
                        nextAction = findActionByID(actions, nextAction_id);
                    }
                    break;
            }
        }
    }
    catch (e) {
        let nextAction = await getNextActionForError(action, actions, ErrorTypes_1.ErrorTypes.NoMatchingError);
        return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
    }
    return await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName);
}
/**
  * Based on the Error condition, the Next action performed
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
function getNextActionForError(currentAction, contactFlow, ErrorType) {
    let nextAction;
    if (currentAction.Transitions.Errors > 2 && currentAction.Transitions.Errors[2].ErrorType.includes(ErrorType)) {
        nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[2].ErrorType.NextAction);
        console.log("Next Action identifier:" + currentAction.Transitions.Errors[2].NextAction);
    }
    else if (currentAction.Transitions.Errors > 1 && currentAction.Transitions.Errors[1].ErrorType.includes(ErrorType)) {
        nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[1].NextAction);
        console.log("Next Action identifier:" + currentAction.Transitions.Errors[1].NextAction);
    }
    else if (currentAction.Transitions.Errors > 0 && currentAction.Transitions.Errors[0].ErrorType.includes(ErrorType)) {
        nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[0].NextAction);
        console.log("Next Action identifier:" + currentAction.Transitions.Errors[0].NextAction);
    }
    return nextAction;
}
/**
  * Sets the voice parameters to interact with the customer
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
async function processFlowActionUpdateContactTextToSpeechVoice(smaEvent, action, actions, amazonConnectInstanceID, bucketName) {
    let SpeechParameters = action.Parameters;
    let smaAction;
    const keys = Object.keys(SpeechParameters);
    keys.forEach((key, index) => {
        SpeechAttributeMap.set(key, SpeechParameters[key]);
    });
    let nextAction = findActionByID(actions, action.Transitions.NextAction);
    console.log("Next Action identifier:" + action.Transitions.NextAction);
    if (nextAction.Type == "UpdateContactData") {
        console.log("Next Action Type:" + nextAction.Type);
        let SpeechParameter = nextAction.Parameters;
        const keys = Object.keys(SpeechParameter);
        keys.forEach((key, index) => {
            SpeechAttributeMap.set(key, SpeechParameter[key]);
        });
        nextAction = findActionByID(actions, nextAction.Transitions.NextAction);
        console.log("Next Action identifier:" + action.Transitions.NextAction);
    }
    smaAction = await (await processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName)).Actions[0];
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
function getLegACallDetails(event) {
    let rv = null;
    if (event && event.CallDetails && event.CallDetails.Participants && event.CallDetails.Participants.length > 0) {
        for (let i = 0; i < event.CallDetails.Participants.length; i++) {
            if (event.CallDetails.Participants[i].ParticipantTag === 'LEG-A') {
                rv = event.CallDetails.Participants[i];
                break;
            }
        }
    }
    return rv;
}
