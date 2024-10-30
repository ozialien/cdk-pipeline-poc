import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { MatsonEnvironment } from '../bin/cdk-pipiline-poc';


export class CdkSetupCodeStarParameterStack extends cdk.Stack {
    public static ENV_USER_INITIALS: string = process.env.CDK_USER_INITIALS ? `/${process.env.CDK_USER_INITIALS}/` : '/'
    public static ENV_PIPELINE_NAME: string = process.env.CDK_PIPELINE_NAME ? `${process.env.CDK_PIPELINE_NAME}` : 'cdkpipelinepoc'

    public static PARAMETER_PREFIX: string = `/${CdkSetupCodeStarParameterStack.ENV_PIPELINE_NAME}/matlab${CdkSetupCodeStarParameterStack.ENV_USER_INITIALS}`;
    public static ACCOUNT: string = `${CdkSetupCodeStarParameterStack.PARAMETER_PREFIX}/account`;
    public static REGION: string = `${CdkSetupCodeStarParameterStack.PARAMETER_PREFIX}/region`;;
    public static PROJECT_FOLDER: string = `${CdkSetupCodeStarParameterStack.PARAMETER_PREFIX}/sbprjfoldername`;;
    public static CODESTARID: string = `${CdkSetupCodeStarParameterStack.PARAMETER_PREFIX}/codestarid`;;



    constructor(scope: Construct, id: string, props?: cdk.StackProps & { env: MatsonEnvironment }) {
        super(scope, id, props);
        let errors:string[] = [];
        if (! props?.env?.cdk?.codestartId) {
            errors.push("env.cdk.codestartId");
        }
        if (! props?.env?.account) {
            errors.push("env.account");
        }
        if (! props?.env?.region) {
            errors.push("env.region");
        }
        if (! props?.env?.cdk?.projectFolder) {
            errors.push("env.cdk.projectFolder");
        }
        if(errors.length>0) {
            throw new Error(`Missing ${errors.toString()}`)
        }
        // Define the CodeStar connection ID (replace with your actual connection ID)
        const codestarId = new ssm.StringParameter(this, 'CodeStarConnectionId', {
            parameterName: CdkSetupCodeStarParameterStack.CODESTARID,
            stringValue: props?.env?.cdk?.codestartId ? props?.env?.cdk?.codestartId : '',
            // Replace with actual CodeStar Connection ID
            description: 'CodeStar connection ID for GitHub repository',
            tier: ssm.ParameterTier.STANDARD
        });

        // Define the AWS Account ID for the pipeline
        const matlabAccount = new ssm.StringParameter(this, 'MatlabAccount', {
            parameterName: CdkSetupCodeStarParameterStack.ACCOUNT,
            stringValue:  props?.env?.account ? props?.env?.account : '', // Dynamically set to the current account ID
            description: 'AWS Account ID for the pipeline',
            tier: ssm.ParameterTier.STANDARD
        });

        // Define the AWS Region for the pipeline
        const matlabRegion = new ssm.StringParameter(this, 'MatlabRegion', {
            parameterName: CdkSetupCodeStarParameterStack.REGION,
            stringValue: props?.env?.region ? props?.env?.region : '', // Dynamically set to the current region
            description: 'AWS Region for the pipeline',
            tier: ssm.ParameterTier.STANDARD
        });

        // Define the source project folder name
        const sbProjectFolderName = new ssm.StringParameter(this, 'SbProjectFolderName', {
            parameterName: CdkSetupCodeStarParameterStack.PROJECT_FOLDER,
            stringValue: props?.env?.cdk?.projectFolder ?props?.env?.cdk?.projectFolder : '', // Replace with actual folder name if applicable
            description: 'Source project folder name for the build step',
            tier: ssm.ParameterTier.STANDARD
        });
    }
}
