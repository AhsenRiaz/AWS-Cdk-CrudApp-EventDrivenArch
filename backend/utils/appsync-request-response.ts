export const EVENT_SOURCE = "crud_app_events";

export const requestTemplate = (details:string , detailType:string) => {

    return `{
        "version": "2018-05-29",
        "method": "POST",
        "resourcePath": "/",
        "params": {
          "headers": {
            "content-type": "application/x-amz-json-1.1",
            "x-amz-target":"AWSEvents.PutEvents"
          },
          "body": {
            "Entries":[
              {
                "DetailType":"${detailType}",
                "Source":"${EVENT_SOURCE}",
                "EventBusName": "default",
                "Detail": "{${details}}"
              }
            ]
          }
        }
      }`

}


export const responseTempalte  = () => {
    
    return `
    #if($ctx.error)
    $util.error($ctx.error.message, $ctx.error.type)
    #end
    #if($ctx.result.statusCode == 200)
    {
        "result": "$util.parseJson($ctx.result.body)"
    }
    #else
    $utils.appendError($ctx.result.body, $ctx.result.statusCode)
    #end
    `

}