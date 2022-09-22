"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadContactFlow = void 0;
const aws_sdk_1 = require("aws-sdk");
const aws_sdk_2 = require("aws-sdk");
let s3Bucket;
const cacheTimeInMilliseconds = 5000;
async function loadContactFlow(amazonConnectInstanceID, amazonConnectContactFlowID, bucket) {
    s3Bucket = bucket;
    const describeContactFlowParams = {
        ContactFlowId: amazonConnectContactFlowID,
        InstanceId: amazonConnectInstanceID
    };
    let rv = await checkFlowCache(amazonConnectInstanceID, amazonConnectContactFlowID);
    if (rv == null) {
        console.log("Loading Contact Flow Details from Connect ");
        const connect = new aws_sdk_1.Connect();
        const contactFlowResponse = await connect.describeContactFlow(describeContactFlowParams).promise();
        rv = JSON.parse(contactFlowResponse.ContactFlow.Content);
        await writeFlowCache(rv, amazonConnectInstanceID, amazonConnectContactFlowID);
    }
    return rv;
}
exports.loadContactFlow = loadContactFlow;
async function writeFlowCache(flow, amazonConnectInstanceID, amazonConnectContactFlowID) {
    console.log("Writing Contact flow Details to S3 Bucket ");
    let flowBinary = Buffer.from(JSON.stringify(flow), 'binary');
    const s3Params = {
        Bucket: s3Bucket,
        Key: amazonConnectContactFlowID,
        Body: flowBinary
    };
    const s3 = new aws_sdk_2.S3();
    await s3.putObject(s3Params).promise();
}
async function checkFlowCache(amazonConnectInstanceID, amazonConnectContactFlowID) {
    let rv = null;
    const s3Params = {
        Bucket: s3Bucket,
        Key: amazonConnectContactFlowID
    };
    const s3 = new aws_sdk_2.S3();
    try {
        let s3Head = await s3.headObject(s3Params).promise();
        var deltaTimeInMs = new Date().getTime() - s3Head.LastModified.getTime();
        console.log("Delta Time of Last updated Flow Cache: " + deltaTimeInMs);
        if (deltaTimeInMs < cacheTimeInMilliseconds) {
            console.log("Loading Contact Flow from Flow cache");
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
