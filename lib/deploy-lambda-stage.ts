import { CfnOutput, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DeployOAuth2DemoLambdaStack } from './deploy-lambda-stack';

export class DeployOAuth2DemoStage extends Stage {

    public readonly apiEndpointUrl: CfnOutput;    
    public readonly lambdaFunctionName: CfnOutput;

    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);
        const productApiService = new DeployOAuth2DemoLambdaStack(this, 'DeployOAuth2DemoLambdaStack', props);
        this.apiEndpointUrl = productApiService.apiEndpointUrl;
        this.lambdaFunctionName = productApiService.lambdaFunctionName;
    }
}