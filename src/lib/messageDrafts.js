/** Scoped local unsent drafts: never transmit messages or edit campaign state. */
const KEY='cpr-last-light:agent-message-draft-v1:'
export const draftKey=(characterKey,threadId)=>KEY+encodeURIComponent(characterKey)+'::'+encodeURIComponent(threadId)
export function readMessageDraft(storage,characterKey,threadId){
 if(!characterKey||!threadId)return ''
 try{const value=storage?.getItem(draftKey(characterKey,threadId));return typeof value==='string'?value.slice(0,3000):''}catch{return ''}
}
export function writeMessageDraft(storage,characterKey,threadId,value){
 if(!characterKey||!threadId||typeof value!=='string'||value.length>3000)return false
 try{storage?.setItem(draftKey(characterKey,threadId),value);return Boolean(storage)}catch{return false}
}
export function clearMessageDraft(storage,characterKey,threadId){
 if(!characterKey||!threadId)return false
 try{storage?.removeItem(draftKey(characterKey,threadId));return true}catch{return false}
}
