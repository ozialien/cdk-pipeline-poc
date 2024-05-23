import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CdkAppStack } from './cdk-app-stack';

export class CDKPipelinePocStage extends Stage {
    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);

        new CdkAppStack(this, 'WebService');
    }
}