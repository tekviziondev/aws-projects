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

import { Connect } from 'aws-sdk';
import { S3 } from 'aws-sdk';
import { CallDetailsUtil } from './utility/call-details'
import { METRIC_PARAMS } from "./const/constant-values"
import { CloudWatchMetric } from "./utility/metric-updation"
import { Attributes } from "./const/constant-values";


let s3Bucket: string;
const cacheTimeInMilliseconds: number = 50000;
const defaultLogger = "SMA-Contact-Flow-Parser | Call ID - "

/**
  * Get the Contact Flow details from Amazon connect.
  * @param smaEvent 
  * @param amazonConnectInstanceID
  */
export async function loadContactFlow(amazonConnectInstanceID: string, amazonConnectContactFlowID: string, bucket: string, smaEvent: any, type: string) {
  let callId: string;
  let metric_type: string;
  let params = METRIC_PARAMS
  try {
    params.MetricData[0].Dimensions[0].Value = amazonConnectInstanceID
    params.MetricData[0].Dimensions[1].Value = amazonConnectContactFlowID
    params.MetricData[0].Dimensions[1].Name = "Contact Flow ID"
    metric_type = "ContactFlow"
    if (type === "Invoke_Module") {
      metric_type = "Module"
      params.MetricData[0].Dimensions[1].Name = 'Module Flow ID'
    }
  } catch (error) {
    console.error(Attributes.DEFAULT_LOGGER + smaEvent.ActionData.Parameters.CallId + Attributes.METRIC_ERROR + error.message);
  }
  // creating cloud watch metric parameters and updating the metric details in cloud watch
  let updateMetric = new CloudWatchMetric();
  try {
    // getting the CallID of the Active call from the SMA Event
    let callDetails = new CallDetailsUtil();
    const legA = callDetails.getLegACallDetails(smaEvent) as any;
    callId = legA.CallId;
    if (!callId)
      callId = smaEvent.ActionData.Parameters.CallId;
    s3Bucket = bucket;
    const describeContactFlowParams = {
      ContactFlowId: amazonConnectContactFlowID,
      InstanceId: amazonConnectInstanceID
    };
    const describeContactFlowModuleParams = {
      InstanceId: amazonConnectInstanceID,
      ContactFlowModuleId: amazonConnectContactFlowID
    };
    // gets the Contact Flow Details from the S3 bucket, if the file updated time difference is less than the cache time defined by the user.
    let rv = await checkFlowCache(amazonConnectInstanceID, amazonConnectContactFlowID, smaEvent);
    if (rv == null) {
      console.log(defaultLogger + callId + " Loading Contact Flow Details from Connect ");
      const connect = new Connect();
      if (type === "Invoke_Module") {
        // using the connect API to get the Module details
        const contactModuleResponse = await connect.describeContactFlowModule(describeContactFlowModuleParams).promise();
        rv = JSON.parse(contactModuleResponse.ContactFlowModule.Content) as any;
        await writeFlowCache(rv, amazonConnectInstanceID, amazonConnectContactFlowID, smaEvent);
      }
      else {
        // using the connect API to get the Contact Flow details
        console.log("Start Connect Flow Loading Time "+ new Date().getMilliseconds())
        const contactFlowResponse = await connect.describeContactFlow(describeContactFlowParams).promise();
        console.log("End Connect Flow Loading Time "+ new Date().getMilliseconds())
        console.log("Start Parsing Time "+ new Date().getMilliseconds())
        rv = JSON.parse(contactFlowResponse.ContactFlow.Content) as any;
        console.log("End Parsing Time "+ new Date().getMilliseconds())
        await writeFlowCache(rv, amazonConnectInstanceID, amazonConnectContactFlowID, smaEvent);
      }

    }
    params.MetricData[0].MetricName = metric_type + "Success"
    updateMetric.updateMetric(params);
    return rv;
  } catch (error) {
    params.MetricData[0].MetricName = metric_type + "Failure"
    updateMetric.updateMetric(params);
    console.error(defaultLogger + callId + " There is an Error in execution of Loading the Contact Flow " + error.message);
    return null;
  }
}


/**
  * Writing the Contact Flow Json Response into S3 Bucket
  * @param smaEvent 
  * @param amazonConnectInstanceID
  */
async function writeFlowCache(flow: any, amazonConnectInstanceID: string, amazonConnectContactFlowID: string, smaEvent: any) {
  let callId: string;
  try {
    // getting the CallID of the Active call from the SMA Event
    let callDetails = new CallDetailsUtil();
    const legA = callDetails.getLegACallDetails(smaEvent) as any;
    callId = legA.CallId;
    if (!callId)
      callId = smaEvent.ActionData.Parameters.CallId;
    console.log(defaultLogger + callId + " Writing Contact flow Details to S3 Bucket ");
    console.log("Start Writing S3  Time "+ new Date().getMilliseconds())
    let flowBinary = Buffer.from(JSON.stringify(flow), 'binary');
    const s3Params = {
      Bucket: s3Bucket,
      Key: amazonConnectContactFlowID,
      Body: flowBinary
    }
    // using S3 bucket api for storing the Contact Flow/Module Data
    const s3 = new S3();
    await s3.putObject(s3Params).promise();
    console.log(" End Writing S3  Time "+ new Date().getMilliseconds())
  } catch (error) {
    console.error(defaultLogger + callId + " There is an Error in execution of Writing Connect flow to S3 Bucket " + error.message);
    return null;
  }
}

/**
  * Checking the updated time of Contact Flow Json Response in S3 Bucket, if the Delta time is less than 5 seconds the function will use the stored JSON response in S3 Bucket else it will return a null value.
  * @param smaEvent 
  * @param amazonConnectInstanceID
  */
async function checkFlowCache(amazonConnectInstanceID: string, amazonConnectContactFlowID: string, smaEvent: any) {
  let rv: any = null;
  const s3Params = {
    Bucket: s3Bucket,
    Key: amazonConnectContactFlowID
  }
  // getting the CallID of the Active call from the SMA Event
  let callDetails = new CallDetailsUtil();
  const legA = callDetails.getLegACallDetails(smaEvent) as any;
  let callId: string;
  callId = legA.CallId;
  if (!callId)
    callId = smaEvent.ActionData.Parameters.CallId;
  const s3 = new S3();
  try {
    let s3Head = await s3.headObject(s3Params).promise();
    // checking the time difference of the last file update 
    var deltaTimeInMs = new Date().getTime() - s3Head.LastModified.getTime();
    console.log(defaultLogger + callId + " Delta Time of Last updated Flow Cache: " + deltaTimeInMs);
    if (deltaTimeInMs < cacheTimeInMilliseconds) {
      let s3Result = await s3.getObject(s3Params).promise();
      rv = JSON.parse(s3Result.Body.toString());
    }
  }
  catch (error) {
    if (error.name === 'NotFound') {
      rv = null;
    }
    else {
      throw error;
    }
  }
  return rv;
}

