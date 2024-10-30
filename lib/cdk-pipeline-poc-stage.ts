import { CfnOutput, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SQStoLambdaAppStack } from './sqs-lambda-app-stack';
import { EventBusAppStack } from './eventbus-app-stack';
import { SpringbootApiLambdaStack } from './sb-lambda-app-stack';
import { EnvContext } from '../bin/cdk-pipiline-poc';

export class CDKPipelinePocStage extends Stage {

    public readonly apiEndpointUrl: CfnOutput;

    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);

        //setup SQS to Lambda integration stack
        // new SQStoLambdaAppStack(this, 'CdkPipelinePocSQStoLambdaAppStack', {
        //     env: props?.env,
        // });

        //Creating new EventBus stack1
        // new EventBusAppStack(this, 'CdkPipelinePocEventBusAppStack');
        
        const productApiService = new SpringbootApiLambdaStack(this, 'SpringbootApiLambdaStack',{env: EnvContext} );
        this.apiEndpointUrl = productApiService.apiEndpointUrl;
    }
}