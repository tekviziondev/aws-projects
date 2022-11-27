import { Connect } from 'aws-sdk';
import { S3 } from 'aws-sdk';
import { getLegACallDetails } from './utility/call-details'
import { METRIC_PARAMS } from "./const/constant-values"
import { updateMetric } from "./utility/metric-updation"
import { Attributes } from "./const/constant-values";

let s3Bucket: string;
const cacheTimeInMilliseconds: number = 5000;
const defaultLogger = "SMA-Contact-Flow-Parser | Call ID - "

/**
  * Get the contact flow details from the Amazon connect.
  * @param smaEvent 
  * @param action
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns Process Flow Action
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
    console.error(Attributes.DEFAULT_LOGGER + smaEvent.ActionData.Parameters.CallId+ Attributes.METRIC_ERROR + error.message);
  }
 

  try {
    const legA = getLegACallDetails(smaEvent);
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
    let rv = await checkFlowCache(amazonConnectInstanceID, amazonConnectContactFlowID, smaEvent);
    if (rv == null) {
      console.log(defaultLogger + callId + " Loading Contact Flow Details from Connect ");
      const connect = new Connect();
      if (type === "Invoke_Module") {
        const contactModuleResponse = await connect.describeContactFlowModule(describeContactFlowModuleParams).promise();
        rv = JSON.parse(contactModuleResponse.ContactFlowModule.Content) as any;
        await writeFlowCache(rv, amazonConnectInstanceID, amazonConnectContactFlowID, smaEvent);
      }
      else {
        const contactFlowResponse = await connect.describeContactFlow(describeContactFlowParams).promise();
        rv = JSON.parse(contactFlowResponse.ContactFlow.Content) as any;
        await writeFlowCache(rv, amazonConnectInstanceID, amazonConnectContactFlowID, smaEvent);
      }

    }
    params.MetricData[0].MetricName = metric_type + "Success"
    updateMetric(params);
    return rv;
  } catch (error) {
    params.MetricData[0].MetricName = metric_type + "Failure"
    updateMetric(params);
    console.error(defaultLogger + callId + " There is an Error in execution of Loading the Contact Flow " + error.message);
    return null;
  }
}


/**
  * Writing the Contact Flow Json Response into S3 Bucket
  * @param smaEvent 
  * @param action
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns Process Flow Action
  */
async function writeFlowCache(flow: any, amazonConnectInstanceID: string, amazonConnectContactFlowID: string, smaEvent: any) {
  let callId: string;
  try {
    const legA = getLegACallDetails(smaEvent);
    callId = legA.CallId;
    if (!callId)
      callId = smaEvent.ActionData.Parameters.CallId;
    console.log(defaultLogger + callId + " Writing Contact flow Details to S3 Bucket ");
    let flowBinary = Buffer.from(JSON.stringify(flow), 'binary');
    const s3Params = {
      Bucket: s3Bucket,
      Key: amazonConnectContactFlowID,
      Body: flowBinary
    }
    const s3 = new S3();
    await s3.putObject(s3Params).promise();
  } catch (error) {
    console.error(defaultLogger + callId + " There is an Error in execution of Writing Connect flow to S3 Bucket " + error.message);
    return null;
  }
}

/**
  * Checking the updated time of Contact Flow Json Response in S3 Bucket, if the Delta time is less than 5 seconds the function will use the stored JSON response in S3 Bucket else it will return null value.
  * @param smaEvent 
  * @param action
  * @param amazonConnectInstanceID
  * @param bucketName
  * @returns Process Flow Action
  */
async function checkFlowCache(amazonConnectInstanceID: string, amazonConnectContactFlowID: string, smaEvent: any) {
  let rv: any = null;
  const s3Params = {
    Bucket: s3Bucket,
    Key: amazonConnectContactFlowID
  }
  const legA = getLegACallDetails(smaEvent);
  let callId: string;
  callId = legA.CallId;
  if (!callId)
    callId = smaEvent.ActionData.Parameters.CallId;
  const s3 = new S3();
  try {
    let s3Head = await s3.headObject(s3Params).promise();
    var deltaTimeInMs = new Date().getTime() - s3Head.LastModified.getTime();
    console.log(defaultLogger + callId + " Delta Time of Last updated Flow Cache: " + deltaTimeInMs);
    if (deltaTimeInMs < cacheTimeInMilliseconds) {
      console.log(defaultLogger + callId + " Loading Contact Flow from Flow cache");
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

