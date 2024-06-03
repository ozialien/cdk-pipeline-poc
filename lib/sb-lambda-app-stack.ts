import * as cdk from 'aws-cdk-lib'
import { Code, Function, Runtime, SnapStartConf } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway'

export class SpringbootApiLambdaStack extends cdk.Stack{
    constructor(scope: Construct, id: string, props?: cdk.StackProps){
        super(scope, id, props);

        //Setup Lambda Function
        const springBootApiLambdaCdkPoc = new Function(this, "SpringBootApiLambdaCdkPoc", {
            functionName: "ProductCatalogSbApiLambda",
            runtime: Runtime.JAVA_21,
            code: Code.fromAsset("product-catalog-sb-api/target/product-catalog-sb-api-0.0.1-SNAPSHOT.jar"),
            handler: "poc.amitk.lambda.sb.api.infra.StreamLambdaHandler::handleRequest",
            snapStart: SnapStartConf.ON_PUBLISHED_VERSIONS,
        });

       // Define the API Gateway resource
        const api = new apigateway.LambdaRestApi(this, 'ProductCatalogSbApi', {
            handler: springBootApiLambdaCdkPoc,
            proxy: false,
        });

        // Define the '/hello' resource with a GET method
        const apiResource = api.root.addResource('products');
        apiResource.addMethod('GET');
        apiResource.addMethod('POST');
        apiResource.addMethod('DELETE');
    }
}