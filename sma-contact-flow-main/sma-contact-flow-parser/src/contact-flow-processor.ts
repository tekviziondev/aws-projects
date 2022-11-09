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
    let contextStore={};
    try {
        let type = "Contact_Flow";
        const transactionAttributes = smaEvent.CallDetails.TransactionAttributes;

        if (transactionAttributes && transactionAttributes[Attributes.CONNECT_CONTEXT_STORE]){ 
            contextStore=transactionAttributes[Attributes.CONNECT_CONTEXT_STORE]
        }

        if (transactionAttributes && transactionAttributes[Attributes.CONNECT_CONTEXT_STORE] && !transactionAttributes[Attributes.CONNECT_CONTEXT_STORE]['ActualFlowARN']) {
            transactionAttributes[Attributes.CONNECT_CONTEXT_STORE]['ActualFlowARN']=amazonConnectFlowID;
         }

        if (transactionAttributes && transactionAttributes[Attributes.CONNECT_CONTEXT_STORE] && transactionAttributes[Attributes.CONNECT_CONTEXT_STORE]['TransferFlowARN']) {
            amazonConnectFlowID = transactionAttributes[Attributes.CONNECT_CONTEXT_STORE]['TransferFlowARN'];
         }
         
         if (transactionAttributes && transactionAttributes[Attributes.CONNECT_CONTEXT_STORE] && transactionAttributes[Attributes.CONNECT_CONTEXT_STORE]['InvokeModuleARN']) {
            type = "Invoke_Module"
            amazonConnectFlowID = transactionAttributes[Attributes.CONNECT_CONTEXT_STORE]['InvokeModuleARN'];
         }
         
         const legA = getLegACallDetails(smaEvent);
         callId = legA.CallId;
         if (!callId)
             callId = smaEvent.ActionData.Parameters.CallId;
 
        const contactFlow = await loadContactFlow(amazonConnectInstanceID, amazonConnectFlowID, bucketName, smaEvent, type);
        console.log(Attributes.DEFAULT_LOGGER + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Loaded Contact Flow" + contactFlow);
        console.log(Attributes.DEFAULT_LOGGER + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " CallDetails:" + smaEvent.CallDetails);
        console.log(Attributes.DEFAULT_LOGGER + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " TransactionAttributes:" + transactionAttributes);
        if (transactionAttributes && transactionAttributes.currentFlowBlock) {
            console.log(Attributes.DEFAULT_LOGGER + callId + " InvocationEventType:" + smaEvent.InvocationEventType);
            if (smaEvent.InvocationEventType === EventTypes.ACTION_SUCCESSFUL || smaEvent.InvocationEventType === EventTypes.CALL_ANSWERED) {
                if (smaEvent.ActionData.ReceivedDigits != null) {
                    const recieved_digits = smaEvent.ActionData.ReceivedDigits;
                    return await processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, recieved_digits, amazonConnectInstanceID, bucketName, contextStore);
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
            if (smaEvent.InvocationEventType === EventTypes.NEW_INBOUND_CALL){
               let  contextAttributes=storeSystemAttributs(smaEvent, amazonConnectFlowID, amazonConnectFlowID)
                 contextStore={
                    "LoopCount":"0",
                    "TransferFlowARN":"",
                    "InvokeModuleARN":"",
                    "InvokationModuleNextAction":"",
                    "ActualFlowARN":"",
                    "SpeechAttributes":{},
                    "ContextAttributes":contextAttributes,
                    "TmpMap":{},  
                    "PauseAction":null

                }
            }
            // We're at the root start from there
            return await processRootFlowBlock(smaEvent, contactFlow,  amazonConnectInstanceID, bucketName, contextStore);
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
    const legA = getLegACallDetails(smaEvent);
   let contextAttributes={
        "$.CustomerEndpoint.Address":legA.From,
        "$.SystemEndpoint.Address":legA.To,
        "$.InitiationMethod":legA.Direction,
        "$.ContactId":amazonConnectFlowID,
        "$.InstanceARN":amazonConnectInstanceID,
        "$.Channel":Attributes.CHANNEL,
        "$.CustomerEndpoint.Type":Attributes.CUSTOMER_ENDPOINT_TYPE,
        "$.SystemEndpoint.Type":Attributes.SYSTEM_ENDPOINT_TYPE
    }
    return contextAttributes;
}

/**
  * This function is starting of the flow exection.
  * Get current action from the flow block and send to process flow action
  * @param smaEvent 
  * @param contactFlow
  * @param TransactionAttributes
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns SMA Action
  */
export async function processRootFlowBlock(smaEvent: any, contactFlow: any,  amazonConnectInstanceID: string, bucketName: string,contextStore:any) {
    // OK, time to figure out the root of the flow
    let callId: string;
    try {
        const legA = getLegACallDetails(smaEvent);
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        if (contactFlow.StartAction) {
            const actions: any[] = contactFlow.Actions;
            console.log(Attributes.DEFAULT_LOGGER + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Root Flow Block The actions are" + actions)
            if (actions && actions.length > 0) {
                const currentAction = findActionByID(actions, contactFlow.StartAction);
                let actionType = currentAction.Type;
                if (!Object.values(AmazonConnectActions).includes(actionType)) {
                    return await terminatingFlowAction(smaEvent, actionType)
                }
                console.log(Attributes.DEFAULT_LOGGER + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Root Flow Block The current Action is " + currentAction.Type)
                if (currentAction) {
                    return await processFlowAction(smaEvent, currentAction, actions, amazonConnectInstanceID, bucketName,contextStore);
                }
            }
        }
    } catch (error) {
        console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in getting the Root Flow Block" + error.message);
        return await terminatingFlowAction(smaEvent, "error")
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
export async function processFlowAction(smaEvent: any, action: any, actions: any, amazonConnectInstanceID: string, bucketName: string,contextStore:any) {
    console.log("ProcessFlowAction:" + action);
    switch (action.Type) {
        case AmazonConnectActions.GET_PARTICIPANT_INPUT:
            let getParticipantInput = new GetParticipantInput();
            return await getParticipantInput.processFlowActionGetParticipantInput(smaEvent, action, contextStore);
        case AmazonConnectActions.MESSAGE_PARTICIPANT:
            let message_participant = new MessageParticipant();
            return await message_participant.processFlowActionMessageParticipant(smaEvent, action, contextStore);
        case AmazonConnectActions.DISCONNECT_PARTICIPANT:
            let disconnect = new DisconnectParticipant();
            return await disconnect.processFlowActionDisconnectParticipant(smaEvent, contextStore);
        case AmazonConnectActions.WAIT:
            let wait = new Wait();
            return await wait.processFlowActionWait(smaEvent, action, actions, amazonConnectInstanceID, bucketName, contextStore);
        case AmazonConnectActions.UPDATE_CONTACT_RECORDING_BEHAVIOUR:
            let callRecording = new CallRecording();
            return await callRecording.processFlowActionUpdateContactRecordingBehavior(smaEvent, action,contextStore)
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

async function processFlowActionSuccess(smaEvent: any, action: any, contactFlow: any, amazonConnectInstanceID: string, bucketName: string, contextStore:any) {
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
            return await processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, intentName, amazonConnectInstanceID, bucketName, contextStore);
        }
        const nextAction = findActionByID(contactFlow.Actions, action.Transitions.NextAction);
        let actionType = nextAction.Type;
        if (!Object.values(AmazonConnectActions).includes(actionType)) {
            return await terminatingFlowAction(smaEvent, actionType)
        }
        return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName,smaEvent.CallDetails.TransactionAttributes[Attributes.CONNECT_CONTEXT_STORE]);
    } catch (error) {
        console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in Proccessing the Success SMA Event " + error.message);
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
async function processFlowActionFailed(smaEvent: any, actionObj: any, contactFlow: any, amazonConnectInstanceID: string, bucketName: string, contextStore:any) {
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
            nextAction = await getNextActionForError(currentAction, contactFlow.Actions, ErrorTypes.INPUT_TIME_LIMIT_EXCEEDS, smaEvent);
        } else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.NO_MATCHING_CONDITION)) {
            nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes.NO_MATCHING_CONDITION, smaEvent);    
        }
        else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.CONNECTION_TIME_LIMIT_EXCEEDED)) {
            nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes.CONNECTION_TIME_LIMIT_EXCEEDED, smaEvent);
        }
        else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.CALL_FAILED)) {
            nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes.CALL_FAILED, smaEvent);
        } else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.INVALID_PHONE_NUMBER)) {
            nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes.INVALID_PHONE_NUMBER, smaEvent);
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
            console.log(Attributes.DEFAULT_LOGGER + callId + "Next Action identifier:" + currentAction.Transitions.Errors[count].NextAction);
        }

        let actionType = nextAction.Type;
        if (!Object.values(AmazonConnectActions).includes(actionType)) {
            return await terminatingFlowAction(smaEvent, actionType)
        }
        return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName,contextStore);
      
    } catch (error) {
        console.error(Attributes.DEFAULT_LOGGER + callId + " There is an Error in Proccessing the Failed SMA Event " + error.message);
        return null;
    }
}

