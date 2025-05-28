# OpenAI API Key Setup for UBA Form Maker

The UBA Form Maker's conversational AI features require an OpenAI API key to function. Without it, the form will still work but without AI-powered assistance.

## Setup Instructions

1. **Get an OpenAI API Key**:
   - Go to https://platform.openai.com/api-keys
   - Sign in or create an account
   - Click "Create new secret key"
   - Copy the key (it starts with `sk-`)

2. **Add to Environment Variables**:
   
   ### For Local Development:
   Create or edit the `.env` file in your project root:
   ```
   OPENAI_API_KEY=sk-your-api-key-here
   ```

   ### For Production (Replit):
   1. In your Replit project, click on "Secrets" (🔐 icon) in the left sidebar
   2. Add a new secret:
      - Key: `OPENAI_API_KEY`
      - Value: Your OpenAI API key
   3. Click "Add Secret"

3. **Restart the Server**:
   After adding the API key, restart your server for the changes to take effect.

## Current Behavior Without API Key

When the OpenAI API key is not configured:
- The conversational interface still works
- You'll receive a message indicating AI features are unavailable
- The form can still be filled manually using the form view
- Basic guidance is provided without AI assistance

## Verifying Setup

Once configured, the UBA Form Maker will:
- Process natural language inputs
- Extract data from conversations automatically
- Provide intelligent suggestions
- Apply UBA Guide rules automatically
- Offer document upload prompts at appropriate times

## Cost Considerations

- The form uses GPT-4 by default for best accuracy
- Each conversation typically uses ~1,000-2,000 tokens
- Monitor your OpenAI usage at https://platform.openai.com/usage

## Troubleshooting

If you still see errors after adding the API key:
1. Check that the key is correct (no extra spaces)
2. Verify the key is active on OpenAI's platform
3. Ensure your OpenAI account has available credits
4. Check server logs for specific error messages