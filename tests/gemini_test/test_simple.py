
import os
import time
import google.generativeai as genai
from google.api_core import exceptions

# Configure API Key (Directly for testing, avoiding env var issues)
# User provided key: AIzaSyBYiVvbMhHm-DfaPMoX1yVlRReOX_1iixU
API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyBYiVvbMhHm-DfaPMoX1yVlRReOX_1iixU")
genai.configure(api_key=API_KEY)

def list_models():
    print("\n--- Listing Available Models ---")
    try:
        found = False
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
                found = True
        if not found:
            print("No models found with generateContent support.")
    except Exception as e:
        print(f"Error listing models: {e}")

def test_model(model_name):
    print(f"\n--- Testing Model: {model_name} ---")
    try:
        model = genai.GenerativeModel(model_name)
        # Simple question as requested
        print(f"QUESTION: Qual a capital da França?")
        response = model.generate_content("Qual a capital da França? Responda em uma frase.")
        print(f"ANSWER: {response.text}")
    except exceptions.NotFound:
        print(f"FAILED (404): Model {model_name} not found for this API Key.")
    except exceptions.ResourceExhausted:
         print(f"FAILED (429): Quota exceeded for {model_name}.")
    except Exception as e:
        print(f"FAILED (Error): {e}")

if __name__ == "__main__":
    print(f"Using API Key: {API_KEY[:10]}...")
    
    # 1. List Models
    list_models()

    # 2. Test Specific Models
    models_to_test = [
        "gemini-1.5-flash",
        "gemini-2.0-flash-exp",
        "gemini-2.5-flash"
    ]

    for m in models_to_test:
        test_model(m)
        time.sleep(2) # Small delay to be nice
