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

    // The basic pipeline declaration. This sets the initial structure
    // of our pipeline
    const matlabAccount = ssm.StringParameter.valueForStringParameter(this, CdkSetupCodeStarParameterStack.ACCOUNT);
    const matlabRegion = ssm.StringParameter.valueForStringParameter(this, CdkSetupCodeStarParameterStack.REGION);
    const codestarid = ssm.StringParameter.valueForStringParameter(this, CdkSetupCodeStarParameterStack.CODESTARID);
    const sbProjectFolderName = ssm.StringParameter.valueForStringParameter(this, CdkSetupCodeStarParameterStack.PROJECT_FOLDER);


    const deployOAuth2DemoPipeline = new CodePipeline(this, "erDeployOAuth2DemoPipeline",
      {
        pipelineName: 'erDeployOAuth2DemoPipeline',
        synth: new CodeBuildStep("SynthStep", {       
             commands: ["echo Hello World"]
        }),
        codeBuildDefaults: {
          buildEnvironment: {
            buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_ARM_3,
          },
        }
      });

    const deployOAuth2DemoStage = new DeployOAuth2DemoStage(this, 'erDeployOAuth2DemoStage', props);
    const deployOAuth2DemoStack = deployOAuth2DemoPipeline.addStage(deployOAuth2DemoStage);
  }
}