import * as cdk from 'aws-cdk-lib';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from "aws-cdk-lib/pipelines";
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { CdkSetupCodeStarParameterStack } from './setup-codestar-stack';
import { ExtendedProps } from './config';
import { DeployOAuth2DemoStage } from './deploy-lambda-stage';

export class DeployOAuth2DemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ExtendedProps) {
    super(scope, id, props);

    const deployOAuth2DemoPipeline = new CodePipeline(this, "DeployOAuth2DemoPipeline",
      {
        pipelineName: 'DeployOAuth2DemoPipeline',
        synth: new CodeBuildStep("SynthStep", {       
             commands: ["echo Hello World"]
        }),
        codeBuildDefaults: {
          buildEnvironment: {
            buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_3,
          },
        }
      });

    const deployOAuth2DemoStage = new DeployOAuth2DemoStage(this, 'DeployOAuth2DemoStage', props);
    const deployOAuth2DemoStack = deployOAuth2DemoPipeline.addStage(deployOAuth2DemoStage);
  }
}