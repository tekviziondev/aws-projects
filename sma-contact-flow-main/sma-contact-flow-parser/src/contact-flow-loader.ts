import { Connect } from 'aws-sdk';
import { S3 } from 'aws-sdk';

let s3Bucket: string;
const cacheTimeInMilliseconds: number = 3000;

export async function loadContactFlow(amazonConnectInstanceID: string, amazonConnectContactFlowID: string,bucket:string) {  
  console.log("Entering load contact flow");
  s3Bucket=bucket;
  const describeContactFlowParams = {
    ContactFlowId: amazonConnectContactFlowID,
    InstanceId: amazonConnectInstanceID
  };

  let rv = await checkFlowCache(amazonConnectInstanceID, amazonConnectContactFlowID);
  if (rv == null) {
    console.log("Flow cache miss");
    const connect = new Connect();
    const contactFlowResponse = await connect.describeContactFlow(describeContactFlowParams).promise();
    rv = JSON.parse(contactFlowResponse.ContactFlow.Content) as any;
    await writeFlowCache(rv, amazonConnectInstanceID, amazonConnectContactFlowID);
  }
  return rv;
}

async function writeFlowCache(flow: any, amazonConnectInstanceID: string, amazonConnectContactFlowID: string) {
  console.log("Writing flow cache");
  let flowBinary = Buffer.from(JSON.stringify(flow), 'binary');
  const s3Params = {
    Bucket: s3Bucket,
    Key: amazonConnectContactFlowID,
    Body: flowBinary
  }
  const s3 = new S3();
  await s3.putObject(s3Params).promise();
}

async function checkFlowCache(amazonConnectInstanceID: string, amazonConnectContactFlowID: string) {
  let rv: any = null;
  const s3Params = {
    Bucket: s3Bucket,
    Key: amazonConnectContactFlowID
  }
  
  const s3 = new S3();
  try {
    let s3Head = await s3.headObject(s3Params).promise();
    var deltaTimeInMs = new Date().getTime() - s3Head.LastModified.getTime();
    console.log("Delta Time: " + deltaTimeInMs);
    if (deltaTimeInMs < cacheTimeInMilliseconds) {
      console.log("Loading flow from cache");
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
