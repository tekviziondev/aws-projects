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
const defaultLogger = "SMA-Contact-Flow-Builder | Call ID - ";
let contextStore={};
//let loopMap = new Map<string, string>(); // loop count
//let ContactFlowARNMap = new Map<string, string>(); //For Transfer flow maintaing , transfer flow id
//let InvokeModuleARNMap = new Map<string, string>(); // For module arn ind
//let InvokationModuleNextAction = new Map<string, string>(); // next action after module execution 
//let ActualFlowARN = new Map<string, string>(); // orginal contact flow
const SpeechAttributeMap: Map<string, string> = new Map<string, string>();
const contextAttributes: Map<any, any> = new Map<any, any>();
let tmpMap: Map<any, any> = new Map<any, any>();
//let pauseAction: any;


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
        const transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;

        if (transactionAttributes && transactionAttributes['connectContextStore']){
            console.log("connectContextStore:"+ "true");
            
            contextStore=transactionAttributes['connectContextStore']
        }
        if (transactionAttributes && transactionAttributes['connectContextStore'] && !transactionAttributes['connectContextStore']['actualFlowARN']) {
            console.log("actualFlowARN:"+ "true");
            transactionAttributes['connectContextStore']['actualFlowARN']=amazonConnectFlowID;
         }

        if (transactionAttributes && transactionAttributes['connectContextStore'] && transactionAttributes['connectContextStore']['transferFlowARN']) {
            console.log("transferFlowARN:"+ "true");
            amazonConnectFlowID = transactionAttributes['connectContextStore']['transferFlowARN'];
         }
         if (transactionAttributes && transactionAttributes['connectContextStore'] && transactionAttributes['connectContextStore']['invokeModuleARN']) {
            type = "Invoke_Module"
            console.log("invokeModuleARN:"+ "true");
            amazonConnectFlowID = transactionAttributes['connectContextStore']['invokeModuleARN'];
         }
          
        const contactFlow = await loadContactFlow(amazonConnectInstanceID, amazonConnectFlowID, bucketName, smaEvent, type);
        console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Loaded Contact Flow" + contactFlow);
        console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " CallDetails:" + smaEvent.CallDetails);
        console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " TransactionAttributes:" + transactionAttributes);
        if (transactionAttributes && transactionAttributes.currentFlowBlock) {
            console.log(defaultLogger + callId + " InvocationEventType:" + smaEvent.InvocationEventType);
            if (smaEvent.InvocationEventType === EventTypes.ACTION_SUCCESSFUL || smaEvent.InvocationEventType === EventTypes.CALL_ANSWERED) {
                if (smaEvent.ActionData.ReceivedDigits != null) {
                    const recieved_digits = smaEvent.ActionData.ReceivedDigits;
                    return await processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, recieved_digits, amazonConnectInstanceID, bucketName, defaultLogger,contextStore);
                }
                return await processFlowActionSuccess(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, amazonConnectInstanceID, bucketName, contextStore);
            }
            else if (smaEvent.InvocationEventType === EventTypes.ACTION_FAILED || smaEvent.InvocationEventType === EventTypes.INVALID_LAMBDA_RESPONSE) {
                return await processFlowActionFailed(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, amazonConnectInstanceID, bucketName, contextStore);
            } else {
                let disconnect = new DisconnectParticipant();
                return await disconnect.processFlowActionDisconnectParticipant(smaEvent, transactionAttributes.currentFlowBlock,defaultLogger, contextStore)
                // processFlowActionDisconnectParticipant(smaEvent, transactionAttributes.currentFlowBlock);
            }
        }
        else {
           
            if (smaEvent.InvocationEventType === EventTypes.NEW_INBOUND_CALL){
                storeSystemAttributs(smaEvent, amazonConnectFlowID, amazonConnectFlowID)

                 contextStore={

                    "loopCount":"0",

                    "transferFlowARN":"",

                    "invokeModuleARN":"",

                    "invokationModuleNextAction":"",

                    "actualFlowARN":"",

                    "speechAttributeMap":{},

                    "contextAttributes":{},

                    "tmpMap":{},  

                    "pauseAction":null

                }
            }
            console.log("ContextStore Value: "+contextStore['loopCount']);
            
            // We're at the root start from there
            return await processRootFlowBlock(smaEvent, contactFlow,  amazonConnectInstanceID, bucketName, contextStore);
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
            console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Root Flow Block The actions are" + actions)
            if (actions && actions.length > 0) {
                const currentAction = findActionByID(actions, contactFlow.StartAction);
                let actionType = currentAction.Type;
                /*if (!AmazonConnectActions.hasOwnProperty(actionType)) {
                    return await terminatingFlowAction(smaEvent,  defaultLogger, actionType)
                }*/
                console.log(defaultLogger + callId + " ConnectInstanceId:" + amazonConnectInstanceID + " Root Flow Block The current Action is " + currentAction.Type)
                if (currentAction) {
                    console.log("Before Proccess Flow Action");
                    
                    return await processFlowAction(smaEvent, currentAction, actions, amazonConnectInstanceID, bucketName,contextStore);
                }
            }
        }
    } catch (error) {
        console.error(defaultLogger + callId + " There is an Error in getting the Root Flow Block" + error.message);
        return await terminatingFlowAction(smaEvent,  defaultLogger,  "error")
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
            return await getParticipantInput.processFlowActionGetParticipantInput(smaEvent, action,  defaultLogger, contextStore);
        case AmazonConnectActions.MESSAGE_PARTICIPANT:
            let message_participant = new MessageParticipant();
            return await message_participant.processFlowActionMessageParticipant(smaEvent, action,  defaultLogger, contextStore);
        case AmazonConnectActions.DISCONNECT_PARTICIPANT:
            let disconnect = new DisconnectParticipant();
            return await disconnect.processFlowActionDisconnectParticipant(smaEvent, action, defaultLogger, contextStore);
        case AmazonConnectActions.WAIT:
            let wait = new Wait();
            return await wait.processFlowActionWait(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger,contextStore);
        case AmazonConnectActions.UPDATE_CONTACT_RECORDING_BEHAVIOUR:
            let callRecording = new CallRecording();
            return await callRecording.processFlowActionUpdateContactRecordingBehavior(smaEvent, action,defaultLogger,contextStore)
        case AmazonConnectActions.LOOP:
            let loop = new Loop();
            return await loop.processFlowActionLoop(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, contextStore)
        case AmazonConnectActions.TRANSFER_PARTICIPANT_TO_THIRD_PARTY:
            let transferThirdParty = new TransferTOThirdParty();
            return await transferThirdParty.processFlowActionTransferParticipantToThirdParty(smaEvent, action, defaultLogger, contextStore)
        case AmazonConnectActions.CONNECT_PARTICIPANT_WITH_LEX_BOT:
            let lexbot = new LexBot();
            return await lexbot.processFlowActionConnectParticipantWithLexBot(smaEvent, action, defaultLogger, contextStore)
        case AmazonConnectActions.TRANSFER_TO_FLOW:
            let transferToFlow = new TrasferToFlow()
            return await transferToFlow.processFlowActionTransferToFlow(smaEvent, action, amazonConnectInstanceID, bucketName, defaultLogger,contextStore)
        case AmazonConnectActions.UPDATE_CONTACT_TEXT_TO_SPEECH:
            let updateVoice = new SetVoice();
            return await updateVoice.processFlowActionUpdateContactTextToSpeechVoice(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger,contextStore)
        case AmazonConnectActions.INVOKE_LAMBDA_FUNCTION:
            let invokeLambda = new InvokeLambda();
            return await invokeLambda.processFlowActionInvokeLambdaFunction(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, contextStore)
        case AmazonConnectActions.UPDATE_CONTACT_ATTRIBUTES:
            let update = new UpdateContactAttrbts();
            return await update.processFlowActionUpdateContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, contextStore)
        case AmazonConnectActions.COMPARE:
            let compare = new CompareAttribute();
            return await compare.processFlowActionCompareContactAttributes(smaEvent, action, actions, amazonConnectInstanceID, bucketName, defaultLogger, contextStore)
            let invoke = new InvokeModule();
            return await invoke.processFlowActionInvokeFlowModule(smaEvent, action, amazonConnectInstanceID, bucketName, defaultLogger,contextStore)
        case AmazonConnectActions.END_FLOW_MODULE_EXECUTION:
            let endModule = new EndModule()
            return await endModule.processFlowActionEndFlowModuleExecution(smaEvent, amazonConnectInstanceID, bucketName,defaultLogger, contextStore)
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
            return await processFlowConditionValidation(smaEvent, transactionAttributes.currentFlowBlock, contactFlow, intentName, amazonConnectInstanceID, bucketName, defaultLogger,contextStore);
        }
        const nextAction = findActionByID(contactFlow.Actions, action.Transitions.NextAction);
        let actionType = nextAction.Type;
       /* if (!AmazonConnectActions.hasOwnProperty(actionType)) {
            return await terminatingFlowAction(smaEvent, defaultLogger, actionType)
        }*/
        console.log("Success: "+smaEvent.CallDetails.TransactionAttributes['connectContextStore']);
        

        return await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName,smaEvent.CallDetails.TransactionAttributes['connectContextStore']);
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
            nextAction = await getNextActionForError(currentAction, contactFlow.Actions, ErrorTypes.INPUT_TIME_LIMIT_EXCEEDS, smaEvent, defaultLogger);
            smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName,contextStore).Actions[0]);
        } else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.NO_MATCHING_CONDITION)) {
            nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes.NO_MATCHING_CONDITION, smaEvent, defaultLogger);
            smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName,contextStore).Actions[0]);
        }
        else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.CONNECTION_TIME_LIMIT_EXCEEDED)) {
            nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes.CONNECTION_TIME_LIMIT_EXCEEDED, smaEvent, defaultLogger);
            smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName,contextStore).Actions[0]);
        }
        else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.CALL_FAILED)) {
            nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes.CALL_FAILED, smaEvent, defaultLogger);
            smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName,contextStore).Actions[0]);

        } else if (smaEvent && smaEvent.ActionData.ErrorType.includes(ErrorTypes.INVALID_PHONE_NUMBER)) {
            nextAction = await getNextActionForError(currentAction, contactFlow, ErrorTypes.INVALID_PHONE_NUMBER, smaEvent, defaultLogger);
            smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName, contextStore).Actions[0]);

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
            smaAction = await (await processFlowAction(smaEvent, nextAction, contactFlow.Actions, amazonConnectInstanceID, bucketName,contextStore)).Actions[0];

        }
        let actionType = nextAction.Type;
        if (!AmazonConnectActions.hasOwnProperty(actionType)) {
            return await terminatingFlowAction(smaEvent,  defaultLogger,  actionType)
        }
        let pauseAction=contextStore['pauseAction'] 
        if (pauseAction) {
            smaAction1 = pauseAction;
            pauseAction = null;
            return {
                "SchemaVersion": Attributes.SCHEMA_VERSION,
                "Actions": [
                    smaAction1, smaAction
                ],
                "TransactionAttributes": {
                    "currentFlowBlock": nextAction,
                    "connectContextStore":contextStore
                }
            }

        }
        return {
            "SchemaVersion": Attributes.SCHEMA_VERSION,
            "Actions": [
                smaAction
            ],
            "TransactionAttributes": {
                "currentFlowBlock": nextAction,
                "connectContextStore":contextStore
            }
        }
    } catch (error) {
        console.error(defaultLogger + callId + " There is an Error in Proccessing the Failed SMA Event " + error.message);
        return null;
    }
}

