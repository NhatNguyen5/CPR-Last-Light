import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readCachedPlayerSheet,writeCachedPlayerSheet,clearCachedPlayerSheet,PLAYER_CACHE_KEY} from '../src/lib/cache.js'

const FILE_ID = 'player-projection-1'
const valid = {
  canonical_campaign_id:'CPR-HELIX-LAST-LIGHT-001',canonical_revision:4,
  player_character:{id:'p1',full_name:'Nathan Guen',derived:{current_hp:40},skills:{Business:6}},
  equipment_and_property:{items:[]},
}
function memoryStorage() {
  const map=new Map()
  return {getItem:key=>map.get(key)??null,setItem:(key,val)=>map.set(key,val),removeItem:key=>map.delete(key)}
}

test('stores and restores a validated, player-only offline snapshot without any OAuth token',()=>{
 const store=memoryStorage()
 assert.equal(writeCachedPlayerSheet(store,FILE_ID,FILE_ID,valid,10000),true)
 const raw=store.getItem(PLAYER_CACHE_KEY)
 assert.equal(raw.includes('access_token'),false)
 const cached=readCachedPlayerSheet(store,FILE_ID)
 assert.equal(cached.sheet.canonical_revision,4)
 assert.equal(cached.savedAt,10000)
})
test('cached full campaign saves and cross-file cache are rejected',()=>{
 const store=memoryStorage()
 assert.equal(writeCachedPlayerSheet(store,FILE_ID,FILE_ID,{...valid,gm_only:{spoiler:'no'}},100),false)
 assert.equal(store.getItem(PLAYER_CACHE_KEY),null)
 assert.equal(writeCachedPlayerSheet(store,FILE_ID,FILE_ID,valid,200),true)
 assert.equal(readCachedPlayerSheet(store,'a-different-file'),null)
 assert.equal(store.getItem(PLAYER_CACHE_KEY),null)
})
test('clearing the cache removes the saved sheet',()=>{
 const store=memoryStorage()
 writeCachedPlayerSheet(store,FILE_ID,FILE_ID,valid,300)
 assert.equal(clearCachedPlayerSheet(store),true)
 assert.equal(readCachedPlayerSheet(store,FILE_ID),null)
})
test('corrupt and inaccessible browser storage cannot prevent application startup',()=>{
 const store=memoryStorage()
 store.setItem(PLAYER_CACHE_KEY,'{not json')
 assert.equal(readCachedPlayerSheet(store,FILE_ID),null)
 const blocked={getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('blocked')},removeItem:()=>{throw Error('blocked')}}
 assert.equal(readCachedPlayerSheet(blocked,FILE_ID),null)
 assert.equal(writeCachedPlayerSheet(blocked,FILE_ID,FILE_ID,valid),false)
})
