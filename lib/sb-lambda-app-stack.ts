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

            const springBootApiLambdaCdkPoc = new Function(this, props.extra.lambda.id, lambdaInformation);

            // X-Ray permissions
            springBootApiLambdaCdkPoc.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'));

            // Lambda alias
            springBootApiLambdaCdkPoc.addAlias("Live");

            // Secret read permissions
            dbAccessSecret.grantRead(springBootApiLambdaCdkPoc);

            // Cognito User Pool and App Client
            const userPool = new cognito.UserPool(this, 'UserPool', {
                userPoolName: 'MyUserPool',
                signInAliases: { email: true },
            });
            const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
                userPool,
                generateSecret: true,
                oAuth: {
                    flows: { authorizationCodeGrant: true },
                    scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
                    callbackUrls: ['https://yourcallbackurl.com'],
                },
            });

            // API Gateway configuration
            let apiInformation: apigateway.LambdaRestApiProps = {
                handler: springBootApiLambdaCdkPoc,
                proxy: false,
                deployOptions: { tracingEnabled: props.extra.lambda.xrayEnabled ?? false },
            };
            if (props.extra.oas) {
                apiInformation.apiDefinition = apigateway.ApiDefinition.fromAsset(props.extra.oas);
            }
            const api = new apigateway.LambdaRestApi(this, props.extra.apiGateway?.name ?? '', apiInformation);

            this.apiEndpointUrl = new cdk.CfnOutput(this, "ApiEndpointUrl", { value: api.url });
            this.lambdaFunctionName = new cdk.CfnOutput(this, 'lambdaFunctionName', { value: lambdaInformation.functionName ?? '' });

            // Cognito Authorizer
            const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
                cognitoUserPools: [userPool],
            });

            // Define the '/products' resource with secured methods
            const products = api.root.addResource('products');
            products.addMethod('GET', undefined, { authorizationType: apigateway.AuthorizationType.COGNITO, authorizer });
            products.addMethod('POST', undefined, { authorizationType: apigateway.AuthorizationType.COGNITO, authorizer });
            products.addMethod('DELETE', undefined, { authorizationType: apigateway.AuthorizationType.COGNITO, authorizer });

            const product = products.addResource("{productSku}");
            product.addMethod('GET', undefined, { authorizationType: apigateway.AuthorizationType.COGNITO, authorizer });
            product.addMethod('DELETE', undefined, { authorizationType: apigateway.AuthorizationType.COGNITO, authorizer });
        } else {
            throw new Error("Missing Lambda configuration!");
        }
    }
}
