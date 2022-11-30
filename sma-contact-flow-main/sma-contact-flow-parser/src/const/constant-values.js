"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.METRIC_PARAMS = exports.Supported_Actions = exports.Attributes = exports.SpeechParameters = exports.LambdaFunctionParameters = exports.ContextAttributes = exports.ContextStore = void 0;
const { REGION, FAILURE_SPEECH_SSML, FAILURE_AUDIO_FILE_LOCATION, DESTINATION_LOCATION, } = process.env;
class ContextStore {
}
exports.ContextStore = ContextStore;
ContextStore.PAUSE_ACTION = 'PauseAction';
ContextStore.TMP_MAP = 'TmpMap';
ContextStore.CONTEXT_ATTRIBUTES = 'ContextAttributes';
ContextStore.INVOKATION_MODULE_NEXT_ACTION = 'InvokationModuleNextAction';
ContextStore.ACTUAL_FLOW_ARN = 'ActualFlowARN';
ContextStore.SPEECH_ATTRIBUTES = 'SpeechAttributes';
ContextStore.LOOP_COUNT = 'LoopCount';
ContextStore.TRANSFER_FLOW_ARN = 'TransferFlowARN';
ContextStore.INVOKE_MODULE_ARN = 'InvokeModuleARN';
class ContextAttributes {
}
exports.ContextAttributes = ContextAttributes;
ContextAttributes.CUSTOMER_ENDPOINT_ADDRESS = '$.CustomerEndpoint.Address';
ContextAttributes.SYSTEM_ENDPOINT_ADDRESS = '$.SystemEndpoint.Address';
ContextAttributes.INITIATION_METHOD = '$.InitiationMethod';
ContextAttributes.CONTACTID = '$.ContactId';
ContextAttributes.INSTANCE_ARN = '$.InstanceARN';
ContextAttributes.CHANNEL = '$.Channel';
ContextAttributes.CUSTOMER_ENDPOINT_TYPE = '$.CustomerEndpoint.Type';
ContextAttributes.SYSTEM_ENDPOINT_TYPE = '$.SystemEndpoint.Type';
// parameters needed for invoking external lambda function
class LambdaFunctionParameters {
}
exports.LambdaFunctionParameters = LambdaFunctionParameters;
LambdaFunctionParameters.CHANNEL = 'Channel';
LambdaFunctionParameters.CONTACTID = 'ContactId';
LambdaFunctionParameters.CUSTOMER_ENDPOINT = 'CustomerEndpoint';
LambdaFunctionParameters.ADDRESS = 'Address';
LambdaFunctionParameters.TYPE = 'Type';
LambdaFunctionParameters.INITIAL_CONTACTID = 'InitialContactId';
LambdaFunctionParameters.INITIATION_METHOD = 'InitiationMethod';
LambdaFunctionParameters.INSTANCE_ARN = 'InstanceARN';
LambdaFunctionParameters.SYSTEM_ENDPOINT = "SystemEndpoint";
// parameters needed for executing speak and speakandGetDigits actions
class SpeechParameters {
}
exports.SpeechParameters = SpeechParameters;
SpeechParameters.TEXT_TO_SPEECH_VOICE = 'TextToSpeechVoice';
SpeechParameters.TEXT_TO_SPEECH_ENGINE = 'TextToSpeechEngine';
SpeechParameters.LANGUAGE_CODE = 'LanguageCode';
exports.Attributes = {
    VOICE_ID: "Joanna",
    ENGINE: "neural",
    LANGUAGE_CODE: "en-US",
    TEXT: "text",
    SSML: "ssml",
    region: REGION,
    CHANNEL: "VOICE",
    CUSTOMER_ENDPOINT_TYPE: "TELEPHONE_NUMBER",
    SYSTEM_ENDPOINT_TYPE: "TELEPHONE_NUMBER",
    DESTINATION_TYPE: "S3",
    destinationLocation: DESTINATION_LOCATION,
    TRACK: "BOTH",
    BRDIGE_ENDPOINT_TYPE: "PSTN",
    DIALOG_TYPE: "ElicitIntent",
    CONTENT_TYPE: "PlainText",
    SCHEMA_VERSION: "1.0",
    Failure_Speech_SSML: FAILURE_SPEECH_SSML,
    Failure_Audio_Location: FAILURE_AUDIO_FILE_LOCATION,
    CONNECT_CONTEXT_STORE: "ConnectContextStore",
    DEFAULT_LOGGER: "SMA-Contact-Flow-Builder | Call ID - ",
    CURRENT_FLOW_BLOCK: "currentFlowBlock",
    METRIC_ERROR: " There is an Error in creating the Metric Params "
};
// Amazon connect actions supported by the tekvizion library
exports.Supported_Actions = ["Wait", "Loop", "TransferToFlow", "UpdateContactTextToSpeechVoice", "InvokeLambdaFunction", "UpdateContactAttributes", "Compare", "InvokeFlowModule", "EndFlowModuleExecution"];
// parameters for updating metric details in cloud watch
exports.METRIC_PARAMS = {
    MetricData: [
        {
            MetricName: "",
            Dimensions: [
                {
                    Name: 'InstanceId',
                    Value: ''
                },
                {
                    Name: '',
                    Value: ''
                }
            ],
            Unit: 'None',
            Value: 1.0
        },
    ],
    Namespace: 'tekvizion'
};
