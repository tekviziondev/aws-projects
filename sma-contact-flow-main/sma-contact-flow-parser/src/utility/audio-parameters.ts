import { getLegACallDetails } from "./call-details";

/**
  * This function process SMA Event and returns the Speech Parameters for SpeakAndGetDigits
  * @param smaEvent 
  * @param action
  * @param contextAttributs
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Speech Parameters
  */
export function getAudioParameters(smaEvent: any, action: any, defaultLogger: string) {
    let callId: string;
    const legA = getLegACallDetails(smaEvent);
    callId = legA.CallId;
    if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
    let rv = null;
    let bucketName: string;
    let type: string;
    let uri: string;
    let uriObj: string[];
    let key: string;
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
    }

    console.log(defaultLogger + callId + " Audio Parameters : " + rv);
    return rv;
}

/**
  * This function process SMA Event and returns the Failure Audio Parameters for SpeakAndGetDigits
  * @param smaEvent 
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Failure Speech Parameters
  */
export function failureAudioParameters(smaEvent: any, action: any, defaultLogger: string) {
    let callId: string;
    const legA = getLegACallDetails(smaEvent);
    callId = legA.CallId;
    if (!callId)
        callId = smaEvent.ActionData.Parameters.CallId;
    let rv = null;
    let bucketName: string;
    let type: string;
    let uri: string;
    let uriObj: string[];
    let key: string;
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
    }

    console.log(defaultLogger + callId + " Failure Audio Parameters : " + rv);
    return rv;
}