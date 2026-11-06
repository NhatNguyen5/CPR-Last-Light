export const config = {
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  pickerApiKey: import.meta.env.VITE_GOOGLE_PICKER_API_KEY || '',
  googleProjectNumber: import.meta.env.VITE_GOOGLE_PROJECT_NUMBER || '',
  // This ID refers to PLAYER_SHEET.json, not the spoiler-bearing canonical save.
  expectedPlayerFileId: import.meta.env.VITE_PLAYER_FILE_ID || '1aDYZX-cWZYem0yO5-KAqH4VwUUYg1f8e',
  expectedCampaignId: 'CPR-HELIX-LAST-LIGHT-001',
}
