#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkPipilinePocStack } from '../lib/cdk-pipiline-poc-stack';
import { CdkSetupCodeStarParameterStack } from '../lib/setup-codestar-stack';

const EnvContext: cdk.StackProps = {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
        //@ts-ignore
        userInitials: CdkSetupCodeStarParameterStack.ENV_USER_INITIALS,
        //@ts-ignore
        pipelineName: CdkSetupCodeStarParameterStack.ENV_PIPELINE_NAME,
         //@ts-ignore
        projectFolder: process.env.CDK_PROJECT_FOLDER,
         //@ts-ignore
        codestarid: process.env.CDK_CODESTAR_ID   
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
 * 
 **/
export const init = new CdkSetupCodeStarParameterStack(app, 'CdkSetupCodeStarParameterStack', EnvContext);

/**
 * 
 * cdk deploy CdkPipilinePocStack
 * 
 */
export const deploy = new CdkPipilinePocStack(app, 'CdkPipilinePocStack', EnvContext);


export default deploy;



