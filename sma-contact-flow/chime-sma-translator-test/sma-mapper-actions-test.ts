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

import {DisconnectParticipant } from '../chime-sma-translator/src/sma_mapping_actions/disconnect-participant'
import {MessageParticipant } from '../chime-sma-translator/src/sma_mapping_actions/message-participant'
import smaEvent from './sma-event.json';
import contextStore from './contextstoreVariables.json';
import action from './action.json';

// Sample Test case to check the  SMA action
(async() => {
    try {
        const messageParticipant = new MessageParticipant().execute(smaEvent,action,contextStore);
        console.log("The SMA action object is "+JSON.stringify(messageParticipant));
        const disconnect = new DisconnectParticipant().processFlowActionDisconnectParticipant(smaEvent, contextStore);
        console.log("The SMA action object for disconnet participant is"+JSON.stringify(disconnect));
    } catch (e) {
        console.log(e);
    }
})();
