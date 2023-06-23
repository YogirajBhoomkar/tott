import logging
import datetime
import azure.functions as func
from azure.cosmos import exceptions, CosmosClient, PartitionKey
import openai

OPENAI_API_KEY = "3d2b26f518064f5a89ef323ee4f50670"
openai.api_key = OPENAI_API_KEY
openai.api_base = "https://azopenai1.openai.azure.com/"  # Replace with your API base URL
openai.api_type = 'azure'
openai.api_version = '2023-05-15'
deployment_name = 'OpenAI2'

def synthesize_using_chatGPT(text):
    messages = [{'role': 'system', 'content': "do as instructed by user. your response should be very funny and should be in hinglish."}, {'role': 'user', 'content': text}]
    response = openai.ChatCompletion.create(
        engine=deployment_name,
        messages=messages,
        max_tokens=800,
        temperature=0.7,
    )
    final_text = response['choices'][0]['message']['content'].strip()
    return final_text


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    sender = None
    recipient = None
    message = None

    req_body = req.get_json()
    if req_body:
        sender = req_body.get('sender')
        recipient = req_body.get('recipient')
        message = req_body.get('message')

    if sender and recipient and message:
        logging.info(f"Sender: {sender}")
        logging.info(f"Recipient: {recipient}")
        logging.info(f"Message: {message}")

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

        # Query for the recipient's document
        query = f"SELECT * FROM c WHERE c.full_name = '{recipient}'"
        items = container.query_items(query, enable_cross_partition_query=True)

        # Check if the recipient document exists
        items_list = []
        for each_document_print in items:
            items_list.append(each_document_print)
            logging.info(f"pre print item:{each_document_print}")
        if len(items_list) > 0:
            # Get the first item from the iterator
            logging.info("inside if statement")
            for each_document in items_list:
                recipient_document = each_document
                logging.info(f"recipient_document: {recipient_document}")
                recipient_messages = recipient_document.get('messages', [])
                logging.info(f"recipient_messages: {recipient_messages}")
                
                # Use Azure OpenAI to generate a response
                final_text = synthesize_using_chatGPT(message)

                new_message = {
                    "timestamp": datetime.datetime.now().isoformat(),
                    "sender": sender,
                    "avatar": "<sender_avatar_url>",
                    "message": final_text
                }

                # Add the new message to the recipient's message list
                recipient_messages.append(new_message)
                logging.info(f"after appending recipient_messages: {recipient_messages}")
                recipient_document['messages'] = recipient_messages

                # Update the recipient's document in Cosmos DB
                container.upsert_item(recipient_document)
                return func.HttpResponse(f"Message added to {recipient}'s document.", status_code=200)
        else:
            logging.info("inside else statement")
            return func.HttpResponse(f"Recipient {recipient} has not yet registered.", status_code=400)
    else:
        logging.info("inside last else statement")
        return func.HttpResponse(
            "Please provide sender, recipient, and message details in the request body.",
            status_code=400
        )
