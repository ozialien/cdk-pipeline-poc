import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';

/**
 * Defines all common parameters across the pipeline definition
 * 
 */
export interface CDKProps {
    readonly timeout?: number,
    readonly userInitials?: string,
    readonly pipelineName?: string,
    readonly projectFolder?: string,
    readonly codestartId?: string
}
export interface LambdaJavaProps {
    readonly version: lambda.Runtime
}

export interface LambdaProps {
    readonly id: string,
    readonly name: string,
    code: lambda.Code,
    readonly handler: string,
    readonly java?: LambdaJavaProps,
    readonly memory?: number,
    readonly xrayEnabled?: boolean,
}
export interface ApiGatewayProps {
    readonly name?: string
}

export interface CognitoDomainProps {
    id: string,
    prefix: string
}

export interface CognitoClientProps {
    name: string
}

export interface CognitoPoolProps {
    id: string,
    name: string,
    domain: CognitoDomainProps,
    client: CognitoClientProps,
    props: cognito.UserPoolClientOptions,
}

export interface CognitoProps {
    pool: CognitoPoolProps
}

export interface OAuth2Props {
    cognito?: CognitoProps
}

export interface ExtraProps {
    readonly oas?: string,
    readonly cdk?: CDKProps,
    readonly lambda?: LambdaProps,
    readonly apiGateway?: ApiGatewayProps,
    readonly oauth2?: OAuth2Props[]
}


export interface ExtendedProps extends cdk.StackProps {
    extra?: ExtraProps
}
