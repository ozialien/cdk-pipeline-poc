#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkPipilinePocStack } from '../lib/cdk-pipiline-poc-stack';

const app = new cdk.App();
new CdkPipilinePocStack(app, 'CdkPipilinePocStack', {
    env:{
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    },
    codeStarId: "a96e8694-d581-49b7-a402-7eb4aa97fe00",
    sbLambdaPrjFldrName: "product-catalog-sb-api",
});
