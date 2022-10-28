type Data = {
  voiceId: string;
  engine: string;
  languageCode: string;
  text: string;
  ssml: string;
  region: string;
  channel: string;
  customerEndpointType: string;
  systemEndpointType: string;
  destinationType: string;
  destinationLocation: string;
  Track: string;
  BridgeEndpointType: string;
  dialogType: string,
  ContentType: string,

};

export const ConstData: Data = {
  voiceId: "Joanna",
  engine: "neural",
  languageCode: "en-US",
  text: "text",
  ssml: "ssml",
  region: "us-east-1",
  channel: "VOICE",
  customerEndpointType: "TELEPHONE_NUMBER",
  systemEndpointType: "TELEPHONE_NUMBER",
  destinationType: "S3",
  destinationLocation: " flow-cache1",
  Track: "BOTH",
  BridgeEndpointType: "PSTN",
  dialogType: "ElicitIntent",
  ContentType: "PlainText",

}
export const constActions = ["Wait", "Loop", "TransferToFlow", "UpdateContactTextToSpeechVoice", "InvokeLambdaFunction", "UpdateContactAttributes", "Compare", "InvokeFlowModule", "EndFlowModuleExecution"];