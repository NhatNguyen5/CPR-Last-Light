import {readLuckSpent,writeLuckSpent} from './luck.js'
import {DEFAULT_PROFILE_KEY} from './profiles.js'

const KEY='cpr-last-light:luck-profile-v1:'
const key=scope=>KEY+encodeURIComponent(scope)
export function readScopedLuck(storage,scope,playerId,max){
 if(scope===DEFAULT_PROFILE_KEY)return readLuckSpent(storage,playerId,max)
 try{
  const v=JSON.parse(storage?.getItem(key(scope))||'null')
  return v?.scope===scope&&Number.isInteger(v.spent)&&v.spent>=0?Math.min(v.spent,max):0
 }catch{return 0}
}
export function writeScopedLuck(storage,scope,playerId,spent,max){
 if(!scope||!Number.isInteger(spent)||spent<0||spent>max)return false
 if(scope===DEFAULT_PROFILE_KEY)return writeLuckSpent(storage,playerId,spent,max)
 try{storage?.setItem(key(scope),JSON.stringify({scope,spent}));return !!storage}catch{return false}
}
export function clearScopedLuck(storage,scope){
 if(scope===DEFAULT_PROFILE_KEY)return false
 try{storage?.removeItem(key(scope));return true}catch{return false}
}
