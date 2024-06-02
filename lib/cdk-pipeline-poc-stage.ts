import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SQStoLambdaAppStack } from './sqs-lambda-app-stack';
import { EventBusAppStack } from './eventbus-app-stack';

export class CDKPipelinePocStage extends Stage {
    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);

        //setup SQS to Lambda integration stack
        // new SQStoLambdaAppStack(this, 'CdkPipelinePocSQStoLambdaAppStack', {
        //     env: props?.env,
        // });

        //Creating new EventBus stack1
        new EventBusAppStack(this, 'CdkPipelinePocEventBusAppStack'); 
    }
}