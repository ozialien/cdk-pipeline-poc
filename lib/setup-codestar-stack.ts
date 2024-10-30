import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';


export class BaseParameterStack extends cdk.Stack {
    public static ENV_USER_INITIALS: string = process.env.CDK_USER_INITIALS ? `/${process.env.CDK_USER_INITIALS}/` : '/'
    public static ENV_PIPELINE_NAME: string = process.env.CDK_PIPELINE_NAME ? `${process.env.CDK_PIPELINE_NAME}` : 'cdkpipelinepoc'

    public static PARAMETER_PREFIX: string = `/${BaseParameterStack.ENV_PIPELINE_NAME}/matlab${BaseParameterStack.ENV_USER_INITIALS}`;
    public static ACCOUNT: string = `${BaseParameterStack.PARAMETER_PREFIX}/account`;
    public static REGION: string = `${BaseParameterStack.PARAMETER_PREFIX}/region`;;
    public static PROJECT_FOLDER: string = `${BaseParameterStack.PARAMETER_PREFIX}/sbprjfoldername`;;
    public static CODESTARID: string = `${BaseParameterStack.PARAMETER_PREFIX}/codestarid`;;


    public account: string = '';
    public region: string = '';
    public projectFolder: string = '';
    public codestarId: string = '';

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        if (props) {
            if (props.env) {
                if (props.env.account) {
                    this.account = props.env.account;
                }
                if (props.env.region) {
                    this.region = props.env.region;

                }
                //@ts-ignore
                if (props.env.cdk) {
                    //@ts-ignore
                    if (props.env.cdk.projectFolder) {
                        //@ts-ignore
                        this.projectFolder = props.env.cdk.projectFolder;
                    }
                    //@ts-ignore
                    if (props.env.cdk.codestarId) {
                        //@ts-ignore
                        this.codestarId = props.env.cdk.codestarId;
                    }
                }
            }
        }
    }
}

export class CdkSetupCodeStarParameterStack extends BaseParameterStack {



    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Define the CodeStar connection ID (replace with your actual connection ID)
        const codestarId = new ssm.StringParameter(this, 'CodeStarConnectionId', {
            parameterName: BaseParameterStack.CODESTARID,
            stringValue: this.codestarId, // Replace with actual CodeStar Connection ID
            description: 'CodeStar connection ID for GitHub repository',
            tier: ssm.ParameterTier.STANDARD
        });

        // Define the AWS Account ID for the pipeline
        const matlabAccount = new ssm.StringParameter(this, 'MatlabAccount', {
            parameterName: BaseParameterStack.ACCOUNT,
            stringValue: this.account, // Dynamically set to the current account ID
            description: 'AWS Account ID for the pipeline',
            tier: ssm.ParameterTier.STANDARD
        });

        // Define the AWS Region for the pipeline
        const matlabRegion = new ssm.StringParameter(this, 'MatlabRegion', {
            parameterName: BaseParameterStack.REGION,
            stringValue: this.region, // Dynamically set to the current region
            description: 'AWS Region for the pipeline',
            tier: ssm.ParameterTier.STANDARD
        });

        // Define the source project folder name
        const sbProjectFolderName = new ssm.StringParameter(this, 'SbProjectFolderName', {
            parameterName: BaseParameterStack.PROJECT_FOLDER,
            stringValue: this.projectFolder, // Replace with actual folder name if applicable
            description: 'Source project folder name for the build step',
            tier: ssm.ParameterTier.STANDARD
        });
    }
}
