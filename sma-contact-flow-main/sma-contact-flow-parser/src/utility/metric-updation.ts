import { CloudWatch } from 'aws-sdk';
var cw = new CloudWatch({ apiVersion: '2010-08-01' });

export class UpdateMetricUtil{

/**
  * This function updates the Success or Failure actions metrics to the Cloud Watch for Debugging
  * @param params
  */
async updateMetric(params: any) {
  cw.putMetricData(params, function (err: any, data: any) {
    if (err) {
      console.error("Error", err);
    } else {
      console.log("Success", JSON.stringify(data));
    }
  });
}
}