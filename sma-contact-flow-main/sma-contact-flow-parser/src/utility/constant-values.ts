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
  SCHEMA_VERSION:string,

};

export const Attributes: Data = {
  VOICE_ID: "Joanna",
  ENGINE: "neural",
  LANGUAGE_CODE: "en-US",
  TEXT: "text",
  SSML: "ssml",
  region: "us-east-1",
  CHANNEL: "VOICE",
  CUSTOMER_ENDPOINT_TYPE: "TELEPHONE_NUMBER",
  SYSTEM_ENDPOINT_TYPE: "TELEPHONE_NUMBER",
  DESTINATION_TYPE: "S3",
  destinationLocation: " flow-cache1",
  TRACK: "BOTH",
  BRDIGE_ENDPOINT_TYPE: "PSTN",
  DIALOG_TYPE: "ElicitIntent",
  CONTENT_TYPE: "PlainText",
  SCHEMA_VERSION: "1.0"

}
export const Supported_Actions = ["Wait", "Loop", "TransferToFlow", "UpdateContactTextToSpeechVoice", "InvokeLambdaFunction", "UpdateContactAttributes", "Compare", "InvokeFlowModule", "EndFlowModuleExecution"];
