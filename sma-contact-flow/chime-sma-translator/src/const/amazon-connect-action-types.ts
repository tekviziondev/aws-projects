/*
Copyright (c) 2023 tekVizion PVS, Inc. 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

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
