"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sma_contact_flow_parser_1 = require("../sma-contact-flow-parser");
const amazonConnectInstanceID = "arn:aws:connect:us-east-1:664887287655:instance/a2ad01f9-0df4-4e52-b49f-cc4eb9b72704";
const amazonConnectFlowID = "arn:aws:connect:us-east-1:664887287655:instance/a2ad01f9-0df4-4e52-b49f-cc4eb9b72704/contact-flow/dbb2bcd0-f1c1-4c11-9920-adc10d31db86";
(async () => {
    try {
        console.log("Got Here");
        const flowObject = await (0, sma_contact_flow_parser_1.processFlow)("",amazonConnectInstanceID, amazonConnectFlowID,"flow-cache1");
        console.dir(flowObject, { depth: null });
    }
    catch (e) {
        console.log(e);
    }
})();
