import { loadContactFlow } from "./contact-flow-loader";

const connectContextStore: string = "ConnectContextStore";
const loopCountStore: string = "LoopCountStore";
let loopMap = new Map<string, string>();

export async function processFlow(smaEvent: any, amazonConnectInstanceID: string, amazonConnectFlowID: string,bucketName:string) {
    const contactFlow = await loadContactFlow(amazonConnectInstanceID, amazonConnectFlowID,bucketName);
    console.log("Loaded Contact Flow"+contactFlow);
    console.log("CallDetails:"+smaEvent.CallDetails);
    const transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
    console.log("TransactionAttributes:"+transactionAttributes);
    if (transactionAttributes && transactionAttributes.currentFlowBlock) {
        console.log("InvocationEventType:"+smaEvent.InvocationEventType);
        if (smaEvent.InvocationEventType === 'ACTION_SUCCESSFUL') {
            if(smaEvent.ActionData.ReceivedDigits!=null){
                const recieved_digits=smaEvent.ActionData.ReceivedDigits;
                return await processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow,recieved_digits);
            }
            return await processFlowActionSuccess(smaEvent, transactionAttributes.currentFlowBlock, contactFlow);
        }
        else {
            return await processFlowActionFailed(smaEvent, transactionAttributes.currentFlowBlock, contactFlow);
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
                return await processFlowAction(smaEvent, currentAction,actions);
            }
        }
    }
}

async function processFlowAction(smaEvent: any, action: any,actions:any) {
    console.log("ProcessFlowAction:"+action);
    switch (action.Type) {
        case 'GetParticipantInput':
            return await processFlowActionGetParticipantInput(smaEvent, action);
        case 'MessageParticipant':
            return await processFlowActionMessageParticipant(smaEvent, action);
        case 'DisconnectParticipant':
             return await processFlowActionDisconnectParticipant(smaEvent, action);
        case 'Wait':
            return await processFlowActionWait(smaEvent, action,actions);
        case 'UpdateContactRecordingBehavior':
            return await processFlowActionUpdateContactRecordingBehavior(smaEvent, action)
        case 'UpdateContactRecordingBehavior':
            return await processFlowActionUpdateContactRecordingBehavior(smaEvent, action)
        case 'Loop':
            return await processFlowActionLoop(smaEvent, action,actions)
        case 'TransferParticipantToThirdParty':
            return await processFlowActionTransferParticipantToThirdParty(smaEvent, action)
            case 'ConnectParticipantWithLexBot':
                return await processFlowActionConnectParticipantWithLexBot(smaEvent, action)
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
    }
}

async function processPlayAudioAndGetDigits(smaEvent: any, action: any) {
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

async function processFlowActionSuccess(smaEvent: any, action: any, contactFlow: any) {
    let transactionAttributes = smaEvent.CallDetails.TransactionAttributes;

    if (action.Parameters && action.Parameters.StoreInput == "True") {
        smaEvent.CallDetails.TransactionAttributes = updateConnectContextStore(transactionAttributes, "StoredCustomerInput", smaEvent.ActionData.ReceivedDigits);
    }
    if(smaEvent.ActionData.IntentResult!=null){
       let intentName= smaEvent.ActionData.IntentResult.SessionState.Intent.Name;
       return await processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow,intentName);
    }
    const nextAction = findActionByID(contactFlow.Actions, action.Transitions.NextAction);
    return await processFlowAction(smaEvent, nextAction,contactFlow.Actions);
}

function updateConnectContextStore(transactionAttributes: any, key: string, value: any) {
    if (transactionAttributes[connectContextStore]) transactionAttributes[connectContextStore][key] = value;
    else {
        transactionAttributes[connectContextStore] = { };
        transactionAttributes[connectContextStore][key] = value;
    }
    return transactionAttributes;
}

function updateLoopCountStore(transactionAttributes: any, key: string, value: any) {
    if (transactionAttributes[loopCountStore]) transactionAttributes[loopCountStore][key] = value;
    else {
        transactionAttributes[loopCountStore] = { };
        transactionAttributes[loopCountStore][key] = value;
    }
    return transactionAttributes;
}

async function processFlowActionDisconnectParticipant(smaEvent:any, action:any){
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
    }
}

