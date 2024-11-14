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
    readonly cdkId: string,
    readonly name: string,
    readonly code: lambda.Code,
    readonly handler: string,
    readonly java?: LambdaJavaProps,
    readonly memory?: number,
    readonly xrayEnabled?: boolean,
}
export interface ApiGatewayProps {
    readonly name?: string
}

export interface CognitoDomainProps {
    readonly cdkId: string,
    readonly prefix: string
}

export interface CognitoClientProps {
    readonly name: string
}
export interface CognitoAuthorizerProps {
    readonly cdkId: string
}

export interface CognitoPoolProps {
    readonly cdkId: string,
    readonly name: string,
    readonly domain: CognitoDomainProps,
    readonly client: CognitoClientProps,
    readonly props: cognito.UserPoolClientOptions,
    readonly authorizer: CognitoAuthorizerProps
}

export interface CognitoProps {
    readonly enable: boolean,
    readonly enableClient: boolean,
    readonly pool: CognitoPoolProps
}

export interface OAuth2Props {
    
    readonly cognito: CognitoProps
}

export interface OASProps {
    readonly cdkId: string,
    readonly value: string
}

export interface ExtraProps {
    readonly oas?: OASProps,
    readonly cdk?: CDKProps,
    readonly lambda?: LambdaProps,
    readonly apiGateway?: ApiGatewayProps,
    readonly oauth2?: OAuth2Props
}


export interface ExtendedProps extends cdk.StackProps {
    extra?: ExtraProps
}
