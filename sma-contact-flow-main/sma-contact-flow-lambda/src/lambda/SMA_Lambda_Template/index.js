"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//Tekvizion SMA-Contact-Flow-Parser Library
const sma_contact_flow_parser_1 = require("sma-contact-flow-parser");
//Amazon Connect Instance ID
const amazonConnectInstanceID = "";
//Amazon Connect Contact Flow ID
const amazonConnectFlowID = "";
// Bucket Name to Store the Contact flow Response cache
const s3BucketName = "";

exports.handler = async (event, context, callback) => {
    let call_Id = event.CallDetails.Participants[0].CallId;
    console.log("CallID :" + call_Id + '| Event recieved from SMA : ' + JSON.stringify(event));
    switch (event.InvocationEventType) {
        case "NEW_INBOUND_CALL":
            try {
                console.log("Got Here");
                /*
                 * calling the Tekvizion SMA-Contact-Flow-Parser Library to get the first corresponding  SMA action object from the amazon connect contact flow.
                 */
                const actionObj = await sma_contact_flow_parser_1.processFlow(event, amazonConnectInstanceID, amazonConnectFlowID, s3BucketName);
                console.log("CallID :" + call_Id + "| Action Object : " + JSON.stringify(actionObj) + " is going to execute");
                return actionObj;
            }
            catch (e) {
                console.log(e);
            }
            break;
        case "ACTION_SUCCESSFUL":
            try {
                console.log("CallID :" + call_Id + +" |" + event.ActionData.Type + " Action is executed successfully");
                /*
                 * calling the Tekvizion SMA-Contact-Flow-Parser Library to get the  corresponding next SMA action object from the amazon connect contact flow.
                 */
                const actionObj = await sma_contact_flow_parser_1.processFlow(event, amazonConnectInstanceID, amazonConnectFlowID, s3BucketName);
                console.log("CallID :" + call_Id + "| Action Object : " + JSON.stringify(actionObj) + " is going to execute");
                return actionObj;
            } catch (e) {
                console.log(e);
            }

            break;
        case "ACTION_FAILED":
            try {
                console.log("CallID :" + call_Id + +" |" + event.ActionData.Type + " Action is failed to execute");
                /*
                 * calling the Tekvizion SMA-Contact-Flow-Parser Library to get the corresponding error SMA action object from the amazon connect contact flow.
                 */
                const actionObj = await sma_contact_flow_parser_1.processFlow(event, amazonConnectInstanceID, amazonConnectFlowID, s3BucketName);
                console.log("CallID :" + call_Id + "| Action Object : " + JSON.stringify(actionObj) + " is going to execute");
                return actionObj;
            } catch (e) {
                console.log(e);
            }
            break;

        case 'HANGUP':
            console.log("CallID :" + call_Id + +" | The call is Hanged Up");
            break;
        default:
            return null;
            break;
    }
    callback(null, response);
};