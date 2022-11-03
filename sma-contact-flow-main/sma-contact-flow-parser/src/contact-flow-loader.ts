import { Connect } from 'aws-sdk';
import { S3 } from 'aws-sdk';
import { getLegACallDetails } from './utility/call-details'

let s3Bucket: string;
const cacheTimeInMilliseconds: number = 5000;
const defaultLogger = "SMA-Contact-Flow-Parser | Call ID - "

export async function loadContactFlow(amazonConnectInstanceID: string, amazonConnectContactFlowID: string, bucket: string, smaEvent: any, type: string) {
  let callId: string;
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
    return rv;
  } catch (error) {
    console.error(defaultLogger + callId + " There is an Error in execution of Loading the Contact Flow " + error.message);
    return null;
  }
}

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

async function checkFlowCache(amazonConnectInstanceID: string, amazonConnectContactFlowID: string, smaEvent: any) {
  let rv: any = null;
  const s3Params = {
    Bucket: s3Bucket,
    Key: amazonConnectContactFlowID
  }
  const legA = getLegACallDetails(smaEvent);
  let callId: string;
  callId = legA.CallId;
  if (callId == "NaN")
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

