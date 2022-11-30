// used to store the attribute data, action execution details in the Transaction attributes between the SMA lambda invocations.
export interface IContextStore {
    LoopCount: any;
    TransferFlowARN: string;
    InvokeModuleARN: string;
    InvokationModuleNextAction: string;
    ActualFlowARN: string;
    SpeechAttributes: any;
    ContextAttributes: any;
    TmpMap: any;
    PauseAction: any
}