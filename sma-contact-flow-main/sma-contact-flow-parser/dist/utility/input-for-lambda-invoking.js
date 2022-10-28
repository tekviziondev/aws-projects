"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputForInvokingLambda = void 0;
async function inputForInvokingLambda(action, contextAttributs) {
    let InvocationAttributes = Object.entries(action.Parameters.LambdaInvocationAttributes);
    for (let i = 0; i < InvocationAttributes.length; i++) {
        if (InvocationAttributes[i][1].includes("$.External.") || InvocationAttributes[i][1].includes("$.Attributes.")) {
            contextAttributs.forEach((value, key) => {
                if (InvocationAttributes[i][1] == key)
                    InvocationAttributes[i][1] = InvocationAttributes[i][1].replace(key, value);
            });
        }
    }
    let lambdaFunctionParameters = Object.fromEntries(InvocationAttributes.map(([k, v]) => [k, v]));
    let inputForInvoking = {
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
            "Parameters": lambdaFunctionParameters
        },
        "Name": "ContactFlowEvent"
    };
    return inputForInvoking;
}
exports.inputForInvokingLambda = inputForInvokingLambda;
