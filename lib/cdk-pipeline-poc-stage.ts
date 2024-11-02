import { CfnOutput, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SpringbootApiLambdaStack } from './sb-lambda-app-stack';

export class CDKPipelinePocStage extends Stage {

    public readonly apiEndpointUrl: CfnOutput;    
    public readonly lambdaFunctionName: CfnOutput;

    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);

        //setup SQS to Lambda integration stack
        // new SQStoLambdaAppStack(this, 'CdkPipelinePocSQStoLambdaAppStack', {
        //     env: EnvContext
        // });
        
        //Creating new EventBus stack1
        // new EventBusAppStack(this, 'CdkPipelinePocEventBusAppStack', {env: EnvContext});
        const productApiService = new SpringbootApiLambdaStack(this, 'SpringbootApiLambdaStack', props);
        this.apiEndpointUrl = productApiService.apiEndpointUrl;
        this.lambdaFunctionName = productApiService.lambdaFunctionName;
    }
}