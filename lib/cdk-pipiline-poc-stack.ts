import * as cdk from 'aws-cdk-lib';
import {CodeBuildStep, CodePipeline, CodePipelineSource} from "aws-cdk-lib/pipelines";
import { Construct } from 'constructs';
import { CDKPipelinePocStage } from './cdk-pipeline-poc-stage';
import { ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

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
              commands: [`cd ${props?.sbLambdaPrjFldrName}`,
                        "mvn package -DskipTests",
                        "cd ..",
                        "npm ci", 
                        "npm run build", 
                        "npx cdk synth"]
            }),
            codeBuildDefaults: {
              partialBuildSpec: codebuild.BuildSpec.fromObject({
                phases: {
                  pre_build: {
                    commands: ["export JAVA_HOME=$JAVA_21_HOME", 
                              "mvn -version"],
                  }
                }
              }),
              buildEnvironment: {
                buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_3,
              },
            }
          });

        const matlabAccount = ssm.StringParameter.valueForStringParameter(this, '/cdkpipelinepoc/matlab/account');
        const matlabRegion = ssm.StringParameter.valueForStringParameter(this, '/cdkpipelinepoc/matlab/region');

        const deployMatlab = new CDKPipelinePocStage(this, 'Matlab');
        const deployMatlabStage = cdkpipeline.addStage(deployMatlab);

        deployMatlabStage.addPost(new ManualApprovalStep('approval'));
    }
}