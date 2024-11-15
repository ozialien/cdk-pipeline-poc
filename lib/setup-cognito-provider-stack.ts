import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { getUserPoolIdByName } from './common';
import { ExtendedProps } from './config';





export class CognitoUserPoolStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props?: ExtendedProps) {
        super(scope, id, props);
        (async (scope: Construct, id: string, props?: ExtendedProps) => {
            let userPool: cognito.IUserPool | null = null;

            if (props?.extra?.oauth2?.cognito?.enable) {
                let userPool: cognito.IUserPool | undefined = undefined;
                const poolName: string = props.extra.oauth2.cognito.pool.name;

                const userPoolID: string | null = await getUserPoolIdByName(poolName, this.region);
                if (userPoolID) {
                    const pid: string = userPoolID ? userPoolID : '';
                    userPool = cognito.UserPool.fromUserPoolId(this, 'FetchedUserPool', pid);
                }

                if (!userPool) {
                    // Cognito User Pool and App Client
                    userPool = new cognito.UserPool(this, props.extra.oauth2.cognito.pool.cdkId, {
                        userPoolName: props.extra.oauth2.cognito.pool.name,
                        selfSignUpEnabled: false,
                        signInAliases: {
                            username: true,
                            email: true,
                        },
                        passwordPolicy: {
                            minLength: 8,
                            requireDigits: true,
                            requireLowercase: true,
                            requireUppercase: true,
                            requireSymbols: true,
                            tempPasswordValidity: cdk.Duration.days(7),
                        },
                        accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
                        // removalPolicy: cdk.RemovalPolicy.RETAIN, // Retain the User Pool when the stack is deleted
                        removalPolicy: cdk.RemovalPolicy.DESTROY,
                    });
                }
                // Define a Domain for Hosted UI
                const userPoolDomain = userPool.addDomain(props.extra.oauth2.cognito.pool.domain.cdkId, {
                    cognitoDomain: {
                        domainPrefix: props.extra.oauth2.cognito.pool.domain.prefix,
                    },
                });
                new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
                new cdk.CfnOutput(this, 'UserPoolArn', { value: userPool.userPoolArn });
                new cdk.CfnOutput(this, 'HostedUIDomain', {
                    value: userPoolDomain.domainName,
                });
                // Generate the OAuth2 scopes required.
                const generatedScopes = props.extra.oauth2.cognito.pool.groups.map(group => {
                    return new cognito.ResourceServerScope({
                        scopeName: group.scope,
                        scopeDescription: group.description,
                    })
                });

                // Add these as a Resource Server Options
                const resourceServerOptions: cognito.UserPoolResourceServerOptions = {
                    identifier: 'https://myapi.example.com',
                    scopes: generatedScopes
                };

                // Create Resource Server with scopes
                const resourceServer = userPool.addResourceServer('ResourceServer',
                    resourceServerOptions
                );

                const resourceScopes = resourceServerOptions.scopes?.map(s => {
                    return cognito.OAuthScope.resourceServer(resourceServer, s) 
                });
                
                //  Create App Client that includes both scopes
                const appClient = userPool.addClient('AppClient', {
                    generateSecret: false,
                    oAuth: {
                        flows: {
                            authorizationCodeGrant: true,
                        },
                        scopes: resourceScopes,
                        callbackUrls: ['https://myapp.example.com/callback'],
                    },
                    preventUserExistenceErrors: true,
                });

                let i = 0;

                /* Create Groups */
                props.extra.oauth2.cognito.pool.groups.forEach(group => {
                    let groupName = `Group${i++}`
                    new cognito.CfnUserPoolGroup(this, groupName, {
                        userPoolId: userPool.userPoolId,
                        groupName: group.name,
                    });
                });
                i = 0;
                props.extra.oauth2.cognito.pool.users.forEach(user => {
                    let newUser = `User${i++}`;
                    const cUser: cognito.CfnUserPoolUser = new cognito.CfnUserPoolUser(this, newUser, {
                        userPoolId: userPool.userPoolId,
                        username: newUser,
                        userAttributes: [
                            {
                                name: 'email',
                                value: user.email,
                            },
                            {
                                name: 'email_verified',
                                value: '' + (user.verifyEmail ? user.verifyEmail : false),
                            },
                        ],
                    });

                    let k = 0;
                    user.groups.forEach(group => {
                        const groupUser = `User${i}Group${k++}`
                        new cognito.CfnUserPoolUserToGroupAttachment(this, groupUser, {
                            userPoolId: userPool.userPoolId,
                            groupName: group,
                            username: newUser,
                        });
                    });

                });
            }
        })(scope, id, props);
    }
}
