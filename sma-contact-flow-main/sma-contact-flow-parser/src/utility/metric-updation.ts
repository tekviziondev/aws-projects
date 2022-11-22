import {CloudWatch} from 'aws-sdk';
var cw = new CloudWatch({apiVersion: '2010-08-01'});

export function updateMetric(params:any){
    cw.putMetricData(params, function(err: any, data: any) {
        if (err) {
          console.log("Error", err);
        } else {
          console.log("Success", JSON.stringify(data));
        }
      });
}