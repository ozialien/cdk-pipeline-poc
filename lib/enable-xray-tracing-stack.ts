import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { MatsonStackProps } from '../bin/cdk-pipiline-poc';


export class XRayTracingBaseStack extends cdk.Stack {
  public lambdaName: string = '';
  public lambdaId:string = '';
  public lambdaHandler: string = '';
  public lambdaRuntime: lambda.Runtime = lambda.Runtime.JAVA_21;
  public lambdaCode: lambda.AssetCode;
  public lambdaMemory: number = 1024;
  public cdkTimeout: cdk.Duration = cdk.Duration.seconds(30);
  public apiGatewayName: string = '';

  constructor(scope: Construct, id: string, props?: MatsonStackProps) {
    super(scope, id, props);
    if (props) {     
        if (props.lambda) {
          if (props.lambda.name) {
            this.lambdaName = props.lambda.name;
          }
          if (props.lambda.id) {
            this.lambdaId = props.lambda.id;
          }
          if (props.lambda.handler) {
            this.lambdaHandler = props.lambda.handler;
          }
          if (props.lambda.java) {
            if (props.lambda.java.version) {
              this.lambdaRuntime = props.lambda.java.version;
            }
          }
          if (props.lambda.code) {
            this.lambdaCode = props.lambda.code;
          }
          if (props.lambda.memory) {
            this.lambdaMemory = props.lambda.memory;
          }
          if (props.cdk) {
            if (props.cdk.timeout) {
              this.cdkTimeout = props.cdk.timeout;
            }
          }
          if (props.apiGateway) {
            if (props.apiGateway.name) {
              this.apiGatewayName = props.apiGateway.name;
            }
          }        
      }
    }
  }
}

export class XRayTracingStack extends XRayTracingBaseStack {



  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Lambda function for the Spring Boot app with X-Ray tracing enabled
    const springBootLambda = new lambda.Function(this, this.lambdaName, {
      runtime: this.lambdaRuntime, // Use JAVA_11 or JAVA_17 based on your environment
      handler: this.lambdaHandler, // Replace with the handler class for your Spring Boot app
      code: this.lambdaCode, // Path to JAR file
      memorySize: this.lambdaMemory,
      timeout: this.cdkTimeout,
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing for Lambda
    });

    // Grant X-Ray permissions to Lambda
    springBootLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
    );

    // Define API Gateway with X-Ray tracing enabled
    const api = new apigateway.RestApi(this, this.apiGatewayName, {
      deployOptions: {
        tracingEnabled: true, // Enable X-Ray tracing for API Gateway
      },
    });

    // Integrate Lambda with API Gateway
    const lambdaIntegration = new apigateway.LambdaIntegration(springBootLambda);
    api.root.addMethod('ANY', lambdaIntegration); // Define a method for API Gateway
  }
}
