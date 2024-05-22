import * as cdk from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { Construct } from 'constructs';

export class CdkPipilinePocStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Creates a CodeCommit repository called 'CdkPipilinePocRepo'
        new codecommit.Repository(this, 'CdkPipilinePocRepo', {
        repositoryName: "cdk-pipeline-poc"
        });

        // Pipeline code goes here
    }
}