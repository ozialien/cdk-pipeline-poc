#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { CdkSetupCodeStarParameterStack } from '../lib/setup-codestar-stack';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { ExtendedProps } from '../lib/config';
import { SpringbootApiLambdaStack } from '../lib/sb-lambda-app-stack';

const Context: ExtendedProps = {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    },
    extra: {
        //
        // When using OAS CDK stack detects a conflict.  But is fine without it.
        //
        // oas: {
        //     cdkId: "ProductFromOAS",
        //     value: "oas/product.json"
        // },
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
            cdkId: 'SpringBootApiLambdaCdkPoc',
            name: 'ProductCatalogSbApiLambda',
            code: lambda.Code.fromAsset("product-catalog-sb-api/target/product-catalog-sb-api-0.0.1-SNAPSHOT.jar"),
            handler: "poc.amitk.lambda.sb.api.infra.StreamLambdaHandler::handleRequest",
            java: {
                version: lambda.Runtime.JAVA_21
            },
            memory: 2048,
            xrayEnabled: true
        },
        ////
        //
        // Don't setup the cdk to generate cognito OAuth2 client
        // 
        oauth2:
        {
            cognito: {
                enable: false,
                enableClient: false,
                pool: {
                    cdkId: 'OProductCatalogOAuth2UserPool',
                    arn: '',
                    name: 'PCOAuth2UserPool',
                    authorizer: {
                        cdkId: 'CognitoAuthorizer'
                    },
                    domain: {
                        cdkId: 'UserPoolDomain',
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
 * 
 * cdk deploy CdkPipilinePocStack
 * 
 */
////
//
// Temporary because I don't have codestar access
//
// new CdkPipilinePocStack(app, 'CdkPipilinePocStack', Context);

new SpringbootApiLambdaStack(app, 'SpringbootApiLambdaStack', Context);