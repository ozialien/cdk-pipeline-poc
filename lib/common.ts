import { Construct } from "constructs";
import { ExtendedProps, ExtraProps } from "./config";
import * as cdk from 'aws-cdk-lib';
import * as AWS from 'aws-sdk';
import { IUserPool } from "aws-cdk-lib/aws-cognito";

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


/**
 * Retrieves the User Pool ID for a given User Pool name.
 * @param userPoolName - The name of the Cognito User Pool.
 * @param region - The AWS region where the User Pool is located.
 * @returns A promise that resolves to the User Pool ID.
 * @throws An error if the User Pool is not found.
 */
export async function getUserPoolIdByName(userPoolName: string, region: string): Promise<string | null> {
    const cognitoISP = new AWS.CognitoIdentityServiceProvider({ region });

    let nextToken: string | undefined = undefined;

    do {
        const params: AWS.CognitoIdentityServiceProvider.ListUserPoolsRequest = {
            MaxResults: 60,
            NextToken: nextToken,
        };

        const response = await cognitoISP.listUserPools(params).promise();

        const userPools = response.UserPools;
        if (userPools) {
            const matchingPool = userPools.find((pool) => pool.Name === userPoolName);
            if (matchingPool) {
                return matchingPool.Id!;
            }
        }

        nextToken = response.NextToken;
    } while (nextToken);

    return null;
}


export const implicitGetUserPoolIdByName = (userPoolName: string, region: string): string | null => {
    //@ts-ignore
    return (async () => {
        return await getUserPoolIdByName(userPoolName,region);
      })();

}