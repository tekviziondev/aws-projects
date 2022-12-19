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
