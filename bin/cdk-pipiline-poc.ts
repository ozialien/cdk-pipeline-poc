#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkPipilinePocStack } from '../lib/cdk-pipiline-poc-stack';
import { CdkSetupCodeStarParameterStack } from '../lib/setup-codestar-stack';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface CDKProps {
    readonly timeout?: cdk.Duration,
    readonly userInitials?: string,
    readonly pipelineName?: string,
    readonly projectFolder?: string,
    readonly codestarid?: string
}
export interface LambdaJavaProps {
    readonly version?: lambda.Runtime
}

export interface LambdaProps {
    readonly id?: string,
    readonly name?: string,
    readonly code?: lambda.AssetCode,
    readonly handler?: string,
    readonly java?: LambdaJavaProps,
    readonly memory?: number
}
export interface ApiGatewayProps {
    readonly name?: string
}

export interface ExtraStackProps {
    readonly cdk?: CDKProps,
    readonly lambda?: LambdaProps,
    readonly apiGateway?: ApiGatewayProps
}

export interface MatsonEnvironment extends cdk.Environment, ExtraStackProps { }

const EnvContext: MatsonEnvironment = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
    cdk: {
        timeout: cdk.Duration.seconds(30),
        userInitials: CdkSetupCodeStarParameterStack.ENV_USER_INITIALS,
        pipelineName: CdkSetupCodeStarParameterStack.ENV_PIPELINE_NAME,
        projectFolder: process.env.CDK_PROJECT_FOLDER,
        codestarid: process.env.CDK_CODESTAR_ID,
    },
    apiGateway: {
        name: ''
    },
    lambda: {
        id: 'SpringBootApiLambdaCdkPoc',
        name: 'ProductCatalogSbApiLambda',
        code: lambda.Code.fromAsset("product-catalog-sb-api/target/product-catalog-sb-api-0.0.1-SNAPSHOT.jar"),
        handler: "poc.amitk.lambda.sb.api.infra.StreamLambdaHandler::handleRequest",
        java: {
            'version': lambda.Runtime.JAVA_21
        },
        memory: 2048
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
export const init = new CdkSetupCodeStarParameterStack(app, 'CdkSetupCodeStarParameterStack', {env: EnvContext});

/**
 * 
 * cdk deploy CdkPipilinePocStack
 * 
 */
export const deploy = new CdkPipilinePocStack(app, 'CdkPipilinePocStack', {env: EnvContext});


export default deploy;



