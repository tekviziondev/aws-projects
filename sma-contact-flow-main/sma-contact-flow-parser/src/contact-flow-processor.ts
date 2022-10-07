import { loadContactFlow } from "./contact-flow-loader";
import { EventTypes } from "./utility/EventTypes";
import { ErrorTypes } from "./utility/ErrorTypes";
import { Operators } from "./utility/ComparisonOperators";
import { ChimeActions } from "./utility/ChimeActionTypes";
import { AmazonConnectActions } from "./utility/AmazonConnectActionTypes";
import { ConstData } from "./utility/ConstantValues";

const connectContextStore: string = "ConnectContextStore";
let loop = new Map<string, string>();
let ContactFlowARNMap=new Map<string, string>();
const SpeechAttributeMap:Map<string, string>=new Map<string, string>();
const contextAttributs:Map<any, any>=new Map<any, any>();
let tmpMap:Map<any, any>=new Map<any, any>();
const defaultLogger="SMA-Contact-Flow-Parser | Call ID - "
/**
  * This function get connect flow data from contact flow loader 
  * and send the connect flow data to respective functions.
  * @param smaEvent 
  * @param amazonConnectInstanceID
  * @param amazonConnectFlowID
  * @param bucketName
  * @returns SMA Action
  */
export async function processFlow(smaEvent: any, amazonConnectInstanceID: string, amazonConnectFlowID: string,bucketName:string) {    
        let callId:string;
        const legA = getLegACallDetails(smaEvent);
         callId=legA.CallId;
        if(callId=="NaN")
         callId=  smaEvent.ActionData.Parameters.CallId;
    if(ContactFlowARNMap.has(callId)){
        amazonConnectFlowID =(ContactFlowARNMap.get(callId)) 
    }
    const contactFlow = await loadContactFlow(amazonConnectInstanceID, amazonConnectFlowID,bucketName,smaEvent);
    console.log(defaultLogger+callId+" ConnectInstanceId:"+amazonConnectInstanceID+" Loaded Contact Flow"+contactFlow);
    console.log(defaultLogger+callId+" ConnectInstanceId:"+amazonConnectInstanceID+" CallDetails:"+smaEvent.CallDetails);
    const transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
    console.log(defaultLogger+callId+" ConnectInstanceId:"+amazonConnectInstanceID+" TransactionAttributes:"+transactionAttributes);
    if (transactionAttributes && transactionAttributes.currentFlowBlock) {
        console.log(defaultLogger+callId+" InvocationEventType:"+smaEvent.InvocationEventType);
        if (smaEvent.InvocationEventType === EventTypes.ACTION_SUCCESSFUL || smaEvent.InvocationEventType ===EventTypes.CALL_ANSWERED) {
            if(smaEvent.ActionData.ReceivedDigits!=null){
                const recieved_digits=smaEvent.ActionData.ReceivedDigits;
                return await processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow,recieved_digits,amazonConnectInstanceID,bucketName);
            }
            return await processFlowActionSuccess(smaEvent, transactionAttributes.currentFlowBlock, contactFlow,amazonConnectInstanceID,bucketName);
        }
        else if(smaEvent.InvocationEventType === EventTypes.ACTION_FAILED || smaEvent.InvocationEventType === EventTypes.INVALID_LAMBDA_RESPONSE ) {
            return await processFlowActionFailed(smaEvent, transactionAttributes.currentFlowBlock, contactFlow,amazonConnectInstanceID,bucketName);
        }else{
            return await processFlowActionDisconnectParticipant(smaEvent, transactionAttributes.currentFlowBlock);
        }
    }
    else {
        if (smaEvent.InvocationEventType === EventTypes.NEW_INBOUND_CALL) 
        storeSystemAttributs(smaEvent,amazonConnectFlowID,amazonConnectFlowID)
        // We're at the root start from there
        return await processRootFlowBlock(smaEvent, contactFlow, transactionAttributes,amazonConnectInstanceID,bucketName);
    }
}


