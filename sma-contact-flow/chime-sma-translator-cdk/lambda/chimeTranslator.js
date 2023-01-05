"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//tekVizion chime-sma-translator Library
const sma_contact_flow_parser_1 = require("chime-sma-translator");
//Amazon Connect Instance ID
const amazonConnectInstanceID = process.env.CONNECT_INSTANCE_ID;
//Amazon Connect Contact Flow ID
const amazonConnectFlowID = process.env.CONTACT_FLOW_ID;
// Bucket Name to Store the Contact flow Response cache
const s3BucketName = process.env.S3_BUCKET;

exports.handler = async (event, context, callback) => {
    let call_Id = event.CallDetails.Participants[0].CallId;
    console.log("CallID :" + call_Id + '| Event recieved from SMA : ' + JSON.stringify(event));
    switch (event.InvocationEventType) {
        case "NEW_INBOUND_CALL":
            try {
                /*
                 * New incoming call event received from Amazon PSTN audio service and tekVizion SMA-Contact-Flow-Parser Library invoked to get the first corresponding SMA action object from the amazon connect contact flow to execute.
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
                 *  Action Successfull event received from Amazon PSTN audio service and tekVizion SMA-Contact-Flow-Parser Library invoked to get the corresponding SMA action object from the amazon connect contact flow to execute.
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
                 *   Action Failed event received from Amazon PSTN audio service and tekVizion SMA-Contact-Flow-Parser Library invoked to get the corresponding SMA action object from the amazon connect contact flow to execute.
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