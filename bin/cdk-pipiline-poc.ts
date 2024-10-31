#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { CdkPipilinePocStack } from '../lib/cdk-pipiline-poc-stack';
import { CdkSetupCodeStarParameterStack } from '../lib/setup-codestar-stack';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface CDKProps {
    readonly timeout?: cdk.Duration,
    readonly userInitials?: string,
    readonly pipelineName?: string,
    readonly projectFolder?: string,
    readonly codestartId?: string
}
export interface LambdaJavaProps {
    readonly version: lambda.Runtime
}

export interface LambdaProps {
    readonly id: string,
    readonly name: string,
    readonly code: lambda.AssetCode,
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

export interface ExtraStackProps {
    readonly cdk?: CDKProps,
    readonly lambda?: LambdaProps,
    readonly apiGateway?: ApiGatewayProps,
    readonly oauth2?: OAuth2Props[]
}

export interface MatsonEnvironment extends cdk.Environment, ExtraStackProps { }

export const EnvContext: MatsonEnvironment = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
    cdk: {
        timeout: cdk.Duration.seconds(30),
        userInitials: CdkSetupCodeStarParameterStack.ENV_USER_INITIALS,
        pipelineName: CdkSetupCodeStarParameterStack.ENV_PIPELINE_NAME,
        projectFolder: process.env.CDK_PROJECT_FOLDER ? process.env.CDK_PROJECT_FOLDER : 'product-catalog-sb-api',
        codestartId: process.env.CDK_CODESTAR_ID ? process.env.CDK_CODESTAR_ID : 'a96e8694-d581-49b7-a402-7eb4aa97fe00',
    },
    apiGateway: {
        name: 'ProductCatalogSbApi'
    },
    lambda: {
        id: 'SpringBootApiLambdaCdkPoc',
        name: 'ProductCatalogSbApiLambda',
        code: lambda.Code.fromAsset("product-catalog-sb-api/target/product-catalog-sb-api-0.0.1-SNAPSHOT.jar"),
        handler: "poc.amitk.lambda.sb.api.infra.StreamLambdaHandler::handleRequest",
        java: {
            'version': lambda.Runtime.JAVA_21
        },
        memory: 2048,
        xrayEnabled: true
    },
    oauth2: [
        {
            cognito: {
                pool: {
                    id: 'OProductCatalogOAuth2UserPool',
                    name: 'PCOAuth2UserPool',
                    domain: {
                        id: 'UserPoolDomain',
                        prefix: 'demo-oauth2'
                    },
                    client: {
                        name: 'DemoAppClient'
                    },
                    props: {
                        generateSecret: false, // Set to true if you need a client secret
                        authFlows: {
                            userPassword: true,
                        },
                        oAuth: {
                            flows: {
                                authorizationCodeGrant: true, // Enable authorization code flow
                                implicitCodeGrant: true, // Enable implicit flow (for SPA if needed)
                            },
                            scopes: [
                                cognito.OAuthScope.OPENID,
                                cognito.OAuthScope.EMAIL,
                                cognito.OAuthScope.PROFILE,
                            ],
                            callbackUrls: [
                                'https://www.yourapp.com/callback', // Replace with your app's callback URL
                            ],
                            logoutUrls: [
                                'https://www.yourapp.com/logout', // Replace with your app's logout URL
                            ],
                        }
                    },

                }
            }
        }
    ]
};
console.log(EnvContext);

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
new CdkSetupCodeStarParameterStack(app, 'CdkSetupCodeStarParameterStack', { env: EnvContext });

/**
 * 
 * cdk deploy CdkPipilinePocStack
 * 
 */
new CdkPipilinePocStack(app, 'CdkPipilinePocStack', { env: EnvContext });
