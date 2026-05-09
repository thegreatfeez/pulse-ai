const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// officially "Pre-made" voices (available to Free tier API users)
const PREMADE_VOICES = {
  rachel: '21m00Tcm4TlvDq8ikWAM', // calm, female
  adam:   'pNInz6ovfS8sWCcOKNQC', // deep, narrative male
  bella:  'EXAVITQu4vr4xnSDxMaL', // soft, female
  antoni: 'ErXwobaYiN019PkySvjV', // well-rounded, male
  domi:   'AZnzlk1XvdvUeBnXmlld', // strong, female
  josh:   'TxGEqnHW47igL9Cc0Jzz', // youthful, male
};

const DEFAULT_VOICE_ID = PREMADE_VOICES.antoni; 

export async function synthesizeSpeech(text, apiKey) {
  if (!apiKey) {
    throw new Error('ElevenLabs API Key is missing. Please add VITE_ELEVENLABS_API_KEY to your .env');
  }

  try {
    const response = await fetch(`${ELEVEN_LABS_API_URL}/${DEFAULT_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.message || 'Failed to synthesize speech');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('[ElevenLabs]', error);
    throw error;
  }
}