import * as cdk from 'aws-cdk-lib';
import {CodeBuildStep, CodePipeline, CodePipelineSource} from "aws-cdk-lib/pipelines";
import { Construct } from 'constructs';

export class CdkPipilinePocStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // The basic pipeline declaration. This sets the initial structure
        // of our pipeline
        const cdkpipeline = new CodePipeline(this, "CdkPipeline", {
            pipelineName: 'CdkPipelinePOC',
            synth: new CodeBuildStep("SynthStep", {
              input: CodePipelineSource.connection(
                'nsalbarde/cdk-pipeline-poc',
                "main",
                {
                  connectionArn: "arn:aws:codestar-connections:us-west-2:275416279984:connection/a96e8694-d581-49b7-a402-7eb4aa97fe00"
                }
              ),
              commands: ["npm ci", "npm run build", "npx cdk synth"]
            })
          });

    }
}