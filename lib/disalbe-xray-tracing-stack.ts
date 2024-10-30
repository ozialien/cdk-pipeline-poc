import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class XRayTracingDisabledStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Lambda function for the Spring Boot app with X-Ray tracing disabled
    const springBootLambda = new lambda.Function(this, 'SpringBootLambda', {
      runtime: lambda.Runtime.JAVA_11, // Use JAVA_11 or JAVA_17 based on your environment
      handler: 'com.example.Handler', // Replace with the handler class for your Spring Boot app
      code: lambda.Code.fromAsset('path/to/your/spring-boot-app.jar'), // Path to JAR file
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      tracing: lambda.Tracing.DISABLED, // Disable X-Ray tracing for Lambda
    });

    // Define API Gateway with X-Ray tracing disabled
    const api = new apigateway.RestApi(this, 'SpringBootApiGateway', {
      deployOptions: {
        tracingEnabled: false, // Disable X-Ray tracing for API Gateway
      },
    });

    // Integrate Lambda with API Gateway
    const lambdaIntegration = new apigateway.LambdaIntegration(springBootLambda);
    api.root.addMethod('ANY', lambdaIntegration); // Define a method for API Gateway
  }
}
