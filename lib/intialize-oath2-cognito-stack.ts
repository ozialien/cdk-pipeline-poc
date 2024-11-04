import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { ExtendedProps } from './config';
import { MatsonStack } from './common';

export class InitializeCognitoOAuth2Stack extends MatsonStack {
    constructor(scope: Construct, id: string, props?: ExtendedProps) {
        super(scope, id, props);

        if (props) {
            if (props.env) {
                if (props?.extra?.oauth2) {
                    let auth = props?.extra?.oauth2;
                    ////
                    //
                    // An attempt to enable mutiple oauth2 providers
                    //
                    //props?.extra?.oauth2.forEach(auth => {
                    if (auth.cognito) {
                        // Create a Cognito User Pool
                        const userPool = new cognito.UserPool(this, auth.cognito.pool.cdkId, {
                            userPoolName: auth.cognito?.pool.name,
                            signInAliases: {
                                email: true,
                                username: true,
                            },
                            autoVerify: { email: true },
                        });

                        // Define a Domain for Hosted UI
                        const userPoolDomain = userPool.addDomain(auth.cognito.pool.domain.cdkId, {
                            cognitoDomain: {
                                domainPrefix: auth.cognito.pool.domain.prefix,
                            },
                        });

                        // Create an App Client
                        const userPoolClient = new cognito.UserPoolClient(this, auth.cognito.pool.client.name, {
                            userPool,
                            generateSecret: auth.cognito.pool.props.generateSecret, // Set to true if you need a client secret
                            authFlows: auth.cognito.pool.props.authFlows,
                            oAuth: auth.cognito.pool.props.oAuth
                        });

                        // Outputs
                        new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
                        new cdk.CfnOutput(this, 'UserPoolArn', { value: userPool.userPoolArn });
                        new cdk.CfnOutput(this, 'AppClientId', { value: userPoolClient.userPoolClientId });
                        new cdk.CfnOutput(this, 'HostedUIDomain', {
                            value: userPoolDomain.domainName,
                        });
                    }
                    // });
                }
            }
        }
    }
}
