/*
Copyright (c) 2023 tekVizion PVS, Inc. 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { RemovalPolicy } from 'aws-cdk-lib';
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export class S3Resources extends Construct {
  public smaBucket: Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.smaBucket = new Bucket(this, 'smaBucket', {
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const outboundWavBucketPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['s3:GetObject', 's3:PutObject', 's3:PutObjectAcl'],
      principals: [new ServicePrincipal('voiceconnector.chime.amazonaws.com')],
      resources: [this.smaBucket.bucketArn, `${this.smaBucket.bucketArn}/*`],
      sid: 'SIPMediaApplicationRead',
    });

    this.smaBucket.addToResourcePolicy(outboundWavBucketPolicy);

    new BucketDeployment(this, 'smaBucketDeployment', {
      sources: [Source.asset('./wavFiles')],
      destinationBucket: this.smaBucket,
      contentType: 'audio/wav',
    });
  }
}
