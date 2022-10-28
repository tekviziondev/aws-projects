/**
  * This function process SMA Event and returns the Speech Parameters for SpeakAndGetDigits
  * @param smaEvent
  * @param action
  * @param contextAttributs
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Speech Parameters
  */
export declare function getSpeechParameters(smaEvent: any, action: any, contextAttributs: Map<any, any>, SpeechAttributeMap: Map<string, string>, defaultLogger: string): any;
/**
  * This function process SMA Event and returns the Failure Speech Parameters for SpeakAndGetDigits
  * @param smaEvent
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Failure Speech Parameters
  */
export declare function FailureSpeechParameters(smaEvent: any, SpeechAttributeMap: Map<string, string>, defaultLogger: string): any;
