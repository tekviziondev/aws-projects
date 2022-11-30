"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudWatchMetric = void 0;
const constant_values_1 = require("../const/constant-values");
const constant_values_2 = require("../const/constant-values");
const aws_sdk_1 = require("aws-sdk");
var cw = new aws_sdk_1.CloudWatch({ apiVersion: '2010-08-01' });
class CloudWatchMetric {
    /**
    * create the metric parameter based on the contextstore
    * @param smaEvent
    * @param contextStore
    * @returns metric params
    */
    createParams(contextStore, smaEvent) {
        let params = constant_values_2.METRIC_PARAMS;
        try {
            params.MetricData[0].Dimensions[0].Value = contextStore.ContextAttributes['$.InstanceARN'];
            if (contextStore['InvokeModuleARN']) {
                params.MetricData[0].Dimensions[1].Name = 'Module Flow ID';
                params.MetricData[0].Dimensions[1].Value = contextStore['InvokeModuleARN'];
            }
            else if (contextStore['TransferFlowARN']) {
                params.MetricData[0].Dimensions[1].Name = 'Contact Flow ID';
                params.MetricData[0].Dimensions[1].Value = contextStore['TransferFlowARN'];
            }
            else {
                params.MetricData[0].Dimensions[1].Name = 'Contact Flow ID';
                params.MetricData[0].Dimensions[1].Value = contextStore['ActualFlowARN'];
            }
            return params;
        }
        catch (error) {
            if (smaEvent.ActionData.Parameters)
                console.error(constant_values_1.Attributes.DEFAULT_LOGGER + smaEvent.ActionData.Parameters.CallId + constant_values_1.Attributes.METRIC_ERROR + error.message);
            return params;
        }
    }
    /**
      * This function updates the Success or Failure actions metrics to the Cloud Watch for Debugging
      * @param params
      */
    updateMetric(params) {
        cw.putMetricData(params, function (err, data) {
            if (err) {
                console.error("Error", err);
            }
            else {
                console.log("Success", JSON.stringify(data));
            }
        });
    }
}
exports.CloudWatchMetric = CloudWatchMetric;
