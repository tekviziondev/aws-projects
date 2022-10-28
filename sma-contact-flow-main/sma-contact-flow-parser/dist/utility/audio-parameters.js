"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.failureAudioParameters = exports.getAudioParameters = void 0;
const call_details_1 = require("./call-details");
/**
  * This function process SMA Event and returns the Speech Parameters for SpeakAndGetDigits
  * @param smaEvent
  * @param action
  * @param contextAttributs
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Speech Parameters
  */
function getAudioParameters(smaEvent, action, defaultLogger) {
    let callId;
    const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
    callId = legA.CallId;
    if (!callId)
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
/**
  * This function process SMA Event and returns the Failure Audio Parameters for SpeakAndGetDigits
  * @param smaEvent
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Failure Speech Parameters
  */
function failureAudioParameters(smaEvent, action, defaultLogger) {
    let callId;
    const legA = (0, call_details_1.getLegACallDetails)(smaEvent);
    callId = legA.CallId;
    if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
    let rv = null;
    let bucketName;
    let type;
    let uri;
    let uriObj;
    let key;
    if (action.Parameters.SourceType !== null) {
        console.log(defaultLogger + callId + " Audio Parameters SourceType Exists");
        uri = "s3://smabridgingdemo-wavfiles98e3397d-3rx7w2754wlc/greeting.wav";
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
    console.log(defaultLogger + callId + " Failure Audio Parameters : " + rv);
    return rv;
}
exports.failureAudioParameters = failureAudioParameters;
