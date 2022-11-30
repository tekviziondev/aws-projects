import { Attributes } from "../const/constant-values";
import { IContextStore } from "../const/context-store";
import { METRIC_PARAMS } from "../const/constant-values"
import { CloudWatch } from 'aws-sdk';
var cw = new CloudWatch({ apiVersion: '2010-08-01' });
export class CloudWatchMetric {

  /**
  * create the metric parameter based on the contextstore
  * @param smaEvent 
  * @param contextStore
  * @returns metric params
  */
  createParams(contextStore: IContextStore, smaEvent: any) {
    let params = METRIC_PARAMS
    try {
      params.MetricData[0].Dimensions[0].Value = contextStore.ContextAttributes['$.InstanceARN']
      if (contextStore['InvokeModuleARN']) {
        params.MetricData[0].Dimensions[1].Name = 'Module Flow ID'
        params.MetricData[0].Dimensions[1].Value = contextStore['InvokeModuleARN']
      }
      else if (contextStore['TransferFlowARN']) {
        params.MetricData[0].Dimensions[1].Name = 'Contact Flow ID'
        params.MetricData[0].Dimensions[1].Value = contextStore['TransferFlowARN']
      }
      else {
        params.MetricData[0].Dimensions[1].Name = 'Contact Flow ID'
        params.MetricData[0].Dimensions[1].Value = contextStore['ActualFlowARN']
      }
      return params;
    } catch (error) {
      if (smaEvent.ActionData.Parameters)
        console.error(Attributes.DEFAULT_LOGGER + smaEvent.ActionData.Parameters.CallId + Attributes.METRIC_ERROR + error.message);
      return params;
    }
  }

  /**
    * This function updates the Success or Failure actions metrics to the Cloud Watch for Debugging
    * @param params
    */
  updateMetric(params: any) {
    cw.putMetricData(params, function (err: any, data: any) {
      if (err) {
        console.error("Error", err);
      } else {
        console.log("Success", JSON.stringify(data));
      }
    });
  }


}