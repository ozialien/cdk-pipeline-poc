import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';
import { Duration } from 'aws-cdk-lib';

export class EventBusAppStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps){
        super(scope, id, props);
        //setup event bus in eventbridge 
        const demoEventBus = new events.EventBus(this, 'demoeventbus', { eventBusName: 'CDKPipelinePocEventBus'});

        //setup an archive and retention
        const archive = demoEventBus.archive("CDKPipelinePocEventBusArchive",{
            archiveName: "CDKPipelinePocEventBusArchive",
            eventPattern: {},
            retention: Duration.days(1),
        });

        //create an output
        new cdk.CfnOutput(this, 'CDKPipelinePocEventBusArn', {
            value: demoEventBus.eventBusArn,
            description: 'Demo event bus arn',
            exportName: 'CDKPipelinePocEventBusArn',
        });
    }
}