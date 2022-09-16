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
function processFlow(smaEvent, amazonConnectInstanceID, amazonConnectFlowID, bucketName) {
    return __awaiter(this, void 0, void 0, function* () {
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
                    return yield processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, recieved_digits);
                }
                return yield processFlowActionGetParticipantInputSuccess(smaEvent, transactionAttributes.currentFlowBlock, contactFlow);
            }
            else {
                return yield processFlowActionFailed(smaEvent, transactionAttributes.currentFlowBlock, contactFlow);
            }
        }
        else {
            // We're at the root start from there
            return yield processRootFlowBlock(smaEvent, contactFlow, transactionAttributes);
        }
    });
}
exports.processFlow = processFlow;
function processRootFlowBlock(smaEvent, contactFlow, transactionAttributes) {
    return __awaiter(this, void 0, void 0, function* () {
        // OK, time to figure out the root of the flow
        if (contactFlow.StartAction !== null) {
            const actions = contactFlow.Actions;
            if (actions !== null && actions.length > 0) {
                const currentAction = findActionByID(actions, contactFlow.StartAction);
                if (currentAction !== null) {
                    return yield processFlowAction(smaEvent, currentAction, actions);
                }
            }
        }
    });
}
function processFlowActionFailure(smaEvent, action, contactFlow) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("ProcessFlowActionFailure:" + action);
        switch (action.Type) {
            case 'GetParticipantInput':
                return yield processFlowActionGetParticipantInput(smaEvent, action);
            case 'MessageParticipant':
                return yield processFlowActionMessageParticipant(smaEvent, action);
            case 'DisconnectParticipant':
                return yield processFlowActionDisconnectParticipant(smaEvent, action);
            default:
                return null;
        }
    });
}
function processFlowActionSuccess(smaEvent, action, contactFlow) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("ProcessFlowActionSuccess:" + action);
        switch (action.Type) {
            case 'GetParticipantInput':
                return yield processFlowActionGetParticipantInput(smaEvent, action);
            case 'MessageParticipant':
                return yield processFlowActionMessageParticipant(smaEvent, action);
            case 'DisconnectParticipant':
                return yield processFlowActionDisconnectParticipant(smaEvent, action);
            case 'Wait':
                return yield processFlowActionWait(smaEvent, action, contactFlow);
            default:
                return null;
        }
    });
}
function processFlowAction(smaEvent, action, actions) {
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
                return yield processFlowActionWait(smaEvent, action, actions);
            case 'UpdateContactRecordingBehavior':
                return yield processFlowActionUpdateContactRecordingBehavior(smaEvent, action);
            case 'UpdateContactRecordingBehavior':
                return yield processFlowActionUpdateContactRecordingBehavior(smaEvent, action);
            case 'Loop':
                return yield processFlowActionLoop(smaEvent, action, actions);
            default:
                return null;
        }
    });
}
function processFlowActionGetParticipantInput(smaEvent, action) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __awaiter(this, void 0, void 0, function* () {
        if (action.Parameters.Media != null) {
            console.log("Play Audio And Get Digits");
            return yield processPlayAudioAndGetDigits(smaEvent, action);
        }
        const legA = getLegACallDetails(smaEvent);
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
function processPlayAudio(smaEvent, action) {
    return __awaiter(this, void 0, void 0, function* () {
        const legA = getLegACallDetails(smaEvent);
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
function processPlayAudioAndGetDigits(smaEvent, action) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __awaiter(this, void 0, void 0, function* () {
        const legA = getLegACallDetails(smaEvent);
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
function processFlowActionGetParticipantInputSuccess(smaEvent, action, contactFlow) {
    return __awaiter(this, void 0, void 0, function* () {
        const legA = getLegACallDetails(smaEvent);
        let transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
        if (action.Parameters && action.Parameters.StoreInput == "True") {
            smaEvent.CallDetails.TransactionAttributes = updateConnectContextStore(transactionAttributes, "StoredCustomerInput", smaEvent.ActionData.ReceivedDigits);
        }
        let currentAction;
        if (action.Type == "Loop") {
            currentAction = findActionByID(contactFlow.Actions, action.Identifier);
            currentAction.Parameters.LoopCount = action.Parameters.LoopCount;
            return yield processFlowAction(smaEvent, currentAction, contactFlow.Actions);
        }
        const nextAction = findActionByID(contactFlow.Actions, action.Transitions.NextAction);
        return yield processFlowAction(smaEvent, nextAction, contactFlow.Actions);
    });
}
function processFlowActionGetParticipantInputFailure(smaEvent, action, contactFlow) {
    return __awaiter(this, void 0, void 0, function* () {
        return null;
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
function processFlowActionDisconnectParticipant(smaEvent, action) {
    return __awaiter(this, void 0, void 0, function* () {
        const legA = getLegACallDetails(smaEvent);
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
function processFlowActionWait(smaEvent, action, actions) {
    return __awaiter(this, void 0, void 0, function* () {
        const legA = getLegACallDetails(smaEvent);
        let smaAction = {
            Type: "Pause",
            Parameters: {
                "DurationInMilliseconds": getWaitTimeParameter(action)
            }
        };
        const nextAction = findActionByID(actions, action.Transitions.Conditions[0].NextAction);
        console.log("Next Action identifier:" + action.Transitions.Conditions[0].NextAction);
        let smaAction1 = yield (yield processFlowAction(smaEvent, nextAction, actions)).Actions[0];
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
function processFlowActionMessageParticipant(smaEvent, action) {
    return __awaiter(this, void 0, void 0, function* () {
        if (action.Parameters.Media != null) {
            console.log("Play Audio Action");
            return yield processPlayAudio(smaEvent, action);
        }
        const legA = getLegACallDetails(smaEvent);
        let text;
        let type;
        if (action.Parameters.Text !== null) {
            text = action.Parameters.Text;
            type = "text";
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
        if (action.Parameters.Text !== null) {
            text = action.Parameters.Text;
            type = "text";
        }
        else if (action.Parameters.SSML !== null) {
            text = action.Parameters.SSML;
            type == "ssml";
        }
        rv = {
            Text: text,
            TextType: type
        };
    }
    console.log(rv);
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
        console.log("Parameters SourceType Exists");
        uri = action.Parameters.Media.Uri;
        console.log("Uri Value" + uri);
        uriObj = uri.split("/");
        console.log("UriObj Value" + uriObj);
        bucketName = uriObj[2];
        console.log("BucketName" + bucketName);
        key = uriObj[3];
        console.log("key Value" + key);
        type = action.Parameters.Media.SourceType;
        console.log("Type Value" + type);
    }
    rv = {
        Type: type,
        BucketName: bucketName,
        Key: key
    };
    console.log(rv);
    return rv;
}
function getWaitTimeParameter(action) {
    let rv;
    if (action.TimeLimitSeconds !== null) {
        let seconds;
        const timeLimitSeconds = Number.parseInt(action.Parameters.TimeLimitSeconds);
        rv = String(timeLimitSeconds * 1000);
    }
    console.log(rv);
    return rv;
}
function findActionByID(actions, identifier) {
    return actions.find((action) => action.Identifier === identifier);
}
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
                    "Location": " callrecordings-us-east-1-664887287655"
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
function processFlowActionFailed(smaEvent, actionObj, contactFlow) {
    return __awaiter(this, void 0, void 0, function* () {
        let currentAction = contactFlow.Actions.find((action) => action.Identifier === actionObj.Identifier);
        if (actionObj.Type == "Loop") {
            currentAction.Parameters.LoopCount = actionObj.Parameters.LoopCount;
            return yield processFlowAction(smaEvent, currentAction, contactFlow.Actions);
        }
        let smaAction;
        let nextAction;
        if (smaEvent != null && smaEvent.ActionData.ErrorType.includes('InputTimeLimitExceeded')) {
            nextAction = yield getNextAction(currentAction, contactFlow, 'InputTimeLimitExceeded');
            smaAction = yield (yield processFlowAction(smaEvent, nextAction, contactFlow.Actions)).Actions[0];
        }
        else if (smaEvent != null && smaEvent.ActionData.ErrorType.includes('NoMatchingCondition')) {
            nextAction = yield getNextAction(currentAction, contactFlow, 'InputTimeLimitExceeded');
            smaAction = yield (yield processFlowAction(smaEvent, nextAction, contactFlow.Actions)).Actions[0];
        }
        else {
            nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[0].NextAction);
            console.log("Next Action identifier:" + currentAction.Transitions.Errors[0].NextAction);
            smaAction = yield (yield processFlowAction(smaEvent, nextAction, contactFlow.Actions)).Actions[0];
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
function processFlowConditionValidation(smaEvent, actionObj, contactFlow, recieved_digits) {
    return __awaiter(this, void 0, void 0, function* () {
        let currentAction = contactFlow.Actions.find((action) => action.Identifier === actionObj.Identifier);
        let smaAction;
        let nextAction;
        let nextAction_id;
        const condition = currentAction.Transitions.Conditions;
        if (smaEvent != null && condition.length > 0) {
            console.log("Enter If Condition ");
            for (let index = 0; index < condition.length; index++) {
                console.log("Recieved Digits " + recieved_digits);
                console.log("Condition Operands " + condition[index].Condition.Operands[0]);
                if (condition[index].Condition.Operands[0] === recieved_digits) {
                    nextAction_id = condition[index].NextAction;
                    console.log("the Passed condition action is " + nextAction_id);
                    break;
                }
            }
            if (nextAction_id == null) {
                nextAction_id = currentAction.Transitions.Errors[1].NextAction;
                console.log("the Condition is failed, because there is No MatchingCondition ");
                console.log("the failed condition next action id " + nextAction_id);
            }
            nextAction = findActionByID(contactFlow.Actions, nextAction_id);
            console.log("Next Action identifier:" + nextAction_id);
            smaAction = yield (yield processFlowAction(smaEvent, nextAction, contactFlow.Actions)).Actions[0];
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
function processFlowActionLoop(smaEvent, action, actions) {
    return __awaiter(this, void 0, void 0, function* () {
        let smaAction;
        if (action.Parameters.LoopCount != "0") {
            const nextAction = findActionByID(actions, action.Transitions.Conditions[1].NextAction);
            console.log("Next Action identifier:" + action.Transitions.Conditions[1].NextAction);
            smaAction = yield (yield processFlowAction(smaEvent, nextAction, actions)).Actions[0];
            let count = Number.parseInt(action.Parameters.LoopCount) - 1;
            action.Parameters.LoopCount = String(count);
            console.log("Next Action Data:" + smaAction);
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
        else {
            let nextAction = findActionByID(actions, action.Transitions.Conditions[0].NextAction);
            console.log("Next Action identifier:" + action.Transitions.Conditions[0].NextAction);
            smaAction = yield (yield processFlowAction(smaEvent, nextAction, actions)).Actions[0];
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
    });
}
function getNextAction(currentAction, contactFlow, ErrorType) {
    let nextAction;
    if (currentAction.Transitions.Errors > 2 && currentAction.Transitions.Errors[2].includes(ErrorType)) {
        nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[2].NextAction);
        console.log("Next Action identifier:" + currentAction.Transitions.Errors[2].NextAction);
    }
    else if (currentAction.Transitions.Errors > 1 && currentAction.Transitions.Errors[1].includes(ErrorType)) {
        nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[1].NextAction);
        console.log("Next Action identifier:" + currentAction.Transitions.Errors[1].NextAction);
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
