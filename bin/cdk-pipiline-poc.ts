#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { CdkPipilinePocStack } from '../lib/cdk-pipiline-poc-stack';
import { CdkSetupCodeStarParameterStack } from '../lib/setup-codestar-stack';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { InitializeCognitoOAuth2Stack } from '../lib/intialize-oath2-cognito-stack';
import { ExtendedProps } from '../lib/config';
import { SpringbootApiLambdaStack } from '../lib/sb-lambda-app-stack';
import { DeployLambdaStage } from '../lib/deploy-lambda-stage';
import { DeployOAuth2DemoStack } from '../lib/deploy-lambda-stack';

const Context: ExtendedProps = {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    },
    extra: {
        oas: "oas/product.json",
        cdk: {
            timeout: 30,
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
                version: lambda.Runtime.JAVA_21
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
                                ]
                                /*
                                ,
                                callbackUrls: [
                                    'https://www.yourapp.com/callback', // Replace with your app's callback URL
                                ],
                                logoutUrls: [
                                    'https://www.yourapp.com/logout', // Replace with your app's logout URL
                                ], */
                            }
                        },

                    }
                }
            }
        ]
    }
}


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

new DeployOAuth2DemoStack(app, 'erSBLOauth2Stack', Context);