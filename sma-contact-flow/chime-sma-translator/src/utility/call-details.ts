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


export class CallDetailsUtil {

  /**
    * This Method process SMA Event and returns the Call Details like "From Phone number" and "To Phone Number"
    * @param event 
    */
  getLegACallDetails(event: any): Promise<any> {
    try {
      let rv = null;
      if (event && event.CallDetails && event.CallDetails.Participants && event.CallDetails.Participants.length > 0) {
        for (let i = 0; i < event.CallDetails.Participants.length; i++) {
          if (event.CallDetails.Participants[i].ParticipantTag === 'LEG-A') {
            rv = event.CallDetails.Participants[i];
            break;
          }
        }
      }
      return rv;
    } catch (error) {
      console.error(" There is an error in execution of getting the call Details" + error.message);
    }
  }

   /**
    * This Method process SMA Event and returns the Call Details like "From Phone number" and "To Phone Number"
    * @param event 
    */
   getLegBCallDetails(event: any): Promise<any> {
    try {
      let rv = null;
      if (event && event.CallDetails && event.CallDetails.Participants && event.CallDetails.Participants.length > 0) {
        for (let i = 0; i < event.CallDetails.Participants.length; i++) {
          if (event.CallDetails.Participants[i].ParticipantTag === 'LEG-B') {
            rv = event.CallDetails.Participants[i];
            break;
          }
        }
      }
      return rv;
    } catch (error) {
      console.error(" There is an error in execution of getting the call Details" + error.message);
    }
  }

  /**
    * This Method returns Contact Flow Action object from the list of actions, based on the Action ID 
    * @param actions
    * @param identifier
    * @returns Contact Flow Action ID
    */
  findActionObjectByID(actions: any[], identifier: string) {
    return actions.find((action: any) => action.Identifier === identifier);
  }
}