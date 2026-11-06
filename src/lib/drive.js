const GIS_SCRIPT = 'https://accounts.google.com/gsi/client'
const PICKER_SCRIPT = 'https://apis.google.com/js/api.js'
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
let sdkPromise

function loadScript(url) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some(s => s.src === url && s.dataset.loaded === 'true')) return resolve()
    const element = document.createElement('script')
    element.src = url
    element.async = true
    element.onload = () => {element.dataset.loaded = 'true';resolve()}
    element.onerror = () => reject(new Error(`Unable to load Google SDK: ${url}`))
    document.head.appendChild(element)
  })
}

export function loadGoogleSdk() {
  if (!sdkPromise) {
    sdkPromise = Promise.all([loadScript(GIS_SCRIPT),loadScript(PICKER_SCRIPT)]).then(() => {
      if (!window.google?.accounts?.oauth2 || !window.gapi) throw new Error('Google sign-in or Picker did not initialize.')
      return new Promise((resolve,reject) => {
        try {window.gapi.load('picker', {callback:resolve,onerror:()=>reject(Error('Google Picker failed to load.'))})}
        catch(e) {reject(e)}
      })
    }).catch(err => {sdkPromise=undefined;throw err})
  }
  return sdkPromise
}

export function initTokenClient(clientId, onResult) {
  if (!window.google?.accounts?.oauth2) throw new Error('Google Identity Services is not loaded.')
  return window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: DRIVE_SCOPE,
    callback: onResult,
    error_callback: (err) => onResult({error: err.type || err.message || 'Google authorization failed.'}),
  })
}

export function openGooglePicker({token, apiKey, projectNumber, onFileSelected}) {
  if (!window.google?.picker) throw new Error('Google Picker is not loaded.')
  if (!apiKey || !projectNumber) throw new Error('Google Picker API key and project number are required.')
  const gp = window.google.picker
  const view = new gp.DocsView(gp.ViewId.DOCS)
    .setMimeTypes('application/json')
    .setMode(gp.DocsViewMode.LIST)
  const picker = new gp.PickerBuilder()
    .addView(view)
    .setOAuthToken(token)
    .setDeveloperKey(apiKey)
    .setAppId(projectNumber)
    .setTitle('Select private PLAYER_SHEET.json (never CAMPAIGN_STATE.json)')
    .setOrigin(window.location.origin)
    .setCallback(response => {
      if (response[gp.Response.ACTION] !== gp.Action.PICKED) return
      const doc = response[gp.Response.DOCUMENTS]?.[0]
      if (doc) onFileSelected({id:doc[gp.Document.ID],name:doc[gp.Document.NAME]})
    })
    .build()
  picker.setVisible(true)
}

export async function fetchDriveJson(fileId, token) {
  if (!fileId) throw Error('Select your player-only JSON file from Google Drive first.')
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
    method: 'GET',
    headers: {Authorization:`Bearer ${token}`},
    cache: 'no-store',
  })
  if (!response.ok) {
    if (response.status === 401) throw Error('Your Google session expired. Sign in again.')
    if (response.status === 403 || response.status === 404) throw Error('Drive access denied. Choose PLAYER_SHEET.json using “Select Drive file” to grant file-specific access.')
    throw Error(`Drive could not load the sheet (HTTP ${response.status}).`)
  }
  return response.json()
}
