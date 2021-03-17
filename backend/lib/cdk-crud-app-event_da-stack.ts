import * as cdk from '@aws-cdk/core';
import * as appsync from "@aws-cdk/aws-appsync"
import * as events from "@aws-cdk/aws-events"
import * as dynamodb from "@aws-cdk/aws-dynamodb"
import * as targets from "@aws-cdk/aws-events-targets"
import * as lambda from "@aws-cdk/aws-lambda"
import * as cognito from "@aws-cdk/aws-cognito"


import { requestTemplate, responseTempalte } from '../utils/appsync-request-response';

export class CdkCrudAppEventDaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // creating the userPool

    const userPool = new cognito.UserPool(this , "Crud_App_EDA_UserPool" , {
      userPoolName : "Crud_App_EDA_UserPool",
      selfSignUpEnabled : true , 
      accountRecovery : cognito.AccountRecovery.EMAIL_ONLY,
      userVerification : {
        emailStyle : cognito.VerificationEmailStyle.CODE,
        smsMessage : 'Hello {username} , Thanks for signing up to my awesome app! Your Verification Code is {####}'        
      },
      autoVerify : {
        email : true
      },
      standardAttributes : {
        email : {
          mutable : true,
          required : true
        },
        phoneNumber : {
          required : true,
          mutable : true
        },
      },
    });

    // we need userClient to connect our userpool with our frontend
    const userPoolClient = new cognito.UserPoolClient(this , "UserPoolClient" , {
      userPool : userPool
    });

    new cdk.CfnOutput(this , "UserPoolId" , {
      value : userPool.userPoolId
    });

    new cdk.CfnOutput(this , "UserPoolClientId" , {
      value : userPoolClient.userPoolClientId
    })

    // Creating appsync to manage our graphql apis
    const api = new appsync.GraphqlApi(this , "CrudEventsGraphql" , {
      name : "Crud-Events-Graphql",
      schema : appsync.Schema.fromAsset("graphql/schema.gql"),
      authorizationConfig : {
        defaultAuthorization : {
          authorizationType  : appsync.AuthorizationType.API_KEY,
          apiKeyConfig : {
            expires : cdk.Expiration.after(cdk.Duration.days(365))
          },
        },
      },
    });

    

    // creating an HTTP Datasource which will do a post request to our event bridge endpoint
    const httpDs =  api.addHttpDataSource(
      "ds",
      "https://events." + this.region + ".amazonaws.com",
      {
        name : "httpsDsWithEventBridge",
        description : "From Appsync to EventBridge",
        authorizationConfig : {
          signingRegion : this.region,
          signingServiceName : "events",
        },
      },
    );

    // lambdaFunction which will be used as consumer

    const mutations = ["addTodo" , "updateTodo" , "deleteTodo"];
    mutations.forEach((mut) => {

      if(mut === "addTodo"){
        let details = `\\\"todo\\\": \\\"$ctx.arguments.todo\\\"`
        httpDs.createResolver({
          typeName  : "Mutation",
          fieldName : mut,
          requestMappingTemplate  : appsync.MappingTemplate.fromString(requestTemplate(details , mut)),
          responseMappingTemplate : appsync.MappingTemplate.fromString(responseTempalte())
        });
      }

     else if(mut === "updateTodo"){
        let details = `\\\"todo\\\": \\\"$ctx.arguments.todo\\\" , \\\"id\\\": \\\"$ctx.arguments.id\\\"`
        httpDs.createResolver({
          typeName  : "Mutation",
          fieldName : mut,
          requestMappingTemplate  : appsync.MappingTemplate.fromString(requestTemplate(details , mut)),
          responseMappingTemplate : appsync.MappingTemplate.fromString(responseTempalte())
        });
      }

      else if(mut === "deleteTodo"){
        let details = `\\\"id\\\": \\\"$ctx.arguments.id\\\"`
        httpDs.createResolver({
          typeName  : "Mutation",
          fieldName : mut,
          requestMappingTemplate  : appsync.MappingTemplate.fromString(requestTemplate(details , mut)),
          responseMappingTemplate : appsync.MappingTemplate.fromString(responseTempalte())
        })
      }

    });

    // now grant permission to httpsDs to put events inside the eventBus
    events.EventBus.grantAllPutEvents(httpDs);

    const todosLambda = new lambda.Function(this , "Crud-App-EventConsumerLambda" , {
      runtime : lambda.Runtime.NODEJS_10_X,
      code : lambda.Code.fromAsset("lambda"),
      handler : "dynamoHandler.handler",
    });


    // Now create a dynamohandler which will put data inside the table

    // Creating the DynamoTable
    const dynamoTable = new dynamodb.Table(this , "Crud-App-EventDA" , {
      tableName : "Crud-App-EventDA",
      billingMode : dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey : {
        name  : "id",
        type : dynamodb.AttributeType.STRING
      },
    });

    // grant acces to lambdaFunction to add data to dynamodb
    dynamoTable.grantFullAccess(todosLambda);

    const dynamoDS = api.addDynamoDbDataSource("dynamoDbDataSource" , dynamoTable);

    dynamoDS.createResolver({
      typeName  : "Query",
      fieldName : "getTodos",
      requestMappingTemplate : appsync.MappingTemplate.dynamoDbScanTable(),
      responseMappingTemplate : appsync.MappingTemplate.dynamoDbResultList()
    })

    todosLambda.addEnvironment("ADDTODO_EVENTS" , dynamoTable.tableName );

    // Rule which will be used by the eventBus to check what 
    //is the source of the arriving event and if the source is matched
    //then the consumer will be targeted
    
    const rule = new events.Rule(this , "AppSync_Crud_App_EventBridge" , {
      ruleName : "AppSync_Crud_App_EventBridge",
      eventPattern : {
        source : ["crud_app_events"],
        detailType : [...mutations]
      }
    });
    rule.addTarget(new targets.LambdaFunction(todosLambda))

  }
}
