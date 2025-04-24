import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def transcribe_audio(audio_file_path):
    # transcription API call 
    try:
        with open(audio_file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        return transcription.text
    #error if transcription is not working 
    except Exception as e:
        print(f"Error in transcription: {str(e)}")
        return None 