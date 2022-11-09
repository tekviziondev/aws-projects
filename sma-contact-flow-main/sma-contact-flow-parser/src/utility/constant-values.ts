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
  BRDIGE_ENDPOINT_TYPE: string;
  DIALOG_TYPE: string,
  CONTENT_TYPE: string,
  SCHEMA_VERSION: string,
  Failure_Speech_SSML:string,
  Failure_Audio_Location:string
  CONNECT_CONTEXT_STORE:string
  DEFAULT_LOGGER:string
};

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
  DEFAULT_LOGGER :"SMA-Contact-Flow-Builder | Call ID - "
}
export const Supported_Actions = ["Wait", "Loop", "TransferToFlow", "UpdateContactTextToSpeechVoice", "InvokeLambdaFunction", "UpdateContactAttributes", "Compare", "InvokeFlowModule", "EndFlowModuleExecution"];
