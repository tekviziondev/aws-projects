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

//import {processFlow } from 'sma-contact-flow-parser'
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


//const amazonConnectInstanceID = "arn:aws:connect:us-east-1:664887287655:instance/a2ad01f9-0df4-4e52-b49f-cc4eb9b72704";
//const amazonConnectFlowID = "arn:aws:connect:us-east-1:664887287655:instance/a2ad01f9-0df4-4e52-b49f-cc4eb9b72704/contact-flow/0de17392-a98c-4c6c-aa27-ea5ab0cf118e";




let generalResponse: smaResponse = {
    SchemaVersion: '1.0',
    Actions: [],
  }
  
  exports.handler = async (event: any, context: any, callback: any) => {
    console.log('Lambda is invoked with calldetails:' + JSON.stringify(event));
    let response = generalResponse;
  
    switch (event.InvocationEventType) {
      case "NEW_INBOUND_CALL":
       /* (async() => {
            try {
                console.log("Got Here");
                const ActionsVal = await processFlow(event,amazonConnectInstanceID, amazonConnectFlowID);
                console.dir(ActionsVal, { depth: null });
            } catch (e) {
                console.log(e);
            }
        });*/
        response.Actions = [pauseAction, speakAction, hangupAction];
        break;
  
      case 'HANGUP':
        console.log('HANGUP ACTION');
        break;
      default:
        response.Actions = [hangupAction];
        break;
    }
  
    console.log('Sending response:' + JSON.stringify(response));
    callback(null, response);
  };
  
  interface smaAction {
    Type: string;
    Parameters: {};
  };
  interface smaActions extends Array<smaAction> { };
  
  interface smaResponse {
    SchemaVersion: string;
    Actions: smaActions;
    TransactionAttributes?: Object;
  }
  
  const response: smaResponse = {
    SchemaVersion: '1.0',
    Actions: [],
  };
  
  
  const speakAction = {
    Type: "Speak",
    Parameters: {
      Engine: "neural", // Required. Either standard or neural
      LanguageCode: "en-US", // Optional
      Text: "", // Required
      TextType: "ssml", // Optional. Defaults to text
      VoiceId: "Joanna" // Required
    }
  }
  
  const pauseAction = {
    Type: "Pause",
    Parameters: {
      DurationInMilliseconds: "1000",
    },
  };
  
  const hangupAction = {
    Type: "Hangup",
    Parameters: {
      SipResponseCode: "0",
      ParticipantTag: "",
    },
  };
  
  