// Amazon connect ations supported by the tekVizion's Library
export enum AmazonConnectActions {
  GET_PARTICIPANT_INPUT = "GetParticipantInput",
  MESSAGE_PARTICIPANT = "MessageParticipant",
  DISCONNECT_PARTICIPANT = "DisconnectParticipant",
  WAIT = "Wait",
  UPDATE_CONTACT_RECORDING_BEHAVIOUR = "UpdateContactRecordingBehavior",
  LOOP = "Loop",
  TRANSFER_PARTICIPANT_TO_THIRD_PARTY = "TransferParticipantToThirdParty",
  CONNECT_PARTICIPANT_WITH_LEX_BOT = "ConnectParticipantWithLexBot",
  TRANSFER_TO_FLOW = "TransferToFlow",
  UPDATE_CONTACT_TEXT_TO_SPEECH = "UpdateContactTextToSpeechVoice",
  INVOKE_LAMBDA_FUNCTION = "InvokeLambdaFunction",
  UPDATE_CONTACT_ATTRIBUTES = "UpdateContactAttributes",
  COMPARE = "Compare",
  INVOKE_FLOW_MODULE = "InvokeFlowModule",
  END_FLOW_MODULE_EXECUTION = "EndFlowModuleExecution",
  DISTRIBUTE_BY_PERCENTAGE= "DistributeByPercentage",
  UPDATE_FLOW_LOGGING_BEHAVIOUR="UpdateFlowLoggingBehavior"
}