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

import {  Stack } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {
  ServicePrincipal,
  Role,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
} from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import {
  ChimeSipMediaApp,
  ChimeSipRule,
  ChimePhoneNumber,
  PhoneProductType,
  PhoneNumberType,
  TriggerType,
  PhoneCountry,
  
} from 'cdk-amazon-chime-resources';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
import { isValid } from './country';

interface PSTNAudioProps {
  readonly smaBucket: Bucket;
}
dotenv.config();

export class PSTNAudio extends Construct {
  public smaId: string;
  public smaPhoneNumber: string;
  public connectARN=(process.env.Connect_arn as string);
  public areaCode=parseInt(process.env.Area_code as string);
  public repeat= (process.env.NO_OF_TIMES_REPEAT as string)
  public country=(process.env.Country as any);
  public Country:PhoneCountry= isValid(this.country);
 
// Check if the .env value is in the enum
  

  constructor(scope: Construct, id: string, props: PSTNAudioProps) {
    super(scope, id);
    //const country=process.env.Country as any;
    
   
    const smaLambdaRole = new Role(this, 'smaLambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ['chimePolicy']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: ['*'],
              actions: [
                'connect:DescribeContactFlowModule',
                'connect:DescribeContactFlow',
                'lex:putSession',
                'cloudwatch:PutMetricData',
                "lambda:InvokeFunction"
              ],
            }),
          ],
        }),
      },
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    });

    //creating tekvizion's chime-sma-traslator Layer for SMA Lambda function
    const layer = new lambda.LayerVersion(this, 'ChimeSMATranslatorLayer', {
      code: lambda.Code.fromAsset('layers'),
      compatibleArchitectures: [lambda.Architecture.X86_64, lambda.Architecture.ARM_64],
    });
    
    //creating a SMA Lambda function
    const chimeTranslator = new lambda.Function(this, 'ChimeSMATranslatorLambda', {
      runtime: lambda.Runtime.NODEJS_16_X,
      
      code: lambda.Code.fromAsset('lambda'),
      handler: 'chimeTranslator.handler',
      insightsVersion: lambda.LambdaInsightsVersion.fromInsightVersionArn(layer.layerVersionArn),
      environment: {
            REGION: Stack.of(this).region,
            FAILURE_SPEECH_SSML:
              '<speak> We\'re sorry. We didn\'t get that. Please try again. <break time="200ms"/></speak>',
            FAILURE_AUDIO_FILE_LOCATION: `s3://${props.smaBucket.bucketName}/FailureAudio.wav`,
            S3_BUCKET: props.smaBucket.bucketName,
            CONNECT_ARN: this.connectARN,
            NO_OF_TIMES_REPEAT : this.repeat,
            RINBACK_AUDIO_LOCATION :  `s3://${props.smaBucket.bucketName}/RingBack.wav`,

          },
      role: smaLambdaRole
    })

    props.smaBucket.grantReadWrite(smaLambdaRole);

    const sipMediaApp = new ChimeSipMediaApp(this, 'SipMediaApplication', {
      endpoint: chimeTranslator.functionArn,
      region: Stack.of(this).region,
    });

    const phoneNumber = new ChimePhoneNumber(this, 'PhoneNumber', {
      phoneAreaCode: this.areaCode,
      phoneNumberType: PhoneNumberType.LOCAL,
      phoneProductType: PhoneProductType.SMA,
      phoneCountry: this.Country
    });

    new ChimeSipRule(this, 'SipRule', {
      triggerType: TriggerType.TO_PHONE_NUMBER,
      triggerValue: phoneNumber.phoneNumber,
      targetApplications: [
        {
          region: Stack.of(this).region,
          priority: 1,
          sipMediaApplicationId: sipMediaApp.sipMediaAppId,
        },
      ],
    });

    this.smaId = sipMediaApp.sipMediaAppId;
    this.smaPhoneNumber = phoneNumber.phoneNumber;
  }
}
