import { ContextStore } from "./constant-values";

export interface IContextStore{
    LoopCount:any,
    TransferFlowARN:string,
    InvokeModuleARN:string,
    InvokationModuleNextAction:string,
    ActualFlowARN:string,
    SpeechAttributes:any,
    ContextAttributes:any,
    TmpMap:any,  
    PauseAction:any
}