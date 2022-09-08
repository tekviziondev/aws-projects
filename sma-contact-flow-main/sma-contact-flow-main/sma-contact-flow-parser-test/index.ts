import {loadContactFlow } from '../sma-contact-flow-parser'

const amazonConnectInstanceID = "arn:aws:connect:us-east-1:664887287655:instance/a2ad01f9-0df4-4e52-b49f-cc4eb9b72704";
const amazonConnectFlowID = "arn:aws:connect:us-east-1:664887287655:instance/a2ad01f9-0df4-4e52-b49f-cc4eb9b72704/contact-flow/0de17392-a98c-4c6c-aa27-ea5ab0cf118e";

(async() => {
    try {
        console.log("Got Here");
        //const flowObject = await loadContactFlow(amazonConnectInstanceID, amazonConnectFlowID);
        //console.dir(flowObject, { depth: null });
    } catch (e) {
        console.log(e);
    }
})();

