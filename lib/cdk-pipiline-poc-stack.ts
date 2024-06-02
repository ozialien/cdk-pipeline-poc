import * as cdk from 'aws-cdk-lib';
import {CodeBuildStep, CodePipeline, CodePipelineSource} from "aws-cdk-lib/pipelines";
import { Construct } from 'constructs';
import { CDKPipelinePocStage } from './cdk-pipeline-poc-stage';
import { ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import * as ssm from 'aws-cdk-lib/aws-ssm';

interface PipelineStackProps extends cdk.StackProps{
  codeStarId: string,
  sbLambdaPrjFldrName: string,
}

export class CdkPipilinePocStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: PipelineStackProps) {
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
                  connectionArn: `arn:aws:codestar-connections:${this.region}:${this.account}:connection/${props?.codeStarId}`
                }
              ),
              commands: ["npm ci", "npm run build", "npx cdk synth"]
            })
          });

        const matlabAccount = ssm.StringParameter.valueForStringParameter(this, '/cdkpipelinepoc/matlab/account');
        const matlabRegion = ssm.StringParameter.valueForStringParameter(this, '/cdkpipelinepoc/matlab/region');
        
        new cdk.CfnOutput(this, 'SSMParamters', {
          value: matlabAccount+matlabRegion,
          description: 'SSM Parameters received',
          exportName: 'SSMParameters',
        });

        const deployMatlab = new CDKPipelinePocStage(this, 'Matlab', {
          env: {
            account: matlabAccount,
            region: matlabRegion,
          }
        });
        const deployMatlabStage = cdkpipeline.addStage(deployMatlab);

        deployMatlabStage.addPost(new ManualApprovalStep('approval'));

        // const deployDev = new CDKPipelinePocStage(this, 'Matson-DEV');
        // const deployDevStage = cdkpipeline.addStage(deployDev);
    }
}