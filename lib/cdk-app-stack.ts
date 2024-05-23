import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';

export class CdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //application services will be added here
    //Setting up SQS queue
    const cdkpipelinepocqueue = new sqs.Queue(this, 'CdkPipelinePocQueue', {
        visibilityTimeout: cdk.Duration.seconds(300)
      });

    //Setup Lambda Function
    const cdkpipelinepoclambda = new Function(this, "CdkPipelinePocLambda", {
       runtime: Runtime.NODEJS_18_X,
       code: Code.fromAsset("lambda"),
       handler: "cdkpipelinepoclambda.handler"
      });
    
    //Setup SQS to lambda invoke
    cdkpipelinepoclambda.addEventSource(new eventsources.SqsEventSource(cdkpipelinepocqueue));

  }
}