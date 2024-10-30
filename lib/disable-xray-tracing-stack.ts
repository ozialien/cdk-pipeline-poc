import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { XRayTracingBaseStack } from './enable-xray-tracing-stack';
import { MatsonEnvironment } from '../bin/cdk-pipiline-poc';

export class XRayTracingDisabledStack extends XRayTracingBaseStack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps & {env: MatsonEnvironment}) {
    super(scope, id, props);

    // Define the Lambda function for the Spring Boot app with X-Ray tracing disabled
    const springBootLambda = new lambda.Function(this, this.lambdaName, {
      runtime: this.lambdaRuntime, // Use JAVA_11 or JAVA_17 based on your environment
      handler:  this.lambdaHandler, // Replace with the handler class for your Spring Boot app
      code: this.lambdaCode, // Path to JAR file
      memorySize: 1024,
      timeout: this.cdkTimeout,
      tracing: lambda.Tracing.DISABLED, // Disable X-Ray tracing for Lambda
    });

    // Define API Gateway with X-Ray tracing disabled
    const api = new apigateway.RestApi(this, this.apiGatewayName, {
      deployOptions: {
        tracingEnabled: false, // Disable X-Ray tracing for API Gateway
      },
    });

    // Integrate Lambda with API Gateway
    const lambdaIntegration = new apigateway.LambdaIntegration(springBootLambda);
    api.root.addMethod('ANY', lambdaIntegration); // Define a method for API Gateway
  }
}
