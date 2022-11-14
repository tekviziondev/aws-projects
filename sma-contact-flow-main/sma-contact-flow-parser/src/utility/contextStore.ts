import { ContextStore } from "./constant-values";

export interface IContextStore{
    [ContextStore.LOOP_COUNT]:any,
    [ContextStore.TRANSFER_FLOW_ARN]:"",
    [ContextStore.INVOKE_MODULE_ARN]:"",
    [ContextStore.INVOKATION_MODULE_NEXT_ACTION]:"",
    [ContextStore.ACTUAL_FLOW_ARN]:"",
    [ContextStore.SPEECH_ATTRIBUTES]:{},
    [ContextStore.CONTEXT_ATTRIBUTES]:{},
    [ContextStore.TMP_MAP]:{},  
    [ContextStore.PAUSE_ACTION]:any
}