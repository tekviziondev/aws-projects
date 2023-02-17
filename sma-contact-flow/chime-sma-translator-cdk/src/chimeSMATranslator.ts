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

import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PSTNAudio, S3Resources } from '.';
import * as dotenv from 'dotenv';


dotenv.config();
export class chimeSMATranslator extends Stack {
  
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    if(process.env.Connect_arn == '') {
      console.log('Connect_arn value is empty in .env file, configure the value ');
      process.exit(1);
    } 
    if(process.env.Country == '') {
      console.log('Country value is empty in .env file, configure the value ');
      process.exit(1);
    } 
    if(process.env.Area_code == '') {
      console.log('Area_code value is empty in .env file, configure the value ');
      process.exit(1);
    } 
    

    super(scope, id, props);

    const s3Resources = new S3Resources(this, 'S3Resoruces');

    const pstnAudio = new PSTNAudio(this, 'PSTNAudio', {
      smaBucket: s3Resources.smaBucket,
    });

    new CfnOutput(this, 'pstnPhoneNumber', {
      value: pstnAudio.smaPhoneNumber,
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new chimeSMATranslator(app, 'chimeSMATranslator', { env: devEnv });

app.synth();
