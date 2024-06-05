import * as cdk from 'aws-cdk-lib';
import { Code, Function, Runtime, SnapStartConf } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretMgr from 'aws-cdk-lib/aws-secretsmanager';

export class SpringbootApiLambdaStack extends cdk.Stack{
    constructor(scope: Construct, id: string, props?: cdk.StackProps){
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
        const dbAccessSecretId = "lab/secretMGPOC/MySQL-hai33O";
        // const secretCompleteArn = `arn:aws:secretsmanager:${this.region}:${this.account}:secret:${dbAccessSecretId}}`;
        const secretCompleteArn = "arn:aws:secretsmanager:us-west-2:275416279984:secret:lab/secretMGPOC/MySQL-hai33O";
        const dbAccessSecret = secretMgr.Secret.fromSecretCompleteArn(this, 'SecretFromCompleteArn', secretCompleteArn);

        //Setup Lambda Function
        const springBootApiLambdaCdkPoc = new Function(this, "SpringBootApiLambdaCdkPoc", {
            functionName: "ProductCatalogSbApiLambda",
            runtime: Runtime.JAVA_21,
            memorySize: 2048,
            code: Code.fromAsset("product-catalog-sb-api/target/product-catalog-sb-api-0.0.1-SNAPSHOT.jar"),
            handler: "poc.amitk.lambda.sb.api.infra.StreamLambdaHandler::handleRequest",
            snapStart: SnapStartConf.ON_PUBLISHED_VERSIONS,
            vpc: vpc,
            vpcSubnets: { subnets:[subnet] },
            securityGroups: [securityGroup],
            environment: {
                "datasource_secret_id": dbAccessSecretId,
            }
        });

        //grant function to read secret
        dbAccessSecret.grantRead(springBootApiLambdaCdkPoc);

       // Define the API Gateway resource
        const api = new apigateway.LambdaRestApi(this, 'ProductCatalogSbApi', {
            handler: springBootApiLambdaCdkPoc,
            proxy: false,
        });

        // Define the '/products' resource with a GET method
        const apiResource = api.root.addResource('products');
        apiResource.addMethod('GET');
        apiResource.addMethod('POST');
        apiResource.addMethod('DELETE');
    }
}