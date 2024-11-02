import { CfnOutput, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SpringbootApiLambdaStack } from './sb-lambda-app-stack';
import { DeployOAuth2DemoStack } from './deploy-lambda-stack';

export class DeployOAuth2DemoStage extends Stage {

    public readonly apiEndpointUrl: CfnOutput;    
    public readonly lambdaFunctionName: CfnOutput;

    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);
        const productApiService = new DeployOAuth2DemoStack(this, 'erDeployOAuth2DemoStack', props);
        this.apiEndpointUrl = productApiService.apiEndpointUrl;
        this.lambdaFunctionName = productApiService.lambdaFunctionName;
    }
}