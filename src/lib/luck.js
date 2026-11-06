/**
 * Client-side bookkeeping only; never changes Drive or the campaign.
 * Cyberpunk RED: Luck points are committed before a Check and refill per game session.
 */
export const LUCK_TRACKER_KEY='cpr-last-light:luck-session-v1'
export const LUCK_TRACKER_CAMPAIGN='CPR-HELIX-LAST-LIGHT-001'
export const luckStorageKey=(playerId,campaignId)=>LUCK_TRACKER_KEY+':'+encodeURIComponent(campaignId+'::'+playerId)

export function remainingLuck(max,spent){
 if(!Number.isInteger(max)||max<0||!Number.isInteger(spent)||spent<0)return 0
 return Math.max(0,max-spent)
}
export function changeLuckSpent(current,delta,max){
 if(!Number.isInteger(current)||current<0||!Number.isInteger(max)||max<0||!Number.isInteger(delta))return null
 if(current+delta<0||current+delta>max)return null
 return current+delta
}
/** Reject malformed and unrelated records; never auto-reset just because revision changes. */
export function readLuckSpent(storage,playerId,max,campaignId=LUCK_TRACKER_CAMPAIGN){
 try{
  if(typeof playerId!=='string'||!playerId||!Number.isInteger(max)||max<0)return 0
  const record=JSON.parse(storage?.getItem(LUCK_TRACKER_KEY)||'null')
  if(record?.version!==1||record.campaign!==LUCK_TRACKER_CAMPAIGN||record.playerId!==playerId||!Number.isInteger(record.spent)||record.spent<0)return 0
  return Math.min(record.spent,max)
 }catch{return 0}
}
export function writeLuckSpent(storage,playerId,spent,max){
 if(!playerId||!Number.isInteger(max)||max<0||!Number.isInteger(spent)||spent<0||spent>max)return false
 try{
  storage?.setItem(LUCK_TRACKER_KEY,JSON.stringify({version:1,campaign:LUCK_TRACKER_CAMPAIGN,playerId,spent,updatedAt:Date.now()}))
  return !!storage
 }catch{return false}
}
