import {DisconnectParticipant } from '../sma-contact-flow-parser/src/SMA_Mapping_Actions/disconnect-participant'
import smaEvent from './smaEvent.json';
import contextStore from './contextstoreVariables.json';


(async() => {
    try {
        console.log("Got Here");
        const disconnect = new DisconnectParticipant().processFlowActionDisconnectParticipant(smaEvent, contextStore);
        console.dir(disconnect, { depth: null });
    } catch (e) {
        console.log(e);
    }
})();