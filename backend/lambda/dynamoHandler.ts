
import {EventBridgeEvent , Context} from "aws-lambda";
import {randomBytes} from "crypto"
import * as AWS from "aws-sdk"

const docClient = new AWS.DynamoDB.DocumentClient() 

type UpdateParams =  {
    TableName : string | ""
    Key : {
        id : string
    }
    UpdateExpression : string
    ExpressionAttributeValues  :{
        ":todo" : string
    }
    ReturnValues : string

}

exports.handler = async (event:EventBridgeEvent<string , any> , context:Context) => {

    try {
        // addTodo
        if(event["detail-type"] === "addTodo"){
           const params = {
               TableName : process.env.ADDTODO_EVENTS || "" ,
               Item : {
                   id : randomBytes(16).toString("hex"),
                   todo : event.detail.todo,
               },
           };
           await docClient.put(params).promise();
        }

        // deleteTodo
        else if(event["detail-type"] === "deleteTodo"){
            const params = {
                TableName : process.env.ADDTODO_EVENTS || "" ,
                Key : {
                    id : event.detail.id,
                },
            };
            await docClient.delete(params).promise();
        }

        // updatetodo
        else if(event["detail-type"] === "updateTodo"){
            const params:UpdateParams = {
                TableName : process.env.ADDTODO_EVENTS || "" ,
                Key : {
                    id : event.detail.id,
                },
                UpdateExpression : "set todo = :todo",
                ExpressionAttributeValues : {
                    ":todo" : event.detail.todo
                },
                ReturnValues : "UPDATED_NEW",
            };
            await docClient.update(params).promise()
        }
    }

    catch(err){
        console.log("Error" , err)
    }

}