#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkPipilinePocStack } from '../lib/cdk-pipiline-poc-stack';
import { CdkSetupCodeStarParameterStack } from '../lib/setup-codestar-stack';

const EnvContext = {
    env: {
        foldername: process.env.CDK_SUBFOLDER_NAME,
        codestarid: process.env.CDK_CODESTAR_ID,
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION

    }
};


const app = new cdk.App();
/**
 * 
 * Basically the following sets up AWS Systems Manager (SSM) Parameter Store 
 * with codestar parameters. 
 * 
 * aws ssm put-parameter --name "/cdkpipelinepoc/matlab/codestarid" --value "your-codestar-connection-id" --type "String"
 * aws ssm put-parameter --name "/cdkpipelinepoc/matlab/account" --value "your-account-id" --type "String"
 * aws ssm put-parameter --name "/cdkpipelinepoc/matlab/region" --value "your-region" --type "String"
 * aws ssm put-parameter --name "/cdkpipelinepoc/matlab/sbprjfoldername" --value "your-subproject-folder-name" --type "String"
 * 
 * cdk deploy CdkSetupCodeStarParameterStack
 **/
new CdkSetupCodeStarParameterStack(app, 'CdkSetupCodeStarParameterStack', EnvContext);


/**
 * cdk deploy CdkPipilinePocStack
 * 
 */
new CdkPipilinePocStack(app, 'CdkPipilinePocStack', EnvContext);



