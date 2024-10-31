import { Construct } from "constructs";
import { ExtendedProps, ExtraProps } from "./config";
import * as cdk from 'aws-cdk-lib';

/**
 * Add extra parameters to setup a stack
 * You can override values from cdk.json if they are strings, numbers.
 */
export class MatsonStack extends cdk.Stack {
    public static MATSON_ENVIRONMENT: string = 'matsonEnvironment';

    constructor(scope: Construct, id: string, props?: ExtendedProps) {
        super(scope, id, props);

        const mProps: ExtraProps = this.node.tryGetContext(MatsonStack.MATSON_ENVIRONMENT);
        if (mProps) {
            if (!props) {
                props = {};
            }
            if (!props.extra) {
                props.extra = {}
            }
            Object.assign(props.extra, mProps);
        }
    }
}
