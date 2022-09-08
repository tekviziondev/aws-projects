import { loadContactFlow } from "./contact-flow-loader";

const connectContextStore: string = "ConnectContextStore";

export async function processFlow(smaEvent: any, amazonConnectInstanceID: string, amazonConnectFlowID: string,bucketName:string) {
    const contactFlow = await loadContactFlow(amazonConnectInstanceID, amazonConnectFlowID,bucketName);
    console.log("Loaded Contact Flow"+contactFlow);
    console.log("CallDetails:"+smaEvent.CallDetails);
    const transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
    console.log("TransactionAttributes:"+transactionAttributes);
    if (transactionAttributes && transactionAttributes.currentFlowBlock) {
        console.log("InvocationEventType:"+smaEvent.InvocationEventType);
        if (smaEvent.InvocationEventType === 'ACTION_SUCCESSFUL') {
            return await processFlowActionSuccess(smaEvent, transactionAttributes.currentFlowBlock, contactFlow);
        }
        else {
            return await processFlowActionFailure(smaEvent, transactionAttributes.currentFlowBlock, contactFlow);
        }
    }
    else {
        // We're at the root start from there
        return await processRootFlowBlock(smaEvent, contactFlow, transactionAttributes);
    }
}

async function processRootFlowBlock(smaEvent: any, contactFlow: any, transactionAttributes: any) {
    // OK, time to figure out the root of the flow
   
    if (contactFlow.StartAction !== null) {
        const actions: any[] = contactFlow.Actions;
        if (actions !== null && actions.length > 0) {
            const currentAction = findActionByID(actions, contactFlow.StartAction);
            if (currentAction !== null) {
                return await processFlowAction(smaEvent, currentAction);
            }
        }
    }
}

async function processFlowActionFailure(smaEvent: any, action: any, contactFlow: any) {
    console.log("ProcessFlowActionFailure:"+action);
    switch (action.Type) {
        case 'GetParticipantInput':
            return await processFlowActionGetParticipantInput(smaEvent, action);
            case 'MessageParticipant':
                return await processFlowActionMessageParticipant(smaEvent, action);
                case 'DisconnectParticipant':
                    return await processFlowActionDisconnectParticipant(smaEvent, action);
        default:
            return null;
    }
}

async function processFlowActionSuccess(smaEvent: any, action: any, contactFlow: any) {
    console.log("ProcessFlowActionSuccess:"+action);
    switch (action.Type) {
        case 'GetParticipantInput':
            return await processFlowActionGetParticipantInput(smaEvent, action);
            case 'MessageParticipant':
                return await processFlowActionMessageParticipant(smaEvent, action);
                case 'DisconnectParticipant':
                    return await processFlowActionDisconnectParticipant(smaEvent, action);
                case 'Wait':
                    return await processFlowActionWait(smaEvent, action);
        default:
            return null;
    }
}

async function processFlowAction(smaEvent: any, action: any) {
    console.log("ProcessFlowAction:"+action);
    switch (action.Type) {
        case 'GetParticipantInput':
            return await processFlowActionGetParticipantInput(smaEvent, action);
            case 'MessageParticipant':
                return await processFlowActionMessageParticipant(smaEvent, action);
                case 'DisconnectParticipant':
                    return await processFlowActionDisconnectParticipant(smaEvent, action);
                case 'Wait':
                    return await processFlowActionWait(smaEvent, action);
        default:
            return null;
    }
}

async function processFlowActionGetParticipantInput(smaEvent: any, action: any) {
    if(action.Parameters.Media!=null){
        console.log("Play Audio And Get Digits");
        return await processPlayAudioAndGetDigits(smaEvent, action);
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

    if (action.Parameters?.InputValidation) {
        if (action.Parameters?.InputValidation?.CustomValidation) {
            if (action.Parameters?.InputValidation?.CustomValidation?.MaximumLength) {
                smaAction.Parameters['MaxNumberOfDigits'] = action.Parameters?.InputValidation?.CustomValidation?.MaximumLength;
            }
        }
    }
    if (action.Parameters.DTMFConfiguration && action.Parameters.DTMFConfiguration.InputTerminationSequence) {
        smaAction.Parameters["TerminatorDigits"] = action.Parameters.DTMFConfiguration.InputTerminationSequence;
    }
    if (action.Parameters.InputTimeLimitSeconds) {
        const timeLimit: number = Number.parseInt(action.Parameters.InputTimeLimitSeconds);
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
    }
}

async function processPlayAudio(smaEvent: any, action: any) {
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
    }
}

