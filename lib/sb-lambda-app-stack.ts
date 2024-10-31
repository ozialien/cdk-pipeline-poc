import * as cdk from 'aws-cdk-lib';
import { Code, Function, Runtime, SnapStartConf, Version } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretMgr from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { MatsonEnvironment } from '../bin/cdk-pipiline-poc';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';


export class SpringbootApiLambdaStack extends cdk.Stack {

    public readonly apiEndpointUrl: cdk.CfnOutput;

    constructor(scope: Construct, id: string, props?: cdk.StackProps ) {
        super(scope, id, props);

        const mProps:MatsonEnvironment = this.node.tryGetContext('matsonEnvironment');

        if(! mProps ) {
            throw new Error("Missing context: {matsonEnvironment: {...}}")
        }
        
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

        let lambdaInformation: cdk.aws_lambda.FunctionProps = {
            functionName:  mProps?.lambda?.name,
            runtime: mProps?.lambda?.java?.version ? mProps?.lambda?.java?.version : lambda.Runtime.JAVA_21,
            memorySize: mProps?.lambda?.memory,
            code: mProps?.lambda?.code ? mProps?.lambda?.code : lambda.Code.fromAsset('') ,
            handler: mProps?.lambda?.handler ? mProps?.lambda?.handler : '',
            snapStart: SnapStartConf.ON_PUBLISHED_VERSIONS,
            vpc: vpc,
            vpcSubnets: { subnets: [subnet] },
            securityGroups: [securityGroup],
            environment: {
                "datasource_secret_id": dbAccessSecretId,
            },
            timeout: cdk.Duration.seconds(30)
        };

        if (mProps?.lambda?.xrayEnabled) {
            Object.assign(lambdaInformation, { tracing: lambda.Tracing.ACTIVE });
        } else {
            Object.assign(lambdaInformation, { tracing: lambda.Tracing.DISABLED });
        }
        //Setup Lambda Function
        const springBootApiLambdaCdkPoc = new Function(this, mProps?.lambda?.id ? mProps?.lambda?.id : '', lambdaInformation);


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
        let apiInformation = {
            handler: springBootApiLambdaCdkPoc,
            proxy: false,
        };
        if (mProps?.lambda?.xrayEnabled) {
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
        const api = new apigateway.LambdaRestApi(this, mProps?.apiGateway?.name ? mProps?.apiGateway?.name : '' , apiInformation);
        
        this.apiEndpointUrl = new cdk.CfnOutput(this, "ApiEndpointUrl", {
            value: api.url,
        });

        // Define the '/products' resource with a GET method
        const products = api.root.addResource('products');
        products.addMethod('GET'); //gets all the products
        products.addMethod('POST'); //add new product
        products.addMethod('DELETE'); //delete all products

        const product = products.addResource("{productSku}");
        product.addMethod('GET'); //get a specific product
        product.addMethod('DELETE'); //delete a specific product


        new cdk.CfnOutput(this, 'apiGatewayUrl', { value: api.url});
        new cdk.CfnOutput(this, 'lambdaFunctionName', { value: lambdaInformation.functionName  ? lambdaInformation.functionName : ''});
    }
}