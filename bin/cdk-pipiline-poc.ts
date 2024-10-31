#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { CdkPipilinePocStack } from '../lib/cdk-pipiline-poc-stack';
import { CdkSetupCodeStarParameterStack } from '../lib/setup-codestar-stack';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { InitializeCognitoOAuth2Stack } from '../lib/intialize-oath2-cognito-stack';

export interface CDKProps {
    readonly timeout?: number,
    readonly userInitials?: string,
    readonly pipelineName?: string,
    readonly projectFolder?: string,
    readonly codestartId?: string
}
export interface LambdaJavaProps {
    readonly version: string
}
export interface LambdaCodeProps {
    readonly path: string
}
export interface LambdaProps {
    readonly id: string,
    readonly name: string,
    readonly code: LambdaCodeProps,
    readonly handler: string,
    readonly java?: LambdaJavaProps,
    readonly memory?: number,
    readonly xrayEnabled?: boolean,
}
export interface ApiGatewayProps {
    readonly name?: string
}

export interface CognitoDomainProps {
    id: string,
    prefix: string
}

export interface CognitoClientProps {
    name: string
}

export interface CognitoPoolProps {
    id: string,
    name: string,
    domain: CognitoDomainProps,
    client: CognitoClientProps,
    props: cognito.UserPoolClientOptions,
}

export interface CognitoProps {
    pool: CognitoPoolProps
}

export interface OAuth2Props {
    cognito?: CognitoProps
}

export interface ExtraProps {
    readonly cdk?: CDKProps,
    readonly lambda?: LambdaProps,
    readonly apiGateway?: ApiGatewayProps,
    readonly oauth2?: OAuth2Props[]
}


export interface ExtendedProps extends cdk.StackProps {
    extra?: ExtraProps
}

const Context:ExtendedProps = {
    env: {
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
 * 
 **/
new CdkSetupCodeStarParameterStack(app, 'CdkSetupCodeStarParameterStack', Context);


/**
 * Setup Cognito
 */
new InitializeCognitoOAuth2Stack(app, "InitializeCognitoOAuth2Stack", Context)

/**
 * 
 * cdk deploy CdkPipilinePocStack
 * 
 */
new CdkPipilinePocStack(app, 'CdkPipilinePocStack', Context);
