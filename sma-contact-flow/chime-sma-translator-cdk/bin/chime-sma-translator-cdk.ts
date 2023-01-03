#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ChimeSMATranslatorCdkStack } from '../lib/chime-sma-translator-cdk-stack';
const app = new cdk.App();
new ChimeSMATranslatorCdkStack(app, 'ChimeSMATranslatorCdkStack');
app.synth();
