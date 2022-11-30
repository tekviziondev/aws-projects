import {loadContactFlow } from '../sma-contact-flow-parser'
import smaEvent from './sma-event.json';

const amazonConnectInstanceID = "arn:aws:connect:us-east-1:664887287655:instance/a2ad01f9-0df4-4e52-b49f-cc4eb9b72704";
const amazonConnectFlowID = "arn:aws:connect:us-east-1:664887287655:instance/a2ad01f9-0df4-4e52-b49f-cc4eb9b72704/contact-flow/0de17392-a98c-4c6c-aa27-ea5ab0cf118e";
const bucket="flow-cache1";
const type="Contact_Flow";

// Sample Test case to check the Loading and Parsing of the Contact Flow

(async() => {
    try {
        const flowObject = await loadContactFlow(amazonConnectInstanceID, amazonConnectFlowID, bucket, smaEvent, type);
        console.log("The Contact Flow Data is "+JSON.stringify(flowObject))
    } catch (e) {
        console.log(e);
    }
})();