async function processPlayAudioAndGetDigits(smaEvent: any, action: any) {
       const legA = getLegACallDetails(smaEvent);
    let smaAction = {
        Type: "PlayAudioAndGetDigits",
        Parameters: {
            "AudioSource": getAudioParameters(action),
            "FailureAudioSource": getAudioParameters(action),
            "MinNumberOfDigits": 5
        }
    };

    if (action.Parameters?.InputValidation) {
        if (action.Parameters?.InputValidation?.CustomValidation) {
            if (action.Parameters?.InputValidation?.CustomValidation?.MaximumLength) {
                smaAction.Parameters['MaxNumberOfDigits'] = action.Parameters?.InputValidation?.CustomValidation?.MaximumLength;
            }
        }
    }
    if (action.Parameters.DTMFConfiguration && action.Parameters.DTMFConfiguration.InputTerminationSequence) {
        smaAction.Parameters["TerminatorDigits"] = action.Parameters.DTMFConfiguration.InputTerminationSequence;
    }
    if (action.Parameters.InputTimeLimitSeconds) {
        const timeLimit: number = Number.parseInt(action.Parameters.InputTimeLimitSeconds);
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
    }
}

async function processFlowActionGetParticipantInputSuccess(smaEvent: any, action: any, contactFlow: any) {
    const legA = getLegACallDetails(smaEvent);
    let transactionAttributes = smaEvent.CallDetails.TransactionAttributes;

    if (action.Parameters && action.Parameters.StoreInput == "True") {
        smaEvent.CallDetails.TransactionAttributes = updateConnectContextStore(transactionAttributes, "StoredCustomerInput", smaEvent.ActionData.ReceivedDigits);
    }

    const nextAction = findActionByID(contactFlow.Actions, action.Transitions.NextAction);
    return await processFlowAction(smaEvent, nextAction);
}

async function processFlowActionGetParticipantInputFailure(smaEvent: any, action: any, contactFlow: any) {
    return null;
}

function updateConnectContextStore(transactionAttributes: any, key: string, value: any) {
    if (transactionAttributes[connectContextStore]) transactionAttributes[connectContextStore][key] = value;
    else {
        transactionAttributes[connectContextStore] = { };
        transactionAttributes[connectContextStore][key] = value;
    }
    return transactionAttributes;
}
async function processFlowActionDisconnectParticipant(smaEvent:any, action:any){
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
    }
}

async function processFlowActionWait(smaEvent:any, action:any){
    const legA = getLegACallDetails(smaEvent);
    let smaAction = {
        Type: "Pause",
        Parameters: {
            "DurationInMilliseconds": getWaitTimeParameter(action)
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
    }
}



async function processFlowActionMessageParticipant(smaEvent: any, action: any) {
    if(action.Parameters.Media!=null){
        console.log("Play Audio Action");
        return await processPlayAudio(smaEvent, action);
   }
    const legA = getLegACallDetails(smaEvent);
    let text:string;
    let type:string;
    if (action.Parameters.Text !== null) {
        text = action.Parameters.Text;
        type = "text";
    }
    let smaAction = {
        Type: "Speak",
           
        Parameters: {
            "CallId": legA.CallId,
            "text":text,
            "type":type,
            "VoiceId":"Joanna"
            
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
    }
}



function getSpeechParameters(action: any) {
    let rv = null;
    if (action.Text !== null || action.SSML !== null) {
        let text: string;
        let type: string;
        if (action.Parameters.Text !== null) {
            text = action.Parameters.Text;
            type = "text"
        }
        else if (action.Parameters.SSML !== null) {
            text = action.Parameters.SSML;
            type == "ssml";
        }
        rv = {
            Text: text,
            TextType: type
        }
    }
    console.log(rv);
    return rv;
}

function getAudioParameters(action: any) {
    let rv = null;
    
        let bucketName: string;
        let type: string;
        let uri:string;
        let  uriObj:string[];
        let key:string;
        
        if (action.Parameters.SourceType !== null) {
            console.log("Parameters SourceType Exists");
            uri = action.Parameters.Media.Uri;
            console.log("Uri Value"+uri);
            uriObj=uri.split("/");
            console.log("UriObj Value"+uriObj);
            bucketName = uriObj[1];
            console.log("BucketName"+bucketName);
            key=uriObj[2];
            console.log("key Value"+key);
            type = action.Parameters.SourceType;
            console.log("Type Value"+type);
        }
      
        rv = {
            Type: type,
            BucketName: bucketName,
            Key:key
        }
    
    console.log(rv);
    return rv;
}

function getWaitTimeParameter(action: any){
    let rv=null;
    if (action.TimeLimitSeconds !== null ) {
        let seconds: number;
        const timeLimitSeconds: number = Number.parseInt(action.Parameters.TimeLimitSeconds);
        rv = {
            seconds:timeLimitSeconds*1000
        } 
    }   
    console.log(rv);
    return rv;
}

function findActionByID(actions: any[], identifier: string) {
    return actions.find((action: any) => action.Identifier === identifier);
}

function getLegACallDetails(event: any) {
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