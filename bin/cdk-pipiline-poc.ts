#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkPipilinePocStack } from '../lib/cdk-pipiline-poc-stack';

const app = new cdk.App();
new CdkPipilinePocStack(app, 'CdkPipilinePocStack');