async function storeSystemAttributs(smaEvent: any,amazonConnectFlowID:any,amazonConnectInstanceID:any){
    const legA = getLegACallDetails(smaEvent);
    contextAttributs.set("$.CustomerEndpoint.Address",legA.From)
    contextAttributs.set("$.SystemEndpoint.Address",legA.To)
    contextAttributs.set("$.InitiationMethod",legA.Direction)
    contextAttributs.set("$.ContactId",amazonConnectFlowID)
    contextAttributs.set("$.InstanceARN",amazonConnectInstanceID)
    contextAttributs.set("$.Channel",ConstData.channel)
    contextAttributs.set("$.CustomerEndpoint.Type",ConstData.customerEndpointType)
    contextAttributs.set("$.SystemEndpoint.Type", ConstData.systemEndpointType)
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
async function processRootFlowBlock(smaEvent: any, contactFlow: any, transactionAttributes: any,amazonConnectInstanceID: string,bucketName:string) {
    // OK, time to figure out the root of the flow
    let callId:string;
        const legA = getLegACallDetails(smaEvent);
         callId=legA.CallId;
        if(callId=="NaN")
         callId=  smaEvent.ActionData.Parameters.CallId;
    if (contactFlow.StartAction !== null) {
        const actions: any[] = contactFlow.Actions;
        console.log(defaultLogger+callId+" ConnectInstanceId:"+amazonConnectInstanceID+" Root Flow Block The actions are"+actions)
        if (actions !== null && actions.length > 0) {
            const currentAction = findActionByID(actions, contactFlow.StartAction);
            console.log(defaultLogger+callId+" ConnectInstanceId:"+amazonConnectInstanceID+" Root Flow Block The current Action is "+currentAction.Type)
            if (currentAction !== null) {
                return await processFlowAction(smaEvent, currentAction,actions,amazonConnectInstanceID,bucketName);
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
async function processFlowAction(smaEvent: any, action: any,actions:any,amazonConnectInstanceID: string,bucketName:string) {
    switch (action.Type) {
        case AmazonConnectActions.GetParticipantInput:
            return await processFlowActionGetParticipantInput(smaEvent, action);
        case AmazonConnectActions.MessageParticipant:
            return await processFlowActionMessageParticipant(smaEvent, action);
        case AmazonConnectActions.DisconnectParticipant:
             return await processFlowActionDisconnectParticipant(smaEvent, action);
        case AmazonConnectActions.Wait:
            return await processFlowActionWait(smaEvent, action,actions,amazonConnectInstanceID,bucketName);
        case AmazonConnectActions.UpdateContactRecordingBehavior:
            return await processFlowActionUpdateContactRecordingBehavior(smaEvent, action)
        case AmazonConnectActions.Loop:
            return await processFlowActionLoop(smaEvent, action,actions,amazonConnectInstanceID,bucketName)
        case AmazonConnectActions.TransferParticipantToThirdParty:
            return await processFlowActionTransferParticipantToThirdParty(smaEvent, action)
        case AmazonConnectActions.ConnectParticipantWithLexBot:
            return await processFlowActionConnectParticipantWithLexBot(smaEvent, action)
        case AmazonConnectActions.TransferToFlow:
            return await processFlowActionTransferToFlow(smaEvent, action,amazonConnectInstanceID,bucketName)
        case AmazonConnectActions.UpdateContactTextToSpeechVoice:
            return await processFlowActionUpdateContactTextToSpeechVoice(smaEvent, action,actions,amazonConnectInstanceID,bucketName)
        case AmazonConnectActions.InvokeLambdaFunction:
            return await processFlowActionInvokeLambdaFunction(smaEvent, action,actions,amazonConnectInstanceID,bucketName)
        case AmazonConnectActions.UpdateContactAttributes:
            return await processFlowActionUpdateContactAttributes(smaEvent, action,actions,amazonConnectInstanceID,bucketName)
        case AmazonConnectActions.Compare:
            return await processFlowActionCompareContactAttributes(smaEvent, action,actions,amazonConnectInstanceID,bucketName)
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
async function processFlowActionGetParticipantInput(smaEvent: any, action: any) {
    let callId:string;
        const legA = getLegACallDetails(smaEvent);
         callId=legA.CallId;
        if(callId=="NaN")
         callId=  smaEvent.ActionData.Parameters.CallId;
    if(action.Parameters.Media!=null){
        console.log(defaultLogger+callId+" Play Audio And Get Digits");
        return await processPlayAudioAndGetDigits(smaEvent, action);
   }
    console.log(defaultLogger+callId+" Speak and Get Digits Action");
    let smaAction = {
        Type: ChimeActions.SpeakAndGetDigits,
        Parameters: {
            "CallId": legA.CallId,
            "SpeechParameters": getSpeechParameters(smaEvent,action),
            "FailureSpeechParameters": getSpeechParameters(smaEvent,action),
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

/**
  * Making play audio json object for sma action.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */
async function processPlayAudio(smaEvent: any, action: any) {
    let callId:string;
    const legA = getLegACallDetails(smaEvent);
     callId=legA.CallId;
    if(callId=="NaN")
    callId=  smaEvent.ActionData.Parameters.CallId;
    console.log(defaultLogger+callId+"Play Audio Action");
    let smaAction = {
        Type:ChimeActions.PlayAudio,
        Parameters: {
            "CallId":callId,
            "AudioSource": getAudioParameters(smaEvent,action)
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

/**
  * Making play audio and get digits json object for sma action.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */

async function processPlayAudioAndGetDigits(smaEvent: any, action: any) {
    let callId:string;
    const legA = getLegACallDetails(smaEvent);
     callId=legA.CallId;
    if(callId=="NaN")
    callId=  smaEvent.ActionData.Parameters.CallId;
    console.log(defaultLogger+callId+" Action| Play Audio Action and Get Digits");
    let smaAction = {
        Type: ChimeActions.PlayAudioAndGetDigits,
        Parameters: {
            "CallId":callId,
            "AudioSource": getAudioParameters(smaEvent,action),
            "FailureAudioSource": getAudioParameters(smaEvent,action),
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
/**
  * After received success event from SMA,process the next action.
  * @param smaEvent 
  * @param action
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns Process Flow Action
  */

async function processFlowActionSuccess(smaEvent: any, action: any, contactFlow: any,amazonConnectInstanceID: string,bucketName:string) {
    let transactionAttributes = smaEvent.CallDetails.TransactionAttributes;

    if (action.Parameters && action.Parameters.StoreInput == "True") {
        smaEvent.CallDetails.TransactionAttributes = updateConnectContextStore(transactionAttributes, "StoredCustomerInput", smaEvent.ActionData.ReceivedDigits);
    }
    if(smaEvent.ActionData.IntentResult!=null){
       let intentName= smaEvent.ActionData.IntentResult.SessionState.Intent.Name;
       return await processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow,intentName,amazonConnectInstanceID,bucketName);
    }
    const nextAction = findActionByID(contactFlow.Actions, action.Transitions.NextAction);
    return await processFlowAction(smaEvent, nextAction,contactFlow.Actions,amazonConnectInstanceID,bucketName);
}

function updateConnectContextStore(transactionAttributes: any, key: string, value: any) {
    if (transactionAttributes[connectContextStore]) transactionAttributes[connectContextStore][key] = value;
    else {
        transactionAttributes[connectContextStore] = { };
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
async function processFlowActionDisconnectParticipant(smaEvent:any, action:any){
    let callId:string;
        const legA = getLegACallDetails(smaEvent);
         callId=legA.CallId;
        if(callId=="NaN")
        callId=  smaEvent.ActionData.Parameters.CallId;
    ContactFlowARNMap.delete(callId);
    contextAttributs.clear();
    console.log(defaultLogger+callId+" is going to Hang up");
    let smaAction = {
        Type: ChimeActions.Hangup,
        Parameters: { 
            "SipResponseCode": "0",
            "CallId":callId
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

/**
  * Making a SMA action to perform Wait for a specified period of time.
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
async function processFlowActionWait(smaEvent:any, action:any,actions:any,amazonConnectInstanceID: string,bucketName:string){
    let callId:string;
    const legA = getLegACallDetails(smaEvent);
     callId=legA.CallId;
    if(callId=="NaN")
     callId=  smaEvent.ActionData.Parameters.CallId;
    console.log(defaultLogger+callId+" Pause Action");
    let smaAction = {
        Type: ChimeActions.Pause,
        Parameters: {
            "DurationInMilliseconds": getWaitTimeParameter(action)
        }
    };
    const nextAction = findActionByID(actions, action.Transitions.Conditions[0].NextAction);
    console.log(defaultLogger+callId+"Next Action identifier:"+action.Transitions.Conditions[0].NextAction);
    let smaAction1 =await (await processFlowAction(smaEvent, nextAction,actions,amazonConnectInstanceID,bucketName)).Actions[0];
    console.log(defaultLogger+callId+"Next Action Data:"+smaAction1);
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
/**
  * Making a SMA action to perform Delivers an audio or chat message.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */
async function processFlowActionMessageParticipant(smaEvent: any, action: any) {
    let callId:string;
    const legA = getLegACallDetails(smaEvent);
     callId=legA.CallId;
    if(callId=="NaN")
     callId=  smaEvent.ActionData.Parameters.CallId;
    if(action.Parameters.Media!=null){
        console.log(defaultLogger+callId+"Play Audio Action");
        return await processPlayAudio(smaEvent, action);
   }
    let text:string;
    let type:string;
    let voiceId=ConstData.voiceId
    let engine=ConstData.engine
    let languageCode=ConstData.languageCode
    if(SpeechAttributeMap.has("TextToSpeechVoice")){
        voiceId=SpeechAttributeMap.get("TextToSpeechVoice")
    }
    if(SpeechAttributeMap.has("TextToSpeechEngine")){
        engine=SpeechAttributeMap.get("TextToSpeechEngine").toLowerCase();
    }
	if(SpeechAttributeMap.has("LanguageCode")){
        languageCode=SpeechAttributeMap.get("LanguageCode")
    }
    if (action.Parameters.Text !== null && action.Parameters.Text !== "" && action.Parameters.Text && action.Parameters.Text!== "undefined") {
        text = action.Parameters.Text;
        if(text.includes("$.External.") || text.includes("$.Attributes.")){
            //text=textConvertor(text);
            contextAttributs.forEach((value, key) => {
                if(text.includes(key))
                  text=text.replace(key,value)
              })
        }
        type = ConstData.text;
    }
   else if (action.Parameters.SSML !== null && action.Parameters.SSML && action.Parameters.SSML!== "undefined") {
        text = action.Parameters.SSML;
        type = ConstData.ssml;
    }
    let smaAction = {
        Type: ChimeActions.Speak,
        Parameters: {
                 Engine: engine,
                CallId: legA.CallId,
                Text: text,
                TextType: type,
                LanguageCode:languageCode,
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
    }
}


function getSpeechParameters(smaEvent:any,action: any) {
    let callId:string;
    const legA = getLegACallDetails(smaEvent);
     callId=legA.CallId;
    if(callId=="NaN")
     callId=  smaEvent.ActionData.Parameters.CallId;
    let rv = null;
    let voiceId=ConstData.voiceId
        let engine=ConstData.engine
        let languageCode=ConstData.languageCode
        if(SpeechAttributeMap.has("TextToSpeechVoice")){
            voiceId=SpeechAttributeMap.get("TextToSpeechVoice")
        }
        if(SpeechAttributeMap.has("TextToSpeechEngine")){
            engine=SpeechAttributeMap.get("TextToSpeechEngine").toLowerCase();
        }
        if(SpeechAttributeMap.has("LanguageCode")){
            languageCode=SpeechAttributeMap.get("LanguageCode")
        }
    if (action.Text !== null || action.SSML !== null) {
        let text: string;
        let type: string;
        if (action.Parameters.Text !== null && action.Parameters.Text !== "" && action.Parameters.Text && action.Parameters.Text!== "undefined") {
            text = action.Parameters.Text;
            if(text.includes("$.External.") || text.includes("$.Attributes.")){
                contextAttributs.forEach((value, key) => {
                    if(text.includes(key))
                      text=text.replace(key,value)
                  })
            }
            type = ConstData.text;
        }
       else if (action.Parameters.SSML !== null && action.Parameters.SSML && action.Parameters.SSML!== "undefined") {
            text = action.Parameters.SSML;
            type = ConstData.ssml;
        }
        rv = {
            Text: text,
            TextType: type,
            Engine: engine,     
            LanguageCode:languageCode, 
            VoiceId:voiceId, 
        }
    }
    console.log(defaultLogger+callId+"Speech Parameters are : "+rv);
    return rv;
}

function getAudioParameters(smaEvent:any,action: any) {
    let callId:string;
    const legA = getLegACallDetails(smaEvent);
     callId=legA.CallId;
    if(callId=="NaN")
     callId=  smaEvent.ActionData.Parameters.CallId;
    let rv = null;
        let bucketName: string;
        let type: string;
        let uri:string;
        let  uriObj:string[];
        let key:string;
        if (action.Parameters.SourceType !== null) {
            console.log(defaultLogger+callId+" Audio Parameters SourceType Exists");
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
    
    console.log(defaultLogger+callId+" Audio Parameters : "+rv);
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

/**
  * Making a SMA action to perform Call Recording.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */
async function processFlowActionUpdateContactRecordingBehavior(smaEvent:any, action:any){
    const legA = getLegACallDetails(smaEvent);
    if(action.Parameters.RecordingBehavior.RecordedParticipants.length<1){
        let smaAction={
            Type: ChimeActions.StopCallRecording,
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
        Type: ChimeActions.StartCallRecording,
        Parameters:{
            "CallId": legA.CallId,
            "Track":ConstData.Track,
        Destination:{
         "Type": ConstData.destinationType,                                       
         "Location":ConstData.destinationLocation
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
async function processFlowActionFailed(smaEvent:any, actionObj:any,contactFlow:any,amazonConnectInstanceID: string,bucketName:string){
    let callId:string;
    const legA = getLegACallDetails(smaEvent);
     callId=legA.CallId;
    if(callId=="NaN")
     callId=  smaEvent.ActionData.Parameters.CallId;
    let currentAction=contactFlow.Actions.find((action: any) => action.Identifier===actionObj.Identifier);
    let smaAction:any;
    let nextAction:any;
    if(smaEvent!=null && smaEvent.ActionData.ErrorType.includes(ErrorTypes.InputTimeLimitExceeded)){
        nextAction=await getNextActionForError(currentAction,contactFlow.Actions,ErrorTypes.InputTimeLimitExceeded,smaEvent);
     smaAction =await (await processFlowAction(smaEvent, nextAction,contactFlow.Actions,amazonConnectInstanceID,bucketName)).Actions[0];
    }else if(smaEvent!=null && smaEvent.ActionData.ErrorType.includes(ErrorTypes.NoMatchingCondition)){
        nextAction=await getNextActionForError(currentAction,contactFlow,ErrorTypes.NoMatchingCondition,smaEvent);
        smaAction =await (await processFlowAction(smaEvent, nextAction,contactFlow.Actions,amazonConnectInstanceID,bucketName)).Actions[0];
    }
    else if(smaEvent!=null && smaEvent.ActionData.ErrorType.includes(ErrorTypes.ConnectionTimeLimitExceeded)){
        nextAction=await getNextActionForError(currentAction,contactFlow,ErrorTypes.ConnectionTimeLimitExceeded,smaEvent);
        smaAction =await (await processFlowAction(smaEvent, nextAction,contactFlow.Actions,amazonConnectInstanceID,bucketName)).Actions[0];
    }
    else if(smaEvent!=null && smaEvent.ActionData.ErrorType.includes(ErrorTypes.CallFailed)){
        nextAction=await getNextActionForError(currentAction,contactFlow,ErrorTypes.CallFailed,smaEvent);
        smaAction =await (await processFlowAction(smaEvent, nextAction,contactFlow.Actions,amazonConnectInstanceID,bucketName)).Actions[0];       
    
} else if(smaEvent!=null && smaEvent.ActionData.ErrorType.includes(ErrorTypes.InvalidPhoneNumber)){
    nextAction=await getNextActionForError(currentAction,contactFlow,ErrorTypes.InvalidPhoneNumber,smaEvent);
    smaAction =await (await processFlowAction(smaEvent, nextAction,contactFlow.Actions,amazonConnectInstanceID,bucketName)).Actions[0];       

}
else{
    let count:number;
    for(let i=0;i<currentAction.Transitions.Errors.length;i++){
        if(currentAction.Transitions.Errors[i].ErrorType==ErrorTypes.NoMatchingError){
            count=i;
            break;
        }
    }
     nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[count].NextAction);
     console.log(defaultLogger+callId+"Next Action identifier:"+currentAction.Transitions.Errors[count].NextAction);
     smaAction =await (await processFlowAction(smaEvent, nextAction,contactFlow.Actions,amazonConnectInstanceID,bucketName)).Actions[0];
    
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
async function processFlowConditionValidation(smaEvent:any, actionObj:any, contactFlow:any, recieved_digits:any, amazonConnectInstanceID: string, bucketName:string){
    let currentAction=contactFlow.Actions.find((action: any) => action.Identifier===actionObj.Identifier);
    let smaAction:any;
    let nextAction:any;
    let nextAction_id:any;
    const condition=currentAction.Transitions.Conditions;
    let callId:string;
    const legA = getLegACallDetails(smaEvent);
     callId=legA.CallId;
    if(callId=="NaN")
     callId=  smaEvent.ActionData.Parameters.CallId;
    if(smaEvent!=null  && condition.length>0){
        for (let index = 0; index < condition.length; index++) {
            console.log(defaultLogger+callId+" Recieved Digits "+recieved_digits);
            console.log(defaultLogger+callId+" Condition Operands "+condition[index].Condition.Operands[0]);
            if(condition[index].Condition.Operands[0]===recieved_digits){
                 nextAction_id=condition[index].NextAction;
                console.log(defaultLogger+callId+" The condition passsed with recieved digit "+recieved_digits);
                console.log(defaultLogger+callId+" Next Action identifier"+nextAction_id)
                nextAction = findActionByID(contactFlow.Actions,nextAction_id)
                break;
                }
            }
          
        if(nextAction_id===null && nextAction_id==="undefined" && !nextAction_id && actionObj.Parameters && actionObj.Parameters.StoreInput == "false") {
            nextAction=await getNextActionForError(currentAction,contactFlow.Actions,ErrorTypes.NoMatchingCondition,smaEvent);
            console.log(defaultLogger+callId+" Conditions are not matching with Recieved Digits ");
           
        }else if((nextAction_id===null && nextAction_id==="undefined" && !nextAction_id && actionObj.Parameters && actionObj.Parameters.StoreInput == "true")){
            nextAction=await getNextActionForError(currentAction,contactFlow.Actions,ErrorTypes.NoMatchingError,smaEvent);
            console.log(defaultLogger+callId+" Conditions are not matching with Recieved Digits ");
        }
        console.log(defaultLogger+callId+" Next Action identifier:"+nextAction_id);
        smaAction =await (await processFlowAction(smaEvent, nextAction,contactFlow.Actions,amazonConnectInstanceID,bucketName)).Actions[0];
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

/**
  * Making a SMA action to perform Repeats the looping branch for the specified number of times. After which, the complete branch is followed.
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
async function processFlowActionLoop(smaEvent:any, action:any,actions:any, amazonConnectInstanceID: string, bucketName:string){
    let smaAction:any;
    let callId:string;
        const legA = getLegACallDetails(smaEvent);
         callId=legA.CallId;
        if(callId=="NaN")
        callId=  smaEvent.ActionData.Parameters.CallId;
    if(!loop.has(callId) || loop.get(callId)!=action.Parameters.LoopCount){
    const nextAction = findActionByID(actions, action.Transitions.Conditions[1].NextAction);
    console.log(defaultLogger+callId+" Next Action identifier:"+action.Transitions.Conditions[1].NextAction);
    smaAction= await (await processFlowAction(smaEvent, nextAction,actions,amazonConnectInstanceID,bucketName)).Actions[0];
   let count = String(Number.parseInt(loop.get(callId))+1)
   if(!loop.has(callId))
    loop.set(callId,"1");
    else
    loop.set(callId,count);
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
        loop.delete(callId);
        let nextAction = findActionByID(actions, action.Transitions.Conditions[0].NextAction);
    console.log(defaultLogger+callId+" Next Action identifier:"+action.Transitions.Conditions[0].NextAction);
    smaAction= await (await processFlowAction(smaEvent, nextAction,actions,amazonConnectInstanceID,bucketName)).Actions[0];
    console.log(defaultLogger+callId+" Next Action Data:"+smaAction);
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

/**
  * Making a SMA action to perform Transfer a call to a phone number for voice interactions.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */
async function processFlowActionTransferParticipantToThirdParty(smaEvent:any, action:any){
    const legA = getLegACallDetails(smaEvent);
    let callId:string;
     callId=legA.CallId;
    if(callId=="NaN")
     callId=  smaEvent.ActionData.Parameters.CallId;
    let fromNumber=legA.From;
    if(action.Parameters.hasOwnProperty("CallerId")){
        fromNumber=action.Parameters.CallerId.Number;
       }
    console.log(defaultLogger+callId+" Transfering call to Third Party Number");
    let smaAction = {
        Type: ChimeActions.CallAndBridge,
        Parameters: {
            "CallTimeoutSeconds":action.Parameters.ThirdPartyConnectionTimeLimitSeconds,
            "CallerIdNumber":fromNumber,
            "Endpoints":[
                {
                    "BridgeEndpointType":ConstData.BridgeEndpointType,
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

/**
  * Making a SMA action to perform delvier a Chat message and obtain customer input.
  * @param smaEvent 
  * @param action
  * @returns SMA Action
  */
async function processFlowActionConnectParticipantWithLexBot(smaEvent:any, action:any){
    let smaAction;
    const legA = getLegACallDetails(smaEvent);
    let callId:string;
     callId=legA.CallId;
    if(callId=="NaN")
     callId=  smaEvent.ActionData.Parameters.CallId;
    console.log(defaultLogger+callId+" Start Bot Conversation");
    if(action.Parameters.hasOwnProperty("LexSessionAttributes")){
        smaAction={
            Type: ChimeActions.StartBotConversation,
            Parameters: {
              BotAliasArn:action.Parameters.LexV2Bot.AliasArn,
              LocaleId: ConstData.languageCode,
              Configuration: {
                SessionState: {
                  SessionAttributes:action.Parameters.LexSessionAttributes,
                  DialogAction: {
                    Type: ConstData.dialogType
                  }
                },
                WelcomeMessages: [
                  {
                    ContentType: ConstData.ContentType,
                    Content:action.Parameters.Text
                  },
                ]
              }
            }
          }
    }
    else{
        smaAction={
            Type: ChimeActions.StartBotConversation,
            Parameters: {
              BotAliasArn:action.Parameters.LexV2Bot.AliasArn,
              LocaleId: ConstData.languageCode,
              Configuration: {
                SessionState: { 
                  DialogAction: {
                    Type: ConstData.dialogType
                  }
                },
                WelcomeMessages: [
                  {
                    ContentType: ConstData.ContentType,
                    Content:action.Parameters.Text
                  },
                ]
              }
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

/**
  * Making a SMA action to Ends the current flow and transfers the customer to a flow of type contact flow.
  * @param smaEvent 
  * @param action
  * @param actions
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
async function processFlowActionTransferToFlow(smaEvent:any, action:any, amazonConnectInstanceID: string,bucketName:string){
    let TransferFlowARN=action.Parameters.ContactFlowId;
    let callId:string;
        const legA = getLegACallDetails(smaEvent);
         callId=legA.CallId;
        if(callId=="NaN")
         callId=  smaEvent.ActionData.Parameters.CallId;
    ContactFlowARNMap.set(callId,TransferFlowARN)
    const contactFlow = await loadContactFlow(amazonConnectInstanceID, TransferFlowARN,bucketName,smaEvent);
    console.log(defaultLogger+callId+" Transfering to Another contact FLow function")
     return await processRootFlowBlock(smaEvent,contactFlow,smaEvent.CallDetails.TransactionAttributes, amazonConnectInstanceID,bucketName);

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
async function processFlowActionInvokeLambdaFunction(smaEvent: any, action: any,actions:any, amazonConnectInstanceID: string, bucketName:string){
    let smaAction:any;
    const legA = getLegACallDetails(smaEvent);
    let callId:string;
     callId=legA.CallId;
    if(callId=="NaN")
     callId=  smaEvent.ActionData.Parameters.CallId;
    const AWS=require("aws-sdk")
    const lambda= new AWS.Lambda({region:ConstData.region})
    let LambdaARN=action.Parameters.LambdaFunctionARN
   
   let inputForInvoking = await inputForInvokingLambda(action);
    const params={FunctionName:LambdaARN,
                 InvocationType:'RequestResponse',
                 Payload:JSON.stringify(inputForInvoking)
    };
    let result=await lambda.invoke(params).promise()
    if(result===null && result==="undefined" && !result){
        let nextAction=await getNextActionForError(action,actions,ErrorTypes.NoMatchingError,smaEvent);
        return await processFlowAction(smaEvent, nextAction,actions,amazonConnectInstanceID,bucketName);
    }
    let x=JSON.parse(result.Payload)
    console.log(defaultLogger+callId+" The Result After Invoking Lambda is"+JSON.stringify(x))
    const keys = Object.keys(x);
        keys.forEach((key, index) => {
            contextAttributs.set("$.External."+key,x[key]);
            tmpMap.set(key,x[key]);
            
           
        });
    
    let nextAction = findActionByID(actions, action.Transitions.NextAction);
    console.log(defaultLogger+callId+" Next Action identifier:"+action.Transitions.NextAction);
    return await processFlowAction(smaEvent, nextAction,actions,amazonConnectInstanceID,bucketName);
    }


    async function inputForInvokingLambda(action: any){
        let InvocationAttributes: any[][] = Object.entries(action.Parameters.LambdaInvocationAttributes);
        for (let i = 0; i< InvocationAttributes.length; i++) {
            if(InvocationAttributes[i][1].includes("$.External.") || InvocationAttributes[i][1].includes("$.Attributes.")){
                contextAttributs.forEach((value, key) => {
                    if(InvocationAttributes[i][1]==key)
                    InvocationAttributes[i][1]=InvocationAttributes[i][1].replace(key,value)
                  }) 
            } 
        }
       let lambdaFunctionParameters = Object.fromEntries(InvocationAttributes.map(([k,v]) => [k, v]));
        let inputForInvoking={
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
            "Parameters":lambdaFunctionParameters
            },
            "Name": "ContactFlowEvent"
            }
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
async function processFlowActionUpdateContactAttributes(smaEvent: any, action: any,actions:any, amazonConnectInstanceID: string, bucketName:string){
    const legA = getLegACallDetails(smaEvent);
    let callId:string;
     callId=legA.CallId;
    if(callId=="NaN")
     callId=  smaEvent.ActionData.Parameters.CallId;
        let ContactAttributes: any[][] = Object.entries(action.Parameters.Attributes);
        try {
        for (let i = 0; i < ContactAttributes.length ;i++) {
            let x:string=ContactAttributes[i][1]
            if(x.includes("$.External.")){
                let tmp:any[]=x.split("$.External.")
                if(tmpMap.has(tmp[1])){
                    contextAttributs.set("$.Attributes."+ContactAttributes[i][0],tmpMap.get(tmp[1]))
                }
            }
            else if(x.includes("$.Attributes.")){
                let tmp:any[]=x.split("$.Attributes.")
                if(tmpMap.has(tmp[1])){
                    contextAttributs.set("$.Attributes."+ContactAttributes[i][0],tmpMap.get(tmp[1]))
                }
            }
            else{
                contextAttributs.set("$.Attributes."+ContactAttributes[i][0],ContactAttributes[i][1])
            }
        }
    }catch(e){
        let nextAction=await getNextActionForError(action,actions,ErrorTypes.NoMatchingError,smaEvent);
        return await processFlowAction(smaEvent, nextAction,actions,amazonConnectInstanceID,bucketName);
    }
        tmpMap.clear();
        let nextAction = findActionByID(actions, action.Transitions.NextAction);
        console.log(defaultLogger+callId+" Next Action identifier:"+action.Transitions.NextAction);
        return await processFlowAction(smaEvent, nextAction,actions,amazonConnectInstanceID,bucketName);
    }

async function processFlowActionCompareContactAttributes(smaEvent: any, action: any,actions:any, amazonConnectInstanceID: string, bucketName:string){
    const legA = getLegACallDetails(smaEvent);
    let callId:string;
     callId=legA.CallId;
    if(callId=="NaN")
     callId=  smaEvent.ActionData.Parameters.CallId;
        let comparVariable=action.Parameters.ComparisonValue;
        let nextAction:any;
        try {
      let ComparisonValue=contextAttributs.get(comparVariable);
      const condition=action.Transitions.Conditions;
      for (let index = 0; index < condition.length; index++) {
        console.log(defaultLogger+callId+"Recieved Value "+ComparisonValue);
        console.log(defaultLogger+callId+"Expected Value "+condition[index].Condition.Operands[0]);
        switch(condition[index].Condition.Operator){
            case Operators.Equals:
                if(condition[index].Condition.Operands[0]===ComparisonValue){
                    let nextAction_id=condition[index].NextAction;
                    console.log(defaultLogger+callId+" Next Action identifier"+nextAction_id)
                    nextAction = findActionByID(actions,nextAction_id)
                }
            break;

            case Operators.NumberLessThan:
                if(ComparisonValue<condition[index].Condition.Operands[0]){
                    let nextAction_id=condition[index].NextAction;
                    console.log(defaultLogger+callId+" Next Action identifier"+nextAction_id)
                    nextAction = findActionByID(actions,nextAction_id)
                }
                break;
            case Operators.NumberLessOrEqualTo:
                if(ComparisonValue<=condition[index].Condition.Operands[0]){
                    let nextAction_id=condition[index].NextAction;
                    console.log(defaultLogger+callId+" Next Action identifier"+nextAction_id)
                    nextAction = findActionByID(actions,nextAction_id)
                }
                break;
            case Operators.NumberGreaterThan:
                if(ComparisonValue>condition[index].Condition.Operands[0]){
                    let nextAction_id=condition[index].NextAction;
                    console.log(defaultLogger+callId+" Next Action identifier"+nextAction_id)
                    nextAction = findActionByID(actions,nextAction_id)
                }
                break;
            case Operators.NumberLessOrEqualTo:
                if(ComparisonValue>=condition[index].Condition.Operands[0]){
                    let nextAction_id=condition[index].NextAction;
                    console.log(defaultLogger+callId+" Next Action identifier"+nextAction_id)
                    nextAction = findActionByID(actions,nextAction_id)
                }
                break;
            case Operators.TextStartsWith:
                if(ComparisonValue.startsWith(condition[index].Condition.Operands[0])){
                    let nextAction_id=condition[index].NextAction;
                    console.log(defaultLogger+callId+" Next Action identifier"+nextAction_id)
                    nextAction = findActionByID(actions,nextAction_id)
                }
                break;
            case Operators.TextEndsWith:
                if(ComparisonValue.endsWith(condition[index].Condition.Operands[0])){
                    let nextAction_id=condition[index].NextAction;
                    console.log(defaultLogger+callId+" Next Action identifier"+nextAction_id)
                    nextAction = findActionByID(actions,nextAction_id)
                }
                break;
            case Operators.TextContains:
                if(ComparisonValue.includes(condition[index].Condition.Operands[0])){
                    let nextAction_id=condition[index].NextAction;
                    console.log(defaultLogger+callId+" Next Action identifier"+nextAction_id)
                    nextAction = findActionByID(actions,nextAction_id)
                }
                break;
        }
        }
        if(nextAction===null || !nextAction || nextAction==="undefined"){
            console.log(defaultLogger+callId+" Next Action is inValid");
            let nextAction=await getNextActionForError(action,actions,ErrorTypes.NoMatchingCondition,smaEvent);
            return await processFlowAction(smaEvent, nextAction,actions,amazonConnectInstanceID,bucketName);
        }
    }catch(e){
        let nextAction=await getNextActionForError(action,actions,ErrorTypes.NoMatchingCondition,smaEvent);
        return await processFlowAction(smaEvent, nextAction,actions,amazonConnectInstanceID,bucketName);
    }
      
        return await processFlowAction(smaEvent, nextAction,actions,amazonConnectInstanceID,bucketName);
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
function getNextActionForError(currentAction:any,contactFlow:any,ErrorType:any,smaEvent:any){
    const legA = getLegACallDetails(smaEvent);
    let callId:string;
     callId=legA.CallId;
    if(callId=="NaN")
     callId=  smaEvent.ActionData.Parameters.CallId;
    let nextAction:any;
    console.log(defaultLogger+callId+" Error Action Count:"+currentAction.Transitions.Errors);
    console.log(defaultLogger+callId+" Next Action Validation:"+currentAction.Transitions.Errors.length);
    if(currentAction.Transitions.Errors.length>2 && currentAction.Transitions.Errors[2].ErrorType.includes(ErrorType)){
        nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[2].NextAction);
        console.log(defaultLogger+callId+" Next Action identifier:"+currentAction.Transitions.Errors[2].NextAction);
        }else if(currentAction.Transitions.Errors.length>1 && currentAction.Transitions.Errors[1].ErrorType.includes(ErrorType)){
            nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[1].NextAction);
        console.log(defaultLogger+callId+" Next Action identifier:"+currentAction.Transitions.Errors[1].NextAction);
        }
        else if(currentAction.Transitions.Errors.length>0 && currentAction.Transitions.Errors[0].ErrorType.includes(ErrorType)){
            nextAction = findActionByID(contactFlow.Actions, currentAction.Transitions.Errors[0].NextAction);
        console.log(defaultLogger+callId+" Next Action identifier:"+currentAction.Transitions.Errors[0].NextAction);
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
 async function processFlowActionUpdateContactTextToSpeechVoice(smaEvent:any, action:any,actions:any, amazonConnectInstanceID: string, bucketName:string){
    let callId:string;
    const legA = getLegACallDetails(smaEvent);
     callId=legA.CallId;
    if(callId=="NaN")
     callId=  smaEvent.ActionData.Parameters.CallId;
    let SpeechParameters=action.Parameters
    let smaAction:any;
    const keys = Object.keys(SpeechParameters);
        keys.forEach((key, index) => {
            SpeechAttributeMap.set(key,SpeechParameters[key]);
        });
    let nextAction = findActionByID(actions, action.Transitions.NextAction);
    console.log(defaultLogger+callId+" Next Action identifier:"+action.Transitions.NextAction);
    if(nextAction.Type=="UpdateContactData"){
        console.log(defaultLogger+callId+" Next Action Type:"+nextAction.Type);
        let SpeechParameter=nextAction.Parameters
        const keys = Object.keys(SpeechParameter);
        keys.forEach((key, index) => {
            SpeechAttributeMap.set(key,SpeechParameter[key]);
        });
        nextAction = findActionByID(actions, nextAction.Transitions.NextAction);
        console.log(defaultLogger+callId+" Next Action identifier:"+action.Transitions.NextAction);
    }
    smaAction= await (await processFlowAction(smaEvent, nextAction,actions,amazonConnectInstanceID,bucketName)).Actions[0];
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

