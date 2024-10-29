import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class CdkCodeStarParameterStack extends cdk.Stack {

    public static PARAMETER_PREFIX: string = '/cdkpipelinepoc/matlab/';

    public account: string = '';
    public region: string = '';
    public foldername: string = '';
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
                if (props.env.foldername) {
                    //@ts-ignore
                    this.foldername = props.env.foldername;
                }
                //@ts-ignore
                if (props.env.codestarId) {
                    //@ts-ignore
                    this.codestarId = props.env.codestarId;
                }
            }
        }

        // Define the CodeStar connection ID (replace with your actual connection ID)
        const codestarId = new ssm.StringParameter(this, 'CodeStarConnectionId', {
            parameterName: `${CdkCodeStarParameterStack.PARAMETER_PREFIX}/codestarid`,
            stringValue: this.codestarId, // Replace with actual CodeStar Connection ID
            description: 'CodeStar connection ID for GitHub repository',
            tier: ssm.ParameterTier.STANDARD
        });

        // Define the AWS Account ID for the pipeline
        const matlabAccount = new ssm.StringParameter(this, 'MatlabAccount', {
            parameterName: `${CdkCodeStarParameterStack.PARAMETER_PREFIX}/account`,
            stringValue: this.account, // Dynamically set to the current account ID
            description: 'AWS Account ID for the pipeline',
            tier: ssm.ParameterTier.STANDARD
        });

        // Define the AWS Region for the pipeline
        const matlabRegion = new ssm.StringParameter(this, 'MatlabRegion', {
            parameterName: `${CdkCodeStarParameterStack.PARAMETER_PREFIX}/region`,
            stringValue: this.region, // Dynamically set to the current region
            description: 'AWS Region for the pipeline',
            tier: ssm.ParameterTier.STANDARD
        });

        // Define the source project folder name
        const sbProjectFolderName = new ssm.StringParameter(this, 'SbProjectFolderName', {
            parameterName: `${CdkCodeStarParameterStack.PARAMETER_PREFIX}/sbprjfoldername`,
            stringValue: this.foldername, // Replace with actual folder name if applicable
            description: 'Source project folder name for the build step',
            tier: ssm.ParameterTier.STANDARD
        });
    }
}
