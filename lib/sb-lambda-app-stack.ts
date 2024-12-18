import * as cdk from 'aws-cdk-lib';
import { Function, SnapStartConf } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretMgr from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { ExtendedProps } from './config';
import { MatsonStack } from './common';

export class SpringbootApiLambdaStack extends MatsonStack {

    public readonly apiEndpointUrl: cdk.CfnOutput;
    public readonly lambdaFunctionName: cdk.CfnOutput;

    constructor(scope: Construct, id: string, props?: ExtendedProps) {
        super(scope, id, props);

        // Getting VPC, Security Group, Subnet, and Secret configurations
        const vpc = ec2.Vpc.fromLookup(this, 'VPC', { vpcId: 'vpc-42de9927' });
        const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, "SG", "sg-0ea85090b812c3265");
        const subnet = ec2.PrivateSubnet.fromSubnetAttributes(this, "subnet", { subnetId: "subnet-c56802b2" });
        const dbAccessSecretId = ssm.StringParameter.valueForStringParameter(this, '/cdkpipelinepoc/matlab/dbaccesssecretid');
        const secretPartialArn = `arn:aws:secretsmanager:${this.region}:${this.account}:secret:${dbAccessSecretId}`;
        const dbAccessSecret = secretMgr.Secret.fromSecretPartialArn(this, 'SecretFromCompleteArn', secretPartialArn);

        // Lambda configuration
        if (props?.extra?.lambda) {
            const lambdaInformation: lambda.FunctionProps = {
                functionName: props.extra.lambda.name,
                runtime: props.extra.lambda.java?.version ?? lambda.Runtime.JAVA_21,
                code: props.extra.lambda.code,
                memorySize: props.extra.lambda.memory,
                handler: props.extra.lambda.handler,
                snapStart: SnapStartConf.ON_PUBLISHED_VERSIONS,
                vpc,
                vpcSubnets: { subnets: [subnet] },
                securityGroups: [securityGroup],
                environment: {
                    "datasource_secret_id": dbAccessSecretId,
                },
                timeout: cdk.Duration.seconds(props.extra.cdk?.timeout ?? 30),
                tracing: props.extra.lambda.xrayEnabled ? lambda.Tracing.ACTIVE : lambda.Tracing.DISABLED,
            };

            const springBootApiLambdaCdkPoc = new Function(this, props.extra.lambda.cdkId, lambdaInformation);

            // X-Ray permissions
            springBootApiLambdaCdkPoc.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'));

            // Lambda alias
            springBootApiLambdaCdkPoc.addAlias("Live");

            // Secret read permissions
            dbAccessSecret.grantRead(springBootApiLambdaCdkPoc);

            // Conditional OAuth2 setup
            let authorizer;
            let userPool: cognito.IUserPool | undefined = undefined;
            if (props.extra.oauth2?.cognito?.enable) {
                // Cognito User Pool and App Client
                userPool = new cognito.UserPool(this, props.extra.oauth2.cognito.pool.cdkId, {
                    userPoolName: props.extra.oauth2.cognito.pool.name,
                    signInAliases: { email: true },
                });
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
            }

            if (props.extra.oauth2?.cognito?.enableClient) {
                let userPoolID: string;

                if (!userPool) {
                    userPool = cognito.UserPool.fromUserPoolArn(this, 'ImportedUserPool', userPoolID = props.extra.oauth2?.cognito?.pool.arn);
                }
                const poolProps: cognito.UserPoolClientProps = {
                    userPool: userPool,
                    ...props.extra.oauth2.cognito.pool.props
                };
                const userPoolClient = new cognito.UserPoolClient(this, props.extra.oauth2.cognito.pool.client.name,poolProps);

                // Cognito Authorizer
                authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, props.extra.oauth2.cognito.pool.authorizer.cdkId, {
                    cognitoUserPools: [userPool],
                });

                new cdk.CfnOutput(this, 'AppClientId', { value: userPoolClient.userPoolClientId });
            }
            ////
            //
            // CDK is very confused and hard to follow in this area.  There are multiple ways to do the same thing.
            //
            let api;
            const lambdaIntegration = new apigateway.LambdaIntegration(springBootApiLambdaCdkPoc, {
                proxy: true,  // Set to true for proxy mode or configure custom integration options if needed
            });
            if (props?.extra?.oas) {
                api = new apigateway.SpecRestApi(this, props?.extra?.oas.cdkId, {
                    restApiName: props.extra.apiGateway?.name ?? '',
                    // Load OpenAPI definition from file
                    apiDefinition: apigateway.ApiDefinition.fromAsset(props.extra.oas.value),
                    deployOptions: { tracingEnabled: props.extra.lambda.xrayEnabled ?? false },
                });
            } else {
                // Configure non-OpenAPI API Gateway
                api = new apigateway.RestApi(this, props.extra.apiGateway?.name ?? '', {
                    deployOptions: { tracingEnabled: props.extra.lambda.xrayEnabled ?? false },
                });
            }

            this.apiEndpointUrl = new cdk.CfnOutput(this, "ApiEndpointUrl", { value: api.url });
            this.lambdaFunctionName = new cdk.CfnOutput(this, 'lambdaFunctionName', { value: lambdaInformation.functionName ?? '' });

            // Define the '/products' resource with conditional OAuth2 authorization
            const products = api.root.addResource('products');
            const authorizationOptions = props.extra.oauth2?.cognito?.enableClient
                ? { authorizationType: apigateway.AuthorizationType.COGNITO, authorizer }
                : undefined;

            products.addMethod('GET', lambdaIntegration, authorizationOptions);
            products.addMethod('POST', lambdaIntegration, authorizationOptions);
            products.addMethod('DELETE', lambdaIntegration, authorizationOptions);

            const product = products.addResource("{productSku}");
            product.addMethod('GET', lambdaIntegration, authorizationOptions);
            product.addMethod('DELETE', lambdaIntegration, authorizationOptions);
        } else {
            throw new Error("Missing Lambda configuration!");
        }
    }
}
