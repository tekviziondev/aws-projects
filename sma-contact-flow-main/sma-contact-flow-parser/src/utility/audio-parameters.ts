import { getLegACallDetails } from "./call-details";
import { Attributes } from "./constant-values";
import { terminatingFlowAction } from "./termination-action";

/**
  * This function process SMA Event and returns the Speech Parameters for SpeakAndGetDigits
  * @param smaEvent 
  * @param action
  * @param contextAttributs
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Audio Parameters
  */
export async function getAudioParameters(smaEvent: any, action: any, defaultLogger: string) {
    let callId: string;
    try {
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
        if (action.Parameters.SourceType) {
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
    } catch (error) {
        console.log(defaultLogger + callId + " There is an Error in execution of Get Audio Parameters " + error.message);
        return await terminatingFlowAction(smaEvent,  defaultLogger, "error")
    }
}

/**
  * This function process SMA Event and returns the Failure Audio Parameters for SpeakAndGetDigits
  * @param smaEvent 
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Failure Audio Parameters
  */
export async function failureAudioParameters(smaEvent: any, action: any, defaultLogger: string, pauseAction: any, SpeechAttributeMap: Map<string, string>, contextAttributes: Map<any, any>, ActualFlowARN: Map<string, string>, ContactFlowARNMap: Map<string, string>) {
    let callId: string;
    try {
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
        if (action.Parameters.SourceType) {
            console.log(defaultLogger + callId + " Audio Parameters SourceType Exists");
            uri = Attributes.Failure_Audio_Location;
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
    } catch (error) {
        console.log(defaultLogger + callId + " There is an Error in execution of Get Failure Audio Parameters " + error.message);
        return await terminatingFlowAction(smaEvent,  defaultLogger, "error")
    }
}