import logging
import azure.functions as func
import json
from azure.cosmos import exceptions, CosmosClient, PartitionKey

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    full_name = req.params.get('full_name')

    if not full_name:
        return func.HttpResponse(
            "Please provide the 'full_name' parameter in the query string.",
            status_code=400
        )

    # Cosmos DB configuration
    endpoint = "https://tottdb.documents.azure.com:443/"
    key = "NLPjiuBtIj76CRcCq8fPBBvSPbUpCySy5zXaXLMGWKVrJOu6gKZj3s94FOtPFEOfkkJWb44dQglvACDboblDdA=="
    database_name = "usersdb"
    container_name = "users"

    # Initialize Cosmos DB client
    client = CosmosClient(endpoint, key)

    # Get the database and container
    database = client.get_database_client(database_name)
    container = database.get_container_client(container_name)

    # Query for the user's document
    query = f"SELECT TOP 1 * FROM c WHERE c.full_name = '{full_name}' ORDER BY c._ts DESC"
    items = container.query_items(query, enable_cross_partition_query=True)

    # Check if the user document exists
    for item in items:
        latest_message = item.get('messages', [])
        if latest_message:
            return func.HttpResponse(
                json.dumps({"message": latest_message[-1]['message']}),
                mimetype="application/json",
                status_code=200
            )
        else:
            return func.HttpResponse(
                json.dumps({"message": f"No messages found for {full_name}."}),
                mimetype="application/json",
                status_code=200
            )

    return func.HttpResponse(
        json.dumps({"message": f"No document found for {full_name}."}),
        mimetype="application/json",
        status_code=404
    )
