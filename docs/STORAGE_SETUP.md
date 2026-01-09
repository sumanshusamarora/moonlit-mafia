# Firebase Storage Setup for Voice Messages

## Voice Message UX

The voice recorder uses a **hold-to-record** pattern for a mobile-friendly experience:

1. **Record**: Hold down the microphone button (works with mouse or touch)
2. **Stop**: Release the button to stop recording
3. **Preview**: After recording, you'll see:
   - Voice duration
   - Delete button (trash icon) to discard the recording
4. **Send**: Use the main chat Send button to send the voice message
5. **Note**: You can only have either text OR voice ready to send, not both

This pattern is similar to WhatsApp, Telegram, and other modern messaging apps.

---

## Quick Fix for "storage/unauthorized" Error

If you're getting a permission error when trying to send voice messages, you need to deploy the Storage security rules:

### Step-by-Step Instructions:

1. **Open Firebase Console**
   - Go to [console.firebase.google.com](https://console.firebase.google.com/)
   - Select your project (moonlit-mafia)

2. **Navigate to Storage**
   - Click "Build" in the left sidebar
   - Click "Storage"
   - Click on the "Rules" tab at the top

3. **Replace the Rules**
   - You'll see the default rules that look like this:
     ```
     rules_version = '2';
     service firebase.storage {
       match /b/{bucket}/o {
         match /{allPaths=**} {
           allow read, write: if request.time < timestamp.date(2025, 2, 8);
         }
       }
     }
     ```
   
   - Delete everything and paste the contents from `storage.rules` file in this repository:
     ```
     rules_version = '2';

     service firebase.storage {
       match /b/{bucket}/o {
         
         match /voice-messages/{gameId}/{fileName} {
           allow create: if request.auth != null 
                         && request.resource.size < 5 * 1024 * 1024
                         && request.resource.contentType.matches('audio/.*');
           
           allow update, delete: if request.auth != null;
           allow read: if true;
         }
         
         match /{allPaths=**} {
           allow read, write: if false;
         }
       }
     }
     ```

4. **Publish the Rules**
   - Click the "Publish" button at the top right
   - Wait for confirmation that rules are deployed

5. **Test Voice Messages**
   - Return to your app and try sending a voice message again
   - It should now work!

## What These Rules Do:

- **Allow authenticated users** (including anonymous) to upload voice messages
- **Limit file size** to 5MB maximum
- **Restrict file type** to audio files only
- **Allow public read access** so anyone can play voice messages
- **Organize by game ID** for easy management and cleanup
- **Deny everything else** for security

## Troubleshooting:

If you still get errors after deploying rules:

1. **Check Authentication**: Make sure you're signed in (anonymous auth should happen automatically)
2. **Check Browser Console**: Look for more detailed error messages
3. **Verify Rules Published**: In Firebase Console > Storage > Rules, confirm your new rules are there
4. **Clear Browser Cache**: Sometimes old security tokens are cached
5. **Check Storage Region**: Ensure Storage is enabled in the same region as Firestore

## Production Considerations:

For production deployment:

- Consider adding user-specific upload limits (e.g., max 10 messages per game)
- Add file cleanup rules (delete old voice messages after game ends)
- Monitor Storage usage in Firebase Console
- Set up Firebase Storage costs alerts
- Consider implementing Cloud Functions to automatically clean up voice messages when games are archived
