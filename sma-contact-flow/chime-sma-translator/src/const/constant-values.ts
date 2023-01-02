const {
  REGION,
  FAILURE_SPEECH_SSML,
  FAILURE_AUDIO_FILE_LOCATION,
  CALL_RECORDINGS_S3_BUCKET,
} = process.env;

type Data = {
  VOICE_ID: string;
  ENGINE: string;
  LANGUAGE_CODE: string;
  TEXT: string;
  SSML: string;
  region: string;
  CHANNEL: string;
  CUSTOMER_ENDPOINT_TYPE: string;
  SYSTEM_ENDPOINT_TYPE: string;
  DESTINATION_TYPE: string;
  destinationLocation: string;
  TRACK: string;
  BRDIGE_ENDPOINT_TYPE: string,
  DIALOG_TYPE: string,
  CONTENT_TYPE: string,
  SCHEMA_VERSION: string,
  Failure_Speech_SSML: string,
  Failure_Audio_Location: string,
  CONNECT_CONTEXT_STORE: string,
  DEFAULT_LOGGER: string,
  CURRENT_FLOW_BLOCK: string,
  METRIC_ERROR: string
};
 
export class ContextStore {

  public static readonly PAUSE_ACTION = 'PauseAction';

  public static readonly TMP_MAP = 'TmpMap';

  public static readonly CONTEXT_ATTRIBUTES = 'ContextAttributes';

  public static readonly INVOKATION_MODULE_NEXT_ACTION = 'InvokationModuleNextAction';

  public static readonly ACTUAL_FLOW_ARN = 'ActualFlowARN';

  public static readonly SPEECH_ATTRIBUTES = 'SpeechAttributes';

  public static readonly LOOP_COUNT = 'LoopCount';

  public static readonly TRANSFER_FLOW_ARN = 'TransferFlowARN';

  public static readonly INVOKE_MODULE_ARN = 'InvokeModuleARN';

}

export class ContextAttributes {

  public static readonly CUSTOMER_ENDPOINT_ADDRESS = '$.CustomerEndpoint.Address';

  public static readonly SYSTEM_ENDPOINT_ADDRESS = '$.SystemEndpoint.Address';

  public static readonly INITIATION_METHOD = '$.InitiationMethod';

  public static readonly CONTACTID = '$.ContactId';

  public static readonly INSTANCE_ARN = '$.InstanceARN';

  public static readonly CHANNEL = '$.Channel';

  public static readonly CUSTOMER_ENDPOINT_TYPE = '$.CustomerEndpoint.Type';

  public static readonly SYSTEM_ENDPOINT_TYPE = '$.SystemEndpoint.Type';

}

// parameters needed for invoking external lambda function
export class LambdaFunctionParameters {

  public static readonly CHANNEL = 'Channel';

  public static readonly CONTACTID = 'ContactId';

  public static readonly CUSTOMER_ENDPOINT = 'CustomerEndpoint';

  public static readonly ADDRESS = 'Address';

  public static readonly TYPE = 'Type';

  public static readonly INITIAL_CONTACTID = 'InitialContactId';

  public static readonly INITIATION_METHOD = 'InitiationMethod';

  public static readonly INSTANCE_ARN = 'InstanceARN';

  public static readonly SYSTEM_ENDPOINT = "SystemEndpoint";

}

// parameters needed for executing speak and speakandGetDigits actions
export class SpeechParameters {

  public static readonly TEXT_TO_SPEECH_VOICE: string = 'TextToSpeechVoice';

  public static readonly TEXT_TO_SPEECH_ENGINE: string = 'TextToSpeechEngine';

  public static readonly LANGUAGE_CODE: string = 'LanguageCode';

}

export const Attributes: Data = {
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
  destinationLocation: CALL_RECORDINGS_S3_BUCKET,
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
}

// Amazon connect actions supported by the tekvizion library
export const Supported_Actions = ["Wait", "Loop", "TransferToFlow", "UpdateContactTextToSpeechVoice", "InvokeLambdaFunction", "UpdateContactAttributes", "Compare", "InvokeFlowModule", "EndFlowModuleExecution"];

// parameters for updating metric details in cloud watch
export const METRIC_PARAMS = {
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