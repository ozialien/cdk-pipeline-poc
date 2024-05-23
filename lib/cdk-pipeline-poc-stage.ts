import { CdkPipilinePocStack } from './cdk-pipiline-poc-stack';
import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class CDKPipelinePocStage extends Stage {
    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);

        new CdkPipilinePocStack(this, 'WebService');
    }
}