"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFlow = void 0;
const contact_flow_loader_1 = require("./contact-flow-loader");
const connectContextStore = "ConnectContextStore";
const loopCountStore = "LoopCountStore";
let loopMap = new Map();
let ContactFlowARNMap = new Map();
/**
  * This function get connect flow data from contact flow loader
  * and send the connect flow data to respective functions.
  * @param smaEvent
  * @param amazonConnectInstanceID
  * @param amazonConnectFlowID
  * @param bucketName
  * @returns SMA Action
  */
function processFlow(smaEvent, amazonConnectInstanceID, amazonConnectFlowID, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        let callId;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (callId == "NaN")
            callId = smaEvent.ActionData.Parameters.CallId;
        if (ContactFlowARNMap.has(callId)) {
            amazonConnectFlowID = (ContactFlowARNMap.get(callId));
        }
        const contactFlow = yield (0, contact_flow_loader_1.loadContactFlow)(amazonConnectInstanceID, amazonConnectFlowID, bucketName);
        console.log("Loaded Contact Flow" + contactFlow);
        console.log("CallDetails:" + smaEvent.CallDetails);
        const transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
        console.log("TransactionAttributes:" + transactionAttributes);
        if (transactionAttributes && transactionAttributes.currentFlowBlock) {
            console.log("InvocationEventType:" + smaEvent.InvocationEventType);
            if (smaEvent.InvocationEventType === 'ACTION_SUCCESSFUL') {
                if (smaEvent.ActionData.ReceivedDigits != null) {
                    const recieved_digits = smaEvent.ActionData.ReceivedDigits;
                    return yield processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, recieved_digits, amazonConnectInstanceID, bucketName);
                }
                return yield processFlowActionSuccess(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, amazonConnectInstanceID, bucketName);
            }
            else {
                return yield processFlowActionFailed(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, amazonConnectInstanceID, bucketName);
            }
        }
        else {
            // We're at the root start from there
            return yield processRootFlowBlock(smaEvent, contactFlow, transactionAttributes, amazonConnectInstanceID, bucketName);
        }
    });
}
exports.processFlow = processFlow;
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
function processRootFlowBlock(smaEvent, contactFlow, transactionAttributes, amazonConnectInstanceID, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        // OK, time to figure out the root of the flow
        if (contactFlow.StartAction !== null) {
            const actions = contactFlow.Actions;
            console.log("Root Flow Block The actions are" + actions);
            if (actions !== null && actions.length > 0) {
                const currentAction = findActionByID(actions, contactFlow.StartAction);
                console.log("Root Flow Block The current Action is " + currentAction.Type);
                if (currentAction !== null) {
                    return yield processFlowAction(smaEvent, currentAction, actions, amazonConnectInstanceID, bucketName);
                }
            }
        }
    });
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
function processFlowAction(smaEvent, action, actions, amazonConnectInstanceID, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("ProcessFlowAction:" + action);
        switch (action.Type) {
            case 'GetParticipantInput':
                return yield processFlowActionGetParticipantInput(smaEvent, action);
            case 'MessageParticipant':
                return yield processFlowActionMessageParticipant(smaEvent, action);
            case 'DisconnectParticipant':
                return yield processFlowActionDisconnectParticipant(smaEvent, action);
            case 'Wait':
                return yield processFlowActionWait(smaEvent, action, actions, amazonConnectInstanceID, bucketName);
            case 'UpdateContactRecordingBehavior':
                return yield processFlowActionUpdateContactRecordingBehavior(smaEvent, action);
            case 'Loop':
                return yield processFlowActionLoop(smaEvent, action, actions, amazonConnectInstanceID, bucketName);
            case 'TransferParticipantToThirdParty':
                return yield processFlowActionTransferParticipantToThirdParty(smaEvent, action);
            case 'ConnectParticipantWithLexBot':
                return yield processFlowActionConnectParticipantWithLexBot(smaEvent, action);
            case 'TransferToFlow':
                return yield processFlowActionTransferToFlow(smaEvent, action, amazonConnectInstanceID, bucketName);
            default:
                null;
        }
    });
}
/**
  * Making a SMA action to perform delivering an audio message to obtain customer input.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
function processFlowActionGetParticipantInput(smaEvent, action) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __awaiter(this, void 0, void 0, function* () {
        if (action.Parameters.Media != null) {
            console.log("Play Audio And Get Digits");
            return yield processPlayAudioAndGetDigits(smaEvent, action);
        }
        const legA = getLegACallDetails(smaEvent);
        console.log("Speak and Get Digits Action");
        let smaAction = {
            Type: "SpeakAndGetDigits",
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
    });
}
/**
  * Making play audio json object for sma action.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
function processPlayAudio(smaEvent, action) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Play Audio Action");
        let smaAction = {
            Type: "PlayAudio",
            Parameters: {
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
    });
}
/**
  * Making play audio and get digits json object for sma action.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
function processPlayAudioAndGetDigits(smaEvent, action) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __awaiter(this, void 0, void 0, function* () {
        let smaAction = {
            Type: "PlayAudioAndGetDigits",
            Parameters: {
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
    });
}
/**
  * After received success event from SMA,process the next action.
  * @param smaEvent
  * @param action
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns Process Flow Action
  */
function processFlowActionSuccess(smaEvent, action, contactFlow, amazonConnectInstanceID, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        let transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
        if (action.Parameters && action.Parameters.StoreInput == "True") {
            smaEvent.CallDetails.TransactionAttributes = updateConnectContextStore(transactionAttributes, "StoredCustomerInput", smaEvent.ActionData.ReceivedDigits);
        }
        if (smaEvent.ActionData.IntentResult != null) {
            let intentName = smaEvent.ActionData.IntentResult.SessionState.Intent.Name;
            return yield processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, intentName, amazonConnectInstanceID, bucketName);
        }
        const nextAction = findActionByID(contactFlow.Actions, action.Transitions.NextAction);
        return yield processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName);
    });
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
function updateLoopCountStore(transactionAttributes, key, value) {
    if (transactionAttributes[loopCountStore])
        transactionAttributes[loopCountStore][key] = value;
    else {
        transactionAttributes[loopCountStore] = {};
        transactionAttributes[loopCountStore][key] = value;
    }
    return transactionAttributes;
}
/**
  * Making a SMA action to perform Ends the interaction.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
function processFlowActionDisconnectParticipant(smaEvent, action) {
    return __awaiter(this, void 0, void 0, function* () {
        let callId;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (callId == "NaN")
            callId = smaEvent.ActionData.Parameters.CallId;
        ContactFlowARNMap.delete(callId);
        console.log("Hangup Action");
        let smaAction = {
            Type: "Hangup",
            Parameters: {
                "SipResponseCode": "0"
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
    });
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
function processFlowActionWait(smaEvent, action, actions, amazonConnectInstanceID, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Pause Action");
        let smaAction = {
            Type: "Pause",
            Parameters: {
                "DurationInMilliseconds": getWaitTimeParameter(action)
            }
        };
        const nextAction = findActionByID(actions, action.Transitions.Conditions[0].NextAction);
        console.log("Next Action identifier:" + action.Transitions.Conditions[0].NextAction);
        let smaAction1 = yield (yield processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName)).Actions[0];
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
    });
}
/**
  * Making a SMA action to perform Delivers an audio or chat message.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
function processFlowActionMessageParticipant(smaEvent, action) {
    return __awaiter(this, void 0, void 0, function* () {
        if (action.Parameters.Media != null) {
            console.log("Play Audio Action");
            return yield processPlayAudio(smaEvent, action);
        }
        const legA = getLegACallDetails(smaEvent);
        let text;
        let type;
        console.log("DEBUG Message Participant 1" + JSON.stringify(smaEvent));
        console.log("DEBUG Message Participant 2" + JSON.stringify(action));
        if (action.Parameters.Text !== null && action.Parameters.Text !== "" && action.Parameters.Text && action.Parameters.Text !== "undefined") {
            text = action.Parameters.Text;
            type = "text";
        }
        else if (action.Parameters.SSML !== null && action.Parameters.SSML && action.Parameters.SSML !== "undefined") {
            text = action.Parameters.SSML;
            type = "ssml";
        }
        let smaAction = {
            Type: "Speak",
            Parameters: {
                Engine: 'neural',
                CallId: legA.CallId,
                Text: text,
                TextType: type,
                VoiceId: "Joanna",
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
    });
}
function getSpeechParameters(action) {
    let rv = null;
    if (action.Text !== null || action.SSML !== null) {
        let text;
        let type;
        if (action.Parameters.Text !== null && action.Parameters.Text !== "" && action.Parameters.Text && action.Parameters.Text !== "undefined") {
            text = action.Parameters.Text;
            type = "text";
        }
        else if (action.Parameters.SSML !== null && action.Parameters.SSML && action.Parameters.SSML !== "undefined") {
            text = action.Parameters.SSML;
            type = "ssml";
        }
        rv = {
            Text: text,
            TextType: type
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
function processFlowActionUpdateContactRecordingBehavior(smaEvent, action) {
    return __awaiter(this, void 0, void 0, function* () {
        const legA = getLegACallDetails(smaEvent);
        if (action.Parameters.RecordingBehavior.RecordedParticipants.length < 1) {
            let smaAction = {
                Type: "StopCallRecording",
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
            Type: "StartCallRecording",
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
    });
}
function processFlowActionFailed(smaEvent, actionObj, contactFlow, amazonConnectInstanceID, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        let currentAction = contactFlow.Actions.find((action) => action.Identifier === actionObj.Identifier);
        let smaAction;
        let nextAction;
        if (smaEvent != null && smaEvent.ActionData.ErrorType.includes('InputTimeLimitExceeded')) {
            nextAction = yield getNextActionForError(currentAction, contactFlow, 'InputTimeLimitExceeded');
            smaAction = yield (yield processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
        }
        else if (smaEvent != null && smaEvent.ActionData.ErrorType.includes('NoMatchingCondition')) {
            nextAction = yield getNextActionForError(currentAction, contactFlow, 'NoMatchingCondition');
            smaAction = yield (yield processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
        }
        else if (smaEvent != null && smaEvent.ActionData.ErrorType.includes('ConnectionTimeLimitExceeded')) {
            nextAction = yield getNextActionForError(currentAction, contactFlow, 'ConnectionTimeLimitExceeded');
            smaAction = yield (yield processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
        }
        else if (smaEvent != null && smaEvent.ActionData.ErrorType.includes('CallFailed')) {
            nextAction = yield getNextActionForError(currentAction, contactFlow, 'CallFailed');
            smaAction = yield (yield processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
        }
        else {
            let count;
            for (let i = 0; i < currentAction.Transitions.Errors.length; i++) {
                if (currentAction.Transitions.Errors[i].ErrorType == "NoMatchingError") {
                    count = i;
                    break;
                }
            }
            nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[count].NextAction);
            console.log("Next Action identifier:" + currentAction.Transitions.Errors[count].NextAction);
            smaAction = yield (yield processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
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
    });
}
/**
  * Making a SMA action to perform delivering an audio or chat message to obtain customer input.
  * @param smaEvent
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @param recieved_digits
  * @returns SMA Action
  */
function processFlowConditionValidation(smaEvent, actionObj, contactFlow, recieved_digits, amazonConnectInstanceID, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
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
                    break;
                }
            }
            if (nextAction_id == null) {
                nextAction_id = currentAction.Transitions.Errors[1].NextAction;
                console.log("Conditions are not matching with Recieved Digits ");
                console.log("Next Action identifier" + nextAction_id);
            }
            nextAction = findActionByID(contactFlow.Actions, nextAction_id);
            console.log("Next Action identifier:" + nextAction_id);
            smaAction = yield (yield processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName)).Actions[0];
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
    });
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
function processFlowActionLoop(smaEvent, action, actions, amazonConnectInstanceID, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        let smaAction;
        let callId;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (callId == "NaN")
            callId = smaEvent.ActionData.Parameters.CallId;
        if (!loopMap.has(callId) || loopMap.get(callId) != action.Parameters.LoopCount) {
            const nextAction = findActionByID(actions, action.Transitions.Conditions[1].NextAction);
            console.log("Next Action identifier:" + action.Transitions.Conditions[1].NextAction);
            smaAction = yield (yield processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName)).Actions[0];
            let count = String(Number.parseInt(loopMap.get(callId)) + 1);
            if (!loopMap.has(callId))
                loopMap.set(callId, "1");
            else
                loopMap.set(callId, count);
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
            loopMap.delete(callId);
            let nextAction = findActionByID(actions, action.Transitions.Conditions[0].NextAction);
            console.log("Next Action identifier:" + action.Transitions.Conditions[0].NextAction);
            smaAction = yield (yield processFlowAction(smaEvent, nextAction, actions, amazonConnectInstanceID, bucketName)).Actions[0];
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
    });
}
/**
  * Making a SMA action to perform Transfer a call to a phone number for voice interactions.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
function processFlowActionTransferParticipantToThirdParty(smaEvent, action) {
    return __awaiter(this, void 0, void 0, function* () {
        let smaAction = {
            Type: "CallAndBridge",
            Parameters: {
                "CallTimeoutSeconds": action.Parameters.ThirdPartyConnectionTimeLimitSeconds,
                "CallerIdNumber": action.Parameters.ThirdPartyPhoneNumber,
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
    });
}
/**
  * Making a SMA action to perform delvier a Chat message and obtain customer input.
  * @param smaEvent
  * @param action
  * @returns SMA Action
  */
function processFlowActionConnectParticipantWithLexBot(smaEvent, action) {
    return __awaiter(this, void 0, void 0, function* () {
        let smaAction = {
            Type: "StartBotConversation",
            Parameters: {
                BotAliasArn: action.Parameters.LexV2Bot.AliasArn,
                LocaleId: "en_US",
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
        return {
            "SchemaVersion": "1.0",
            "Actions": [
                smaAction
            ],
            "TransactionAttributes": {
                "currentFlowBlock": action
            }
        };
    });
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
function processFlowActionTransferToFlow(smaEvent, action, amazonConnectInstanceID, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        let TransferFlowARN = action.Parameters.ContactFlowId;
        let callId;
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (callId == "NaN")
            callId = smaEvent.ActionData.Parameters.CallId;
        ContactFlowARNMap.set(callId, TransferFlowARN);
        const contactFlow = yield (0, contact_flow_loader_1.loadContactFlow)(amazonConnectInstanceID, TransferFlowARN, bucketName);
        console.log("Transfering to Another contact FLow function");
        return yield processRootFlowBlock(smaEvent, contactFlow, smaEvent.CallDetails.TransactionAttributes, amazonConnectInstanceID, bucketName);
    });
}
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
