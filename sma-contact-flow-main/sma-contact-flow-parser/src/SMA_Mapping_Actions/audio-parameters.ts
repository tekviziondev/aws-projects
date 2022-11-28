import { CallDetailsUtil } from "../utility/call-details";
import { Attributes } from "../const/constant-values";
import { TerminatingFlowUtil } from "../utility/termination-action";
import { IContextStore } from "../const/context-store";


export abstract class AudioParameter{
/**
  * This function process the Amazon connect action object and returns the Speech Parameters for SpeakAndGetDigits Action
  * @param smaEvent 
  * @param action
  * @returns Audio Parameters
  */
 async  getAudioParameters(smaEvent: any, action: any,error:any) {
    let callId: string;
    try {
        let callDetails=new CallDetailsUtil();
        const legA = callDetails.getLegACallDetails(smaEvent)as any;
        callId = legA.CallId;
        if (!callId)
            callId = smaEvent.ActionData.Parameters.CallId;
        let rv = null;
        let bucketName: string;
        let type: string;
        let uri: string;
        let uriObj: string[];
        let key: string;
        if(error && error.includes("FailureAudioParameters")){
        if (Attributes.Failure_Audio_Location)
            uri = Attributes.Failure_Audio_Location;
        }else{
            uri = action.Parameters.Media.Uri;
        }
        if (action.Parameters.Media.SourceType) {
            console.log(Attributes.DEFAULT_LOGGER + callId + " Audio Parameters SourceType Exists");
            uriObj = uri.split("/");
            bucketName = uriObj[2]; 
            key = uriObj[3];
            type = action.Parameters.Media.SourceType;
        }
        rv = {
            Type: type, //Mandatory
            BucketName: bucketName, //Mandatory
            Key: key //Mandatory
        }
        console.log(Attributes.DEFAULT_LOGGER + callId + " Audio Parameters : " + rv);
        return rv;
    } catch (error) {
        console.log(Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of Get Audio Parameters " + error.message);
        return await new TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error")
    }
 }
 abstract execute(smaEvent: any, action: any, contextStore: IContextStore):any;
}
