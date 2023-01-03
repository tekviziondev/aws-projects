import * as cdk from 'aws-cdk-lib';
import * as S3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dotenv from 'dotenv';
import {Attributes} from '../resource/env-variables-intialization'
dotenv.config();

export class ChimeSMATranslatorCdkStack extends cdk.Stack {

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // Role for SMA Lambda Function
    const smaRole = new iam.Role(this, 'ChimeSMATranslatorRoles', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ['chimePolicy']: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: ['*'],
              actions: ['chime:*', 's3:*','connect:*',"cloudwatch:PutMetricData",
              "ec2:DescribeVolumes",
              "ec2:DescribeTags",
              "logs:PutLogEvents",
              "logs:DescribeLogStreams",
              "logs:DescribeLogGroups",
              "logs:CreateLogStream",
              "logs:CreateLogGroup","lex:PostContent",
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
    
    //Checking if the FLOW_CACHE_S3_BUCKET and CALL_RECORDINGS_S3_BUCKET are same or not
    if(Attributes.FLOW_CACHE_S3_BUCKET==Attributes.CALL_RECORDINGS_S3_BUCKET){
      const bucket1 = new S3.Bucket(this, 'ChimeSMATranslatorBuckets', {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        bucketName: Attributes.FLOW_CACHE_S3_BUCKET,
        
      });
      //Adding Chime resource policy to the S3 Bucket
      bucket1.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: "AmazonChimeAclCheck20170405",
          effect: iam.Effect.ALLOW,
          principals: [new iam.ServicePrincipal("chime.amazonaws.com")],
          actions: ['s3:GetObject','s3:PutObject'],
          resources: [`${bucket1.bucketArn}/*`],
        }),
      );
      //Adding Voiceconnector resource policy to the S3 Bucket
      bucket1.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: "SIP media applicationRead",
          effect: iam.Effect.ALLOW,
          principals: [new iam.ServicePrincipal("voiceconnector.chime.amazonaws.com")],
          actions: ['s3:PutObject'],
          resources: [`${bucket1.bucketArn}/*`],
        }),
      );
    }
    else{
      const bucket1 = new S3.Bucket(this, 'ChimeSMATranslatorBuckets', {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        bucketName: Attributes.FLOW_CACHE_S3_BUCKET,
      });
      const bucket2 = new S3.Bucket(this, 'ChimeSMATranslatorBuckets', {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        bucketName: Attributes.CALL_RECORDINGS_S3_BUCKET,
      });
      //Adding Chime resource policy to the S3 Bucket
      bucket1.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: "AmazonChimeAclCheck20170405",
          effect: iam.Effect.ALLOW,
          principals: [new iam.ServicePrincipal("chime.amazonaws.com")],
          actions: ['s3:GetObject','s3:PutObject'],
          resources: [`${bucket1.bucketArn}/*`],
        }),
      );
      //Adding Voiceconnector resource policy to the S3 Bucket
      bucket2.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: "SIP media applicationRead",
          effect: iam.Effect.ALLOW,
          principals: [new iam.ServicePrincipal("voiceconnector.chime.amazonaws.com")],
          actions: ['s3:PutObject'],
          resources: [`${bucket2.bucketArn}/*`],
        }),
      );
    }

    //creating tekvizion's chime-sma-traslator Layer for SMA Lambda function
    const layer=new lambda.LayerVersion(this, 'ChimeSMATranslatorLayer', {
      code: lambda.Code.fromAsset('layers'),
      compatibleArchitectures: [lambda.Architecture.X86_64, lambda.Architecture.ARM_64],
    });
    
    //creating a SMA Lambda function
      const chimeTranslator = new lambda.Function(this, 'ChimeSMATranslatorLambda',{
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'chimeTranslator.handler',
      insightsVersion: lambda.LambdaInsightsVersion.fromInsightVersionArn(layer.layerVersionArn),
      environment: Attributes,
      role:smaRole
     })
     smaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
     new cdk.CfnOutput(this, 'SMA-LambdaFunctionARN', { value: chimeTranslator.functionArn },);
     new cdk.CfnOutput(this, 'SMA-LambdaFunctionName', { value: chimeTranslator.functionName },);
    }
  
   
  }
  
