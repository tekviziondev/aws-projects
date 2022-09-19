"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadContactFlow = void 0;
const aws_sdk_1 = require("aws-sdk");
const aws_sdk_2 = require("aws-sdk");
let s3Bucket;
const cacheTimeInMilliseconds = 5000;
function loadContactFlow(amazonConnectInstanceID, amazonConnectContactFlowID, bucket) {
    return __awaiter(this, void 0, void 0, function* () {
        s3Bucket = bucket;
        const describeContactFlowParams = {
            ContactFlowId: amazonConnectContactFlowID,
            InstanceId: amazonConnectInstanceID
        };
        let rv = yield checkFlowCache(amazonConnectInstanceID, amazonConnectContactFlowID);
        if (rv == null) {
            console.log("Loading Contact Flow Details from Connect ");
            const connect = new aws_sdk_1.Connect();
            const contactFlowResponse = yield connect.describeContactFlow(describeContactFlowParams).promise();
            rv = JSON.parse(contactFlowResponse.ContactFlow.Content);
            yield writeFlowCache(rv, amazonConnectInstanceID, amazonConnectContactFlowID);
        }
        return rv;
    });
}
exports.loadContactFlow = loadContactFlow;
function writeFlowCache(flow, amazonConnectInstanceID, amazonConnectContactFlowID) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Writing Contact flow Details to S3 Bucket ");
        let flowBinary = Buffer.from(JSON.stringify(flow), 'binary');
        const s3Params = {
            Bucket: s3Bucket,
            Key: amazonConnectContactFlowID,
            Body: flowBinary
        };
        const s3 = new aws_sdk_2.S3();
        yield s3.putObject(s3Params).promise();
    });
}
function checkFlowCache(amazonConnectInstanceID, amazonConnectContactFlowID) {
    return __awaiter(this, void 0, void 0, function* () {
        let rv = null;
        const s3Params = {
            Bucket: s3Bucket,
            Key: amazonConnectContactFlowID
        };
        const s3 = new aws_sdk_2.S3();
        try {
            let s3Head = yield s3.headObject(s3Params).promise();
            var deltaTimeInMs = new Date().getTime() - s3Head.LastModified.getTime();
            console.log("Delta Time of Last updated Flow Cache: " + deltaTimeInMs);
            if (deltaTimeInMs < cacheTimeInMilliseconds) {
                console.log("Loading Contact Flow from Flow cache");
                let s3Result = yield s3.getObject(s3Params).promise();
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
    });
}
