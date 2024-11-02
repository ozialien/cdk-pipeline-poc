import { CfnOutput, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DeployOAuth2DemoLambdaStack } from './deploy-lambda-stack';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class DeployOAuth2DemoStage extends Stage {

    public readonly apiEndpointUrl: CfnOutput;    
    public readonly lambdaFunctionName: CfnOutput;

    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);


        ////
        // Ticket to allow me to use codestar wasn't done over the entire week.
        // Stayed up late Friday to get past the problem
        //
        // CDK has awefull debugging messages.   This apparently needs to be defined in a Stage
        // but the CDK says its missing from a stack.
        //
        ////
        //const code:CfnInput = lambda.Code.fromBucket(Bucket.fromBucketArn(scope,'erBucket','arn:aws:s3:::erider'),'/lambdas/product-catalog/product-catalog-sb-api-0.0.1-SNAPSHOT.jar');
        const b = s3.Bucket.fromBucketName(scope, "importedBucket","erider");
        const myCode:lambda.Code = lambda.Code.fromBucket(b,'/lambdas/product-catalog/product-catalog-sb-api-0.0.1-SNAPSHOT.jar');
        //@ts-ignore
        props.extra.lambda.code = myCode;
        

        const productApiService = new DeployOAuth2DemoLambdaStack(this, 'DeployOAuth2DemoLambdaStack', props);
        this.apiEndpointUrl = productApiService.apiEndpointUrl;
        this.lambdaFunctionName = productApiService.lambdaFunctionName;
    }
}