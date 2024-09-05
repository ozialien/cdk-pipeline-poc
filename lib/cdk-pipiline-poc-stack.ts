import * as cdk from 'aws-cdk-lib';
import {CodeBuildStep, CodePipeline, CodePipelineSource} from "aws-cdk-lib/pipelines";
import { Construct } from 'constructs';
import { CDKPipelinePocStage } from './cdk-pipeline-poc-stage';
import { ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

export class CdkPipilinePocStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
 
        // The basic pipeline declaration. This sets the initial structure
        // of our pipeline
        const matlabAccount = ssm.StringParameter.valueForStringParameter(this, '/cdkpipelinepoc/matlab/account');
        const matlabRegion = ssm.StringParameter.valueForStringParameter(this, '/cdkpipelinepoc/matlab/region');
        const codestarid = ssm.StringParameter.valueForStringParameter(this, '/cdkpipelinepoc/matlab/codestarid');
        const sbProjectFolderName = ssm.StringParameter.valueForStringParameter(this, '/cdkpipelinepoc/matlab/sbprjfoldername');

        const cdkpipeline = new CodePipeline(this, "CdkPipeline", {
            pipelineName: 'CdkPipelinePOC',
            synth: new CodeBuildStep("SynthStep", {
              input: CodePipelineSource.connection(
                'nsalbarde/cdk-pipeline-poc',
                "main",
                {
                  connectionArn: `arn:aws:codestar-connections:${matlabRegion}:${matlabAccount}:connection/${codestarid}`
                }
              ),
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

        const deployMatlab = new CDKPipelinePocStage(this, 'Matlab',{
          env:{
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION
          }
        });
        const deployMatlabStage = cdkpipeline.addStage(deployMatlab);

        deployMatlabStage.addPost(
          new CodeBuildStep('TestAPIEndpoint', {
            projectName: 'TestAPIEndpoint',
            envFromCfnOutputs: {
              ENDPOINT_URL: deployMatlab.apiEndpointUrl
            },
            commands: [
              'echo $ENDPOINT_URL',
              'curl -Ssf $ENDPOINT_URL/products',
              'pwd',
              'ls -ltra',
              `cd ${sbProjectFolderName}`,
              'mvn test -Dtest=ProductCatalogUpdateSystemTest'
            ]
          })
        );
        // deployMatlabStage.addPost(new ManualApprovalStep('approval'));
    }
}