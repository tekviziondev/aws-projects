import {DisconnectParticipant } from '../sma-contact-flow-parser/src/SMA_Mapping_Actions/disconnect-participant'
import {MessageParticipant } from '../sma-contact-flow-parser/src/SMA_Mapping_Actions/message-participant'
import smaEvent from './smaEvent.json';
import contextStore from './contextstoreVariables.json';
import action from './action.json';


(async() => {
    try {
        console.log("Got Here");
        const messageParticipant = new MessageParticipant().execute(smaEvent,action,contextStore);
        console.log(messageParticipant);
        const disconnect = new DisconnectParticipant().processFlowActionDisconnectParticipant(smaEvent, contextStore);
        console.log(disconnect);
    } catch (e) {
        console.log(e);
    }
})();
