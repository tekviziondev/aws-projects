"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadContactFlow = void 0;
const aws_sdk_1 = require("aws-sdk");
const aws_sdk_2 = require("aws-sdk");
let s3Bucket;
const cacheTimeInMilliseconds = 5000;
const defaultLogger = "SMA-Contact-Flow-Parser | Call ID - ";
async function loadContactFlow(amazonConnectInstanceID, amazonConnectContactFlowID, bucket, smaEvent, type) {
    const legA = getLegACallDetails(smaEvent);
    let callId;
    callId = legA.CallId;
    if (callId == "NaN")
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
        const connect = new aws_sdk_1.Connect();
        if (type === "Invoke_Module") {
            const contactModuleResponse = await connect.describeContactFlowModule(describeContactFlowModuleParams).promise();
            rv = JSON.parse(contactModuleResponse.ContactFlowModule.Content);
            await writeFlowCache(rv, amazonConnectInstanceID, amazonConnectContactFlowID, smaEvent);
        }
        else {
            const contactFlowResponse = await connect.describeContactFlow(describeContactFlowParams).promise();
            rv = JSON.parse(contactFlowResponse.ContactFlow.Content);
            await writeFlowCache(rv, amazonConnectInstanceID, amazonConnectContactFlowID, smaEvent);
        }
    }
    return rv;
}
exports.loadContactFlow = loadContactFlow;
async function writeFlowCache(flow, amazonConnectInstanceID, amazonConnectContactFlowID, smaEvent) {
    const legA = getLegACallDetails(smaEvent);
    let callId;
    callId = legA.CallId;
    if (callId == "NaN")
        callId = smaEvent.ActionData.Parameters.CallId;
    console.log(defaultLogger + callId + " Writing Contact flow Details to S3 Bucket ");
    let flowBinary = Buffer.from(JSON.stringify(flow), 'binary');
    const s3Params = {
        Bucket: s3Bucket,
        Key: amazonConnectContactFlowID,
        Body: flowBinary
    };
    const s3 = new aws_sdk_2.S3();
    await s3.putObject(s3Params).promise();
}
async function checkFlowCache(amazonConnectInstanceID, amazonConnectContactFlowID, smaEvent) {
    let rv = null;
    const s3Params = {
        Bucket: s3Bucket,
        Key: amazonConnectContactFlowID
    };
    const legA = getLegACallDetails(smaEvent);
    let callId;
    callId = legA.CallId;
    if (callId == "NaN")
        callId = smaEvent.ActionData.Parameters.CallId;
    const s3 = new aws_sdk_2.S3();
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
function getLegACallDetails(event) {
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
}
