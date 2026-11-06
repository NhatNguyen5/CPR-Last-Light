import {validatePlayerSheet} from './projection.js'
import {readCachedPlayerSheet} from './cache.js'
import {config} from '../config.js'

export const PROFILE_INDEX_KEY='cpr-last-light:character-profiles-v1'
export const ACTIVE_PROFILE_KEY='cpr-last-light:active-profile-v1'
export const DEFAULT_PROFILE_KEY='CPR-HELIX-LAST-LIGHT-001::CPR-HELIX-PC-001'
const MAX_PROFILES=32
const CACHE_PREFIX='cpr-last-light:profile-snapshot-v1:'
const DRAFT_PREFIX='cpr-last-light:inventory-draft-v1:'
const clean=v=>typeof v==='string' ? v.trim().slice(0,160) : ''
const storageGet=(storage,key)=>{try{return storage?.getItem(key)||null}catch{return null}}
const storageSet=(storage,key,v)=>{try{storage?.setItem(key,v);return !!storage}catch{return false}}
const storageRemove=(storage,key)=>{try{storage?.removeItem(key);return true}catch{return false}}
export function profileKey(campaignId,characterId){
 const campaign=clean(campaignId),character=clean(characterId)
 if(!campaign||!character||campaign.includes('::')||character.includes('::'))throw Error('A campaign ID and character ID are required.')
 return campaign+'::'+character
}
export function defaultProfile(){return {
 key:DEFAULT_PROFILE_KEY,campaignId:'CPR-HELIX-LAST-LIGHT-001',
 characterId:'CPR-HELIX-PC-001',name:'Nathan Guen',role:'Exec',
 fileId:config.expectedPlayerFileId,source:'drive',
}}
export function profileFromSheet(sheet,fileId='',source='local'){
 const safe=validatePlayerSheet(sheet),pc=safe.player_character
 return {
  key:profileKey(safe.canonical_campaign_id,pc.id),
  campaignId:safe.canonical_campaign_id,characterId:pc.id,name:pc.full_name,
  role:pc.rank?.role||pc.role||'Unspecified',
  fileId:clean(fileId),source:source==='drive'?'drive':'local',
 }
}
function sanitizeProfile(p){
 if(!p||typeof p!=='object')return null
 try{
  const key=profileKey(p.campaignId,p.characterId)
  if(key!==p.key||!clean(p.name))return null
  return {key,campaignId:clean(p.campaignId),characterId:clean(p.characterId),
   name:clean(p.name),role:clean(p.role)||'Unspecified',fileId:clean(p.fileId),
   source:p.source==='drive'?'drive':'local'}
 }catch{return null}
}
export function readProfiles(storage){
 let list=[]
 try{const value=JSON.parse(storageGet(storage,PROFILE_INDEX_KEY)||'[]');if(Array.isArray(value))list=value}catch{}
 const result=[defaultProfile()],seen=new Set([DEFAULT_PROFILE_KEY])
 for(const item of list){
  const p=sanitizeProfile(item)
  if(!p||seen.has(p.key))continue
  seen.add(p.key);result.push(p)
  if(result.length>=MAX_PROFILES)break
 }
 // Persisted metadata for Nathan may refresh his name/role but must never change his identity.
 const stored=list.find(p=>p?.key===DEFAULT_PROFILE_KEY)
 const p=sanitizeProfile(stored)
 if(p)result[0]={...p,fileId:p.fileId||config.expectedPlayerFileId}
 return result
}
export function writeProfiles(storage,profiles){
 if(!Array.isArray(profiles)||profiles.length>MAX_PROFILES)return false
 const result=profiles.map(sanitizeProfile)
 if(result.some(x=>!x))return false
 const keys=result.map(x=>x.key)
 if(new Set(keys).size!==keys.length)return false
 return storageSet(storage,PROFILE_INDEX_KEY,JSON.stringify(result))
}
export function addProfile(storage,sheet,{fileId='',source='local'}={}){
 const candidate=profileFromSheet(sheet,fileId,source)
 const existing=readProfiles(storage)
 const i=existing.findIndex(p=>p.key===candidate.key)
 if(i===-1&&existing.length>=MAX_PROFILES)throw Error('Profile limit reached.')
 if(i!==-1)existing[i]={...candidate,fileId:candidate.fileId||existing[i].fileId,source:candidate.fileId?'drive':candidate.source}
 else existing.push(candidate)
 if(!writeProfiles(storage,existing))throw Error('Could not store character directory. Check browser storage permissions.')
 return candidate
}
export function readActiveProfileKey(storage,profiles=readProfiles(storage)){
 const key=storageGet(storage,ACTIVE_PROFILE_KEY)
 return profiles.some(x=>x.key===key)?key:DEFAULT_PROFILE_KEY
}
export function setActiveProfileKey(storage,key,profiles=readProfiles(storage)){
 if(!profiles.some(x=>x.key===key))return false
 return storageSet(storage,ACTIVE_PROFILE_KEY,key)
}
function cacheKey(key){return CACHE_PREFIX+encodeURIComponent(key)}
function draftKey(key){return DRAFT_PREFIX+encodeURIComponent(key)}
export function readProfileSnapshot(storage,profile){
 if(!profile)return null
 try{
  const raw=storageGet(storage,cacheKey(profile.key))
  if(raw){
   const data=JSON.parse(raw)
   const sheet=validatePlayerSheet(data.sheet)
   if(profileKey(sheet.canonical_campaign_id,sheet.player_character.id)!==profile.key)return null
   return {sheet,savedAt:data.savedAt}
  }
  // Seamless migration of Nathan's pre-existing private offline copy.
  if(profile.key===DEFAULT_PROFILE_KEY){
   const legacy=readCachedPlayerSheet(storage,config.expectedPlayerFileId)
   if(legacy) return legacy
  }
 }catch{}
 return null
}
export function saveProfileSnapshot(storage,profile,sheet,savedAt=Date.now()){
 if(!profile||!Number.isFinite(savedAt))return false
 try{
  const safe=validatePlayerSheet(sheet)
  if(profileKey(safe.canonical_campaign_id,safe.player_character.id)!==profile.key)return false
  const record=JSON.stringify({savedAt,sheet:safe})
  if(record.length>2000000)return false
  return storageSet(storage,cacheKey(profile.key),record)
 }catch{return false}
}
export function clearProfileSnapshot(storage,key){return storageRemove(storage,cacheKey(key))}
export function readProfileDraft(storage,key){
 try{
  const draft=JSON.parse(storageGet(storage,draftKey(key))||'{}')
  if(!draft||typeof draft!=='object'||Array.isArray(draft))return {}
  return Object.fromEntries(Object.entries(draft).filter(([id,n])=>clean(id)&&Number.isInteger(n)&&n>=-9999&&n<=9999).slice(0,200))
 }catch{return {}}
}
export function writeProfileDraft(storage,key,draft){
 if(!key||!draft||typeof draft!=='object'||Array.isArray(draft))return false
 return storageSet(storage,draftKey(key),JSON.stringify(draft))
}
export function removeProfile(storage,key){
 if(key===DEFAULT_PROFILE_KEY)return false
 const list=readProfiles(storage)
 if(!list.some(p=>p.key===key))return false
 const next=list.filter(p=>p.key!==key)
 if(!writeProfiles(storage,next))return false
 clearProfileSnapshot(storage,key);storageRemove(storage,draftKey(key))
 if(readActiveProfileKey(storage,list)===key)setActiveProfileKey(storage,DEFAULT_PROFILE_KEY,next)
 return true
}