async function processFlowActionWait(smaEvent:any, action:any,actions:any){
    console.log("Pause Action");
    let smaAction = {
        Type: "Pause",
        Parameters: {
            "DurationInMilliseconds": getWaitTimeParameter(action)
        }
    };
    const nextAction = findActionByID(actions, action.Transitions.Conditions[0].NextAction);
    console.log("Next Action identifier:"+action.Transitions.Conditions[0].NextAction);
    let smaAction1 =await (await processFlowAction(smaEvent, nextAction,actions)).Actions[0];
    console.log("Next Action Data:"+smaAction1);
    return {
        "SchemaVersion": "1.0",
        "Actions": [
            smaAction,smaAction1
        ],
        "TransactionAttributes": {
            "currentFlowBlock": nextAction
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
    console.log("Speech Parameter : "+rv);
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
            console.log("Audio Parameters SourceType Exists");
            uri = action.Parameters.Media.Uri;
            uriObj=uri.split("/");
            bucketName = uriObj[2];
            key=uriObj[3];
            type = action.Parameters.Media.SourceType;
        }
        rv = {
            Type: type,
            BucketName: bucketName,
            Key:key
        }
    
    console.log("Audio Parameters : "+rv);
    return rv;
}

function getWaitTimeParameter(action: any){
    let rv:string;
    if (action.TimeLimitSeconds !== null ) {
        let seconds: number;
        const timeLimitSeconds: number = Number.parseInt(action.Parameters.TimeLimitSeconds);
        rv = String(timeLimitSeconds*1000)
    }   
    console.log("Wait Parameter : "+rv);
    return rv;
}

function findActionByID(actions: any[], identifier: string) {
    return actions.find((action: any) => action.Identifier === identifier);
}
async function processFlowActionUpdateContactRecordingBehavior(smaEvent:any, action:any){
    const legA = getLegACallDetails(smaEvent);
    if(action.Parameters.RecordingBehavior.RecordedParticipants.length<1){
        let smaAction={
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
        }
    }
    let smaAction={
        Type: "StartCallRecording",
        Parameters:{
            "CallId": legA.CallId,
            "Track":"BOTH",
        Destination:{
         "Type": "S3",                                       
         "Location":" flow-cache1"
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
    }
}
async function processFlowActionFailed(smaEvent:any, actionObj:any,contactFlow:any){

    let currentAction=contactFlow.Actions.find((action: any) => action.Identifier===actionObj.Identifier);
    let smaAction:any;
    let nextAction:any;
    if(smaEvent!=null && smaEvent.ActionData.ErrorType.includes('InputTimeLimitExceeded')){
        nextAction=await getNextActionForError(currentAction,contactFlow,'InputTimeLimitExceeded');
     smaAction =await (await processFlowAction(smaEvent, nextAction,contactFlow.Actions)).Actions[0];
    }else if(smaEvent!=null && smaEvent.ActionData.ErrorType.includes('NoMatchingCondition')){
        nextAction=await getNextActionForError(currentAction,contactFlow,'NoMatchingCondition');
        smaAction =await (await processFlowAction(smaEvent, nextAction,contactFlow.Actions)).Actions[0];
    }
    else if(smaEvent!=null && smaEvent.ActionData.ErrorType.includes('ConnectionTimeLimitExceeded')){
        nextAction=await getNextActionForError(currentAction,contactFlow,'ConnectionTimeLimitExceeded');
        smaAction =await (await processFlowAction(smaEvent, nextAction,contactFlow.Actions)).Actions[0];
    }
    else if(smaEvent!=null && smaEvent.ActionData.ErrorType.includes('CallFailed')){
        nextAction=await getNextActionForError(currentAction,contactFlow,'CallFailed');
        smaAction =await (await processFlowAction(smaEvent, nextAction,contactFlow.Actions)).Actions[0];       
    
}else{
    let count:number;
    for(let i=0;i<currentAction.Transitions.Errors.length;i++){
        if(currentAction.Transitions.Errors[i].ErrorType=="NoMatchingError"){
            count=i;
            break;
        }
    }
     nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[count].NextAction);
     console.log("Next Action identifier:"+currentAction.Transitions.Errors[count].NextAction);
     smaAction =await (await processFlowAction(smaEvent, nextAction,contactFlow.Actions)).Actions[0];
    
}
    return {
        "SchemaVersion": "1.0",
        "Actions": [
            smaAction
        ],
        "TransactionAttributes": {
            "currentFlowBlock": nextAction
        }
    }
}

async function processFlowConditionValidation(smaEvent:any, actionObj:any,contactFlow:any,recieved_digits:any){
    let currentAction=contactFlow.Actions.find((action: any) => action.Identifier===actionObj.Identifier);
    let smaAction:any;
    let nextAction:any;
    let nextAction_id:any;
    const condition=currentAction.Transitions.Conditions;
    if(smaEvent!=null  && condition.length>0){
        for (let index = 0; index < condition.length; index++) {
            console.log("Recieved Digits "+recieved_digits);
            console.log("Condition Operands "+condition[index].Condition.Operands[0]);
            if(condition[index].Condition.Operands[0]===recieved_digits){
                 nextAction_id=condition[index].NextAction;
                console.log("The condition passsed with recieved digit "+recieved_digits);
                console.log("Next Action identifier"+nextAction_id)
                break;
                }
            }
        if(nextAction_id==null){
             nextAction_id=currentAction.Transitions.Errors[1].NextAction;
            console.log("Conditions are not matching with Recieved Digits ");
            console.log("Next Action identifier"+nextAction_id)
        }
        nextAction = findActionByID(contactFlow.Actions,nextAction_id)
        console.log("Next Action identifier:"+nextAction_id);
        smaAction =await (await processFlowAction(smaEvent, nextAction,contactFlow.Actions)).Actions[0];
        return {
            "SchemaVersion": "1.0",
            "Actions": [
                smaAction
            ],
            "TransactionAttributes": {
                "currentFlowBlock": nextAction
            }
        }
    }
}

async function processFlowActionLoop(smaEvent:any, action:any,actions:any){
    let smaAction:any;
    let callId:string;
        const legA = getLegACallDetails(smaEvent);
         callId=legA.CallId;
        if(callId=="NaN")
        callId=  smaEvent.ActionData.Parameters.CallId;
    if(!loopMap.has(callId) || loopMap.get(callId)!=action.Parameters.LoopCount){
    const nextAction = findActionByID(actions, action.Transitions.Conditions[1].NextAction);
    console.log("Next Action identifier:"+action.Transitions.Conditions[1].NextAction);
    smaAction= await (await processFlowAction(smaEvent, nextAction,actions)).Actions[0];
   let count = String(Number.parseInt(loopMap.get(callId))+1)
   if(!loopMap.has(callId))
    loopMap.set(callId,"1");
    else
    loopMap.set(callId,count);
    console.log("Next Action Data:"+smaAction);
    return {
        "SchemaVersion": "1.0",
        "Actions": [
             smaAction
        ],
        "TransactionAttributes": {
        "currentFlowBlock": nextAction
        }
        }
    }else{
        loopMap.delete(callId);
        let nextAction = findActionByID(actions, action.Transitions.Conditions[0].NextAction);
    console.log("Next Action identifier:"+action.Transitions.Conditions[0].NextAction);
    smaAction= await (await processFlowAction(smaEvent, nextAction,actions)).Actions[0];
    console.log("Next Action Data:"+smaAction);
    return {
        "SchemaVersion": "1.0",
        "Actions": [
              smaAction
        ],
        "TransactionAttributes": {
        "currentFlowBlock": nextAction,
         }
    }
     }    
}

async function processFlowActionTransferParticipantToThirdParty(smaEvent:any, action:any){
    let smaAction = {
        Type: "CallAndBridge",
        Parameters: {
            "CallTimeoutSeconds":action.Parameters.ThirdPartyConnectionTimeLimitSeconds,
            "CallerIdNumber":action.Parameters.ThirdPartyPhoneNumber,
            "Endpoints":[
                {
                    "BridgeEndpointType":"PSTN",
                    "Uri":action.Parameters.ThirdPartyPhoneNumber 
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
    }
}

async function processFlowActionConnectParticipantWithLexBot(smaEvent:any, action:any){
    let smaAction={
        Type: "StartBotConversation",
        Parameters: {
          BotAliasArn:action.Parameters.LexV2Bot.AliasArn,
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
                Content:action.Parameters.Text
              },
            ]
          }
        }
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

function getNextActionForError(currentAction:any,contactFlow:any,ErrorType:string){
    let nextAction:any;
    if(currentAction.Transitions.Errors>2 && currentAction.Transitions.Errors[2].ErrorType.includes(ErrorType)){
        nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[2].ErrorType.NextAction);
        console.log("Next Action identifier:"+currentAction.Transitions.Errors[2].NextAction);
        }else if(currentAction.Transitions.Errors>1 && currentAction.Transitions.Errors[1].ErrorType.includes(ErrorType)){
            nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[1].NextAction);
        console.log("Next Action identifier:"+currentAction.Transitions.Errors[1].NextAction);
        }
        else if(currentAction.Transitions.Errors>0 && currentAction.Transitions.Errors[0].ErrorType.includes(ErrorType)){
            nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[0].NextAction);
        console.log("Next Action identifier:"+currentAction.Transitions.Errors[0].NextAction);
        }
        return nextAction;
        
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