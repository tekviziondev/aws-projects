/**
  * This function process SMA Event and returns the Speech Parameters for SpeakAndGetDigits
  * @param smaEvent
  * @param action
  * @param contextAttributs
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Speech Parameters
  */
export declare function getAudioParameters(smaEvent: any, action: any, defaultLogger: string): any;
/**
  * This function process SMA Event and returns the Failure Audio Parameters for SpeakAndGetDigits
  * @param smaEvent
  * @param SpeechAttributeMap
  * @param defaultLogger
  * @returns Failure Speech Parameters
  */
export declare function failureAudioParameters(smaEvent: any, action: any, defaultLogger: string): any;
