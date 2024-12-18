import * as cdk from 'aws-cdk-lib';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from "aws-cdk-lib/pipelines";
import { Construct } from 'constructs';
import { CDKPipelinePocStage } from './cdk-pipeline-poc-stage';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { CdkSetupCodeStarParameterStack } from './setup-codestar-stack';
import { ExtendedProps } from './config';

export class CdkPipilinePocStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: ExtendedProps) {
    super(scope, id, props);

    // The basic pipeline declaration. This sets the initial structure
    // of our pipeline
    const matlabAccount = ssm.StringParameter.valueForStringParameter(this, CdkSetupCodeStarParameterStack.ACCOUNT);
    const matlabRegion = ssm.StringParameter.valueForStringParameter(this, CdkSetupCodeStarParameterStack.REGION);
    const codestarid = ssm.StringParameter.valueForStringParameter(this, CdkSetupCodeStarParameterStack.CODESTARID);
    const sbProjectFolderName = ssm.StringParameter.valueForStringParameter(this, CdkSetupCodeStarParameterStack.PROJECT_FOLDER);


    const cdkpipeline = new CodePipeline(this, "CdkPipeline",
      {
        pipelineName: 'CdkPipelinePOC',
        synth: new CodeBuildStep("SynthStep", {
          input: CodePipelineSource.connection(
            'nsalbarde/cdk-pipeline-poc',
            "main",
            {
              connectionArn: `arn:aws:codestar-connections:${matlabRegion}:${matlabAccount}:connection/${codestarid}`
            }
          ),
          /**
            TODO: Should change to this when I get my own repo to pull

             "npm ci",
             "npm run e2e:build",
             "npx cdk synth"
           */
             commands: [`cd ${sbProjectFolderName}`,
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

    const deployMatlab = new CDKPipelinePocStage(this, 'Matlab', props);
    const deployMatlabStage = cdkpipeline.addStage(deployMatlab);

    deployMatlabStage.addPost(
      new CodeBuildStep('TestAPIEndpoint',
        {
          projectName: 'TestAPIEndpoint',
          envFromCfnOutputs: {
            ENDPOINT_URL: deployMatlab.apiEndpointUrl
          },
          commands: [
            'echo $ENDPOINT_URL',
            'curl -Ssf $ENDPOINT_URL/products',
            `cd ${sbProjectFolderName}`,
            'mvn test -Dtest=ProductCatalogUpdateSystemTest surefire:test'
          ]
        }
      )
    );
    // deployMatlabStage.addPost(new ManualApprovalStep('approval'));
  }
}