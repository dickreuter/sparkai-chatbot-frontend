import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from pprint import pprint
from dotenv import load_dotenv
import os 

load_dotenv()

# Read the API key from the environment variable
api_key = os.getenv('SENDINBLUE_API_KEY')

# Ensure the environment variable is set
if api_key is None:
    raise ValueError("The environment variable SENDINBLUE_API_KEY is not set")

# Set up the configuration
configuration = sib_api_v3_sdk.Configuration()
configuration.api_key['api-key'] = api_key

# Create an instance of the API class
api_instance = sib_api_v3_sdk.ContactsApi(sib_api_v3_sdk.ApiClient(configuration))
#list_id = 3  # ID of the list to which you want to add the email

def add_email_to_brevo_list(email, list_id):
    #meta-guide-download
    create_contact = sib_api_v3_sdk.CreateContact(
        email=email,
        list_ids=[list_id],
    )
    try:
        # Create a contact
        api_response = api_instance.create_contact(create_contact)
        pprint(api_response)
    except ApiException as e:
        print("Exception when calling ContactsApi->create_contact: %s\n" % e)
