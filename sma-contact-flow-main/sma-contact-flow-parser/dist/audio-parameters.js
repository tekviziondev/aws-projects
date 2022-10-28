"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAudioParameters = void 0;
const call_details_1 = require("./call-details");
function getAudioParameters(smaEvent, action, defaultLogger) {
    let callId;
    const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
    callId = legA.CallId;
    if (callId == "NaN")
        callId = smaEvent.ActionData.Parameters.CallId;
    let rv = null;
    let bucketName;
    let type;
    let uri;
    let uriObj;
    let key;
    if (action.Parameters.SourceType !== null) {
        console.log(defaultLogger + callId + " Audio Parameters SourceType Exists");
        uri = action.Parameters.Media.Uri;
        uriObj = uri.split("/");
        bucketName = uriObj[2];
        key = uriObj[3];
        type = action.Parameters.Media.SourceType;
    }
    rv = {
        Type: type,
        BucketName: bucketName,
        Key: key
    };
    console.log(defaultLogger + callId + " Audio Parameters : " + rv);
    return rv;
}
exports.getAudioParameters = getAudioParameters;
