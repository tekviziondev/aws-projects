"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioParameter = void 0;
const call_details_1 = require("../utility/call-details");
const constant_values_1 = require("../const/constant-values");
const default_termination_action_1 = require("../utility/default-termination-action");
class AudioParameter {
    /**
      * This method process the Contact Flow play audio related action object and returns the Audio Parameters for PlayAudio and PlayAudioGetDigits Action
      * @param smaEvent
      * @param action
      * @returns Audio Parameters
      */
    async getAudioParameters(smaEvent, action, error) {
        let callId;
        try {
            // getting the CallID of the Active call from the SMA Event
            let callDetails = new call_details_1.CallDetailsUtil();
            const legA = callDetails.getLegACallDetails(smaEvent);
            callId = legA.CallId;
            if (!callId)
                callId = smaEvent.ActionData.Parameters.CallId;
            let rv = null;
            let bucketName;
            let type;
            let uri;
            let uriObj;
            let key;
            if (error && error.includes("FailureAudioParameters")) {
                if (constant_values_1.Attributes.Failure_Audio_Location)
                    uri = constant_values_1.Attributes.Failure_Audio_Location;
            }
            else {
                uri = action.Parameters.Media.Uri;
            }
            if (action.Parameters.Media.SourceType) {
                console.log(constant_values_1.Attributes.DEFAULT_LOGGER + callId + " Media SourceType Exists");
                uriObj = uri.split("/");
                bucketName = uriObj[2];
                key = uriObj[3];
                type = action.Parameters.Media.SourceType;
            }
            rv = {
                Type: type,
                BucketName: bucketName,
                Key: key //Mandatory
            };
            console.log(constant_values_1.Attributes.DEFAULT_LOGGER + callId + " Audio Parameters : " + rv);
            return rv;
        }
        catch (error) {
            console.log(constant_values_1.Attributes.DEFAULT_LOGGER + callId + " There is an error in execution of Get Audio Parameters " + error.message);
            return await new default_termination_action_1.TerminatingFlowUtil().terminatingFlowAction(smaEvent, "error");
        }
    }
}
exports.AudioParameter = AudioParameter;
