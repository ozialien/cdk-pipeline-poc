import * as cdk from 'aws-cdk-lib';
import { Function, SnapStartConf } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretMgr from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { ExtendedProps } from './config';
import { MatsonStack } from './common';
import { Bucket } from 'aws-cdk-lib/aws-s3';


export class DeployOAuth2DemoLambdaStack extends MatsonStack {

    public readonly apiEndpointUrl: cdk.CfnOutput;
    public readonly lambdaFunctionName: cdk.CfnOutput;

    constructor(scope: Construct, id: string, props?: ExtendedProps) {
        super(scope, id, props);

        //getting vpc for lambda
        const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
            vpcId: 'vpc-42de9927'
        });

        //getting security group for lambda
        const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, "SG", "sg-0ea85090b812c3265");

        //getting subnet for lambda  
        const subnet = ec2.PrivateSubnet.fromSubnetAttributes(this, "subnet", { subnetId: "subnet-c56802b2" });

        //getting secret from secret manager
        const dbAccessSecretId = ssm.StringParameter.valueForStringParameter(this, '/cdkpipelinepoc/matlab/dbaccesssecretid');
        const secretPartialArn = `arn:aws:secretsmanager:${this.region}:${this.account}:secret:${dbAccessSecretId}`;
        const dbAccessSecret = secretMgr.Secret.fromSecretPartialArn(this, 'SecretFromCompleteArn', secretPartialArn);
        if (props?.extra?.lambda) {
            const lambdaRuntime = props?.extra?.lambda?.java?.version ?  props?.extra?.lambda?.java?.version : lambda.Runtime.JAVA_21;            
            let lambdaInformation: cdk.aws_lambda.FunctionProps = {
                functionName: props?.extra?.lambda.name,
                runtime: lambdaRuntime ,
                code: lambda.Code.fromBucket(Bucket.fromBucketArn(scope,'erBucket','aws:s3:::erider'),'/lambdas/product-catalog/product-catalog-sb-api-0.0.1-SNAPSHOT.jar'),
                memorySize: props?.extra?.lambda.memory,
                handler: props?.extra?.lambda.handler,
                snapStart: SnapStartConf.ON_PUBLISHED_VERSIONS,
                vpc: vpc,
                vpcSubnets: { subnets: [subnet] },
                securityGroups: [securityGroup],
                environment: {
                    "datasource_secret_id": dbAccessSecretId,
                },
                timeout: props?.extra?.cdk?.timeout ? cdk.Duration.seconds(props?.extra?.cdk?.timeout) : cdk.Duration.seconds(30)
            };

            if (props?.extra?.lambda.xrayEnabled) {
                Object.assign(lambdaInformation, { tracing: lambda.Tracing.ACTIVE });
            } else {
                Object.assign(lambdaInformation, { tracing: lambda.Tracing.DISABLED });
            }
            //Setup Lambda Function
            const springBootApiLambdaCdkPoc = new Function(this,  props?.extra?.lambda.id, lambdaInformation);


            // Grant X-Ray permissions to Lambda
            springBootApiLambdaCdkPoc.role?.addManagedPolicy(
                ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
            );

            // const version = new Version(this, 'ProductCatalogLambdaVersion', {
            //     lambda: springBootApiLambdaCdkPoc,
            //   }); 
            // const version = springBootApiLambdaCdkPoc.currentVersion;
            springBootApiLambdaCdkPoc.addAlias("Live");


            //grant function to read secret
            dbAccessSecret.grantRead(springBootApiLambdaCdkPoc);

            let apiInformation: apigateway.LambdaRestApiProps = {
                handler: springBootApiLambdaCdkPoc,
                proxy: false,

            };
            if (props?.extra?.oas) {
                Object.assign(apiInformation, {
                    apiDefinition: apigateway.ApiDefinition.fromAsset(props?.extra?.oas),
                });
            }
            if (props?.extra?.lambda.xrayEnabled) {
                Object.assign(apiInformation, {
                    deployOptions: {
                        tracingEnabled: true, // Enable X-Ray tracing for API Gateway
                    }
                });
            } else {
                Object.assign(apiInformation, {
                    deployOptions: {
                        tracingEnabled: false, // Disable X-Ray tracing for API Gateway
                    }
                });
            }
            // Define the API Gateway resource
            const api = new apigateway.LambdaRestApi(this, props?.extra?.apiGateway?.name ? props?.extra?.apiGateway?.name : '', apiInformation);
            this.apiEndpointUrl = new cdk.CfnOutput(this, "ApiEndpointUrl", {
                value: api.url,
            });
            this.lambdaFunctionName = new cdk.CfnOutput(this, 'lambdaFunctionName', { value: lambdaInformation.functionName ? lambdaInformation.functionName : '' });

            // Define the '/products' resource with a GET method
            const products = api.root.addResource('products');
            products.addMethod('GET'); //gets all the products
            products.addMethod('POST'); //add new product
            products.addMethod('DELETE'); //delete all products

            const product = products.addResource("{productSku}");
            product.addMethod('GET'); //get a specific product
            product.addMethod('DELETE'); //delete a specific product
        } else {
            throw new Error("Missing Lambda configuration!");
        }
    }
}