import * as cdk from 'aws-cdk-lib';
import { Code, Function, Runtime, SnapStartConf, Version } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretMgr from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { XRayTracingBaseStack } from './enable-xray-tracing-stack';
import { MatsonEnvironment } from '../bin/cdk-pipiline-poc';

export class SpringbootApiLambdaStack extends XRayTracingBaseStack {
    
    public readonly apiEndpointUrl: cdk.CfnOutput;

    constructor(scope: Construct, id: string, props?: cdk.StackProps & {env: MatsonEnvironment}){
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

        console.log(props);
        //Setup Lambda Function
        const springBootApiLambdaCdkPoc = new Function(this, this.lambdaId, {
            functionName: this.lambdaName,
            runtime: this.lambdaRuntime,
            memorySize: this.lambdaMemory,
            code: this.lambdaCode,
            handler: this.lambdaHandler,
            snapStart: SnapStartConf.ON_PUBLISHED_VERSIONS,
            vpc: vpc,
            vpcSubnets: { subnets:[subnet] },
            securityGroups: [securityGroup],
            environment: {
                "datasource_secret_id": dbAccessSecretId,
            },
            timeout: cdk.Duration.seconds(30)
        });

        // const version = new Version(this, 'ProductCatalogLambdaVersion', {
        //     lambda: springBootApiLambdaCdkPoc,
        //   }); 
        // const version = springBootApiLambdaCdkPoc.currentVersion;
        springBootApiLambdaCdkPoc.addAlias("Live");


        //grant function to read secret
        dbAccessSecret.grantRead(springBootApiLambdaCdkPoc);

       // Define the API Gateway resource
        const api = new apigateway.LambdaRestApi(this, this.apiGatewayName, {
            handler: springBootApiLambdaCdkPoc,
            proxy: false,
        });

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
    }
}