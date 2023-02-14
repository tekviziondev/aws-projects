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

import * as cdk from 'aws-cdk-lib';
import * as S3 from 'aws-cdk-lib/aws-s3';

import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dotenv from 'dotenv';
import { Attributes } from '../resource/env-variables-intialization'
import * as fs from 'fs';
import { Bucket } from 'aws-cdk-lib/aws-s3/lib';
dotenv.config();

export class ChimeSMATranslatorCdkStack extends cdk.Stack {
  
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
     var params = {
      AreaCode: '757',
      City: 'Virginia Beach',
      Country: 'US',
      MaxResults: '1',
      NextToken: 'abc',
      PhoneNumberType: "Local",
      State: 'Virginia',
      //TollFreePrefix: '
    };
    var Chime = new AWS.Chime();
    Chime.searchAvailablePhoneNumbers(params, function(err:any, data:any) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
    // Role for SMA Lambda Function
    const smaRole = new iam.Role(this, 'ChimeSMATranslatorRoles', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ['chimePolicy']: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: ['*'],
              actions: ['chime:*', 's3:*', 'connect:*', "cloudwatch:PutMetricData",
                "ec2:DescribeVolumes",
                "ec2:DescribeTags",
                "logs:PutLogEvents",
                "logs:DescribeLogStreams",
                "logs:DescribeLogGroups",
                "logs:CreateLogStream",
                "logs:CreateLogGroup", "lex:PostContent",
                "lex:PostText",
                "lex:PutSession",
                "lex:GetSession",
                "lex:DeleteSession",
                "lex:RecognizeText",
                "lex:RecognizeUtterance",
                "lex:StartConversation",
                "lambda:InvokeFunction"],
            }),
          ],
        }),
      },
    });

    const bucket1 = new S3.Bucket(this, 'ChimeSMATranslatorBuckets', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: Attributes.S3_BUCKET,

    });
    //Adding Chime resource policy to the S3 Bucket
    bucket1.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "AmazonChimeAclCheck20170405",
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal("chime.amazonaws.com")],
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [`${bucket1.bucketArn}/*`],
      }),
    );
    //Adding Voiceconnector resource policy to the S3 Bucket
    bucket1.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "SIP media applicationRead",
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal("voiceconnector.chime.amazonaws.com")],
        actions: ['s3:PutObject', 's3:GetObject'],
        resources: [`${bucket1.bucketArn}/*`],
      }),
    );

    //adding failure_audio in S3 Bucket
    var AWS = require('aws-sdk'),
      fs = require('fs');

    // Read in the file, convert it to base64, store to S3
    fs.readFile('./audioFile/FailureAudio.wav', function (err: any, data: any) {
      if (err) { throw err; }
      var base64data = new Buffer(data, 'binary');
      var s3 = new AWS.S3();
      s3.upload({
        Bucket: 'chime-sma-traslator',
        Key: 'FailureAudio.wav',
        Body: base64data,
        ContentType: 'audio/wav',
        ACL: 'public-read'
      }, function (resp: any) {
        console.log(arguments);
        console.log('Successfully uploaded Failure Audio File in S3 Bucket.');
      });

    });
    
    //creating tekvizion's chime-sma-traslator Layer for SMA Lambda function
    const layer = new lambda.LayerVersion(this, 'ChimeSMATranslatorLayer', {
      code: lambda.Code.fromAsset('layers'),
      compatibleArchitectures: [lambda.Architecture.X86_64, lambda.Architecture.ARM_64],
    });
    console.log(Attributes)
    //creating a SMA Lambda function
    const chimeTranslator = new lambda.Function(this, 'ChimeSMATranslatorLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'chimeTranslator.handler',
      insightsVersion: lambda.LambdaInsightsVersion.fromInsightVersionArn(layer.layerVersionArn),
      environment: Attributes,
      role: smaRole
    })

   
    smaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
    new cdk.CfnOutput(this, 'SMA-LambdaFunctionARN', { value: chimeTranslator.functionArn },);
    new cdk.CfnOutput(this, 'SMA-LambdaFunctionName', { value: chimeTranslator.functionName },);
    new cdk.CfnOutput(this, 'S3 Bucket ARN', { value: bucket1.bucketArn },);
    new cdk.CfnOutput(this, 'S3 Bucket Name', { value: bucket1.bucketName },);
    new cdk.CfnOutput(this, 'Layer ARN', { value: layer.layerVersionArn },);
    new cdk.CfnOutput(this, 'Layer Name', { value: 'ChimeSMATranslatorLayer' },);
    
   
  }


}

