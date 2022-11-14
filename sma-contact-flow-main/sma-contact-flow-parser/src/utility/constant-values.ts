const {
  REGION,
  FAILURE_SPEECH_SSML,
  FAILURE_AUDIO_FILE_LOCATION,
  DESTINATION_LOCATION,
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
  Failure_Speech_SSML:string,
  Failure_Audio_Location:string,
  CONNECT_CONTEXT_STORE:string,
  DEFAULT_LOGGER:string,
  CURRENT_FLOW_BLOCK:string
};

export class ContextStore {

  public static readonly PAUSE_ACTION: string = 'PauseAction';

  public static readonly TMP_MAP: string = 'TmpMap';

  public static readonly CONTEXT_ATTRIBUTES: string = 'ContextAttributes';

  public static readonly INVOKATION_MODULE_NEXT_ACTION="InvokationModuleNextAction";

  public static readonly ACTUAL_FLOW_ARN="ActualFlowARN";

  public static readonly SPEECH_ATTRIBUTES="SpeechAttributes";

  public static readonly LOOP_COUNT="LoopCount";

  public static readonly TRANSFER_FLOW_ARN="TransferFlowARN";

  public static readonly INVOKE_MODULE_ARN="InvokeModuleARN";

}

export class ContextAttributes {

  public static readonly CUSTOMER_ENDPOINT_ADDRESS: string = '$.CustomerEndpoint.Address';

  public static readonly SYSTEM_ENDPOINT_ADDRESS: string = '$.SystemEndpoint.Address';

  public static readonly INITIATION_METHOD: string = '$.InitiationMethod';

  public static readonly CONTACTID='$.ContactId';

  public static readonly INSTANCE_ARN= '$.InstanceARN';

  public static readonly CHANNEL='$.Channel';

  public static readonly CUSTOMER_ENDPOINT_TYPE='$.CustomerEndpoint.Type';

  public static readonly SYSTEM_ENDPOINT_TYPE='$.SystemEndpoint.Type';

  public static readonly LOOP_COUNT="LoopCount";

  public static readonly TRANSFER_FLOW_ARN="TransferFlowARN";

  public static readonly INVOKE_MODULE_ARN="InvokeModuleARN";

}

export class LambdaFunctionParameters {

  public static readonly CHANNEL: string = 'Channel';

  public static readonly CONTACTID: string = 'ContactId';

  public static readonly CUSTOMER_ENDPOINT: string = 'CustomerEndpoint';

  public static readonly ADDRESS = 'Address';

  public static readonly TYPE = 'Type';

  public static readonly INITIAL_CONTACTID = 'InitialContactId';

  public static readonly INITIATION_METHOD = 'InitiationMethod';

  public static readonly INSTANCE_ARN='InstanceARN';

  public static readonly SYSTEM_ENDPOINT="SystemEndpoint";

}

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
  destinationLocation: DESTINATION_LOCATION,
  TRACK: "BOTH",
  BRDIGE_ENDPOINT_TYPE: "PSTN",
  DIALOG_TYPE: "ElicitIntent",
  CONTENT_TYPE: "PlainText",
  SCHEMA_VERSION: "1.0",
  Failure_Speech_SSML:FAILURE_SPEECH_SSML,
  Failure_Audio_Location:FAILURE_AUDIO_FILE_LOCATION,
  CONNECT_CONTEXT_STORE:"ConnectContextStore",
  DEFAULT_LOGGER :"SMA-Contact-Flow-Builder | Call ID - ",
  CURRENT_FLOW_BLOCK : "currentFlowBlock"
}

export const Supported_Actions = ["Wait", "Loop", "TransferToFlow", "UpdateContactTextToSpeechVoice", "InvokeLambdaFunction", "UpdateContactAttributes", "Compare", "InvokeFlowModule", "EndFlowModuleExecution"];
