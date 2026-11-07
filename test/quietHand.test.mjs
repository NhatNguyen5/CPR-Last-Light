import {test} from 'node:test'
import assert from 'node:assert/strict'
import {DEFAULT_PROFILE_KEY,QUIET_HAND_PROFILE_KEY,defaultProfile,quietHandProfile,readProfiles,addProfile,readActiveProfileKey,setActiveProfileKey,readProfileSnapshot,saveProfileSnapshot,removeProfile} from '../src/lib/profiles.js'
import {readScopedLuck,writeScopedLuck} from '../src/lib/scopedLuck.js'
import {readRollLog,writeRollLog} from '../src/lib/dice.js'
import {validatePlayerSheet,getViewModel} from '../src/lib/projection.js'

const storage=()=>{
 const map=new Map()
 return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}
}
const isaProjection={
 projection_schema:'campaign-red-player-projection-v1',
 canonical_campaign_id:'CPR-TE-QUIET-HAND-001',canonical_revision:1,
 player_character:{
  id:'CPR-TE-QUIET-HAND-001-PC-001',full_name:'Isa (13) Yamikage',
  rank:{role:'Solo',level:4,role_ability:'Combat Awareness'},
  role_data:{combat_awareness_unassigned_points:4},
  current_stats:{LUCK:4,REF:8,DEX:8,BODY:14},skills:{'Martial Arts (Karate)':5},
  money:{liquid_balance_eb:30},ip:0,
  derived:{current_hp:60,max_hp:60,current_humanity:30,max_humanity_after_installed_cyberware:38}
 },
 equipment_and_property:{items:[{id:'w1',owner_id:'CPR-TE-QUIET-HAND-001-PC-001',name:'Heavy Pistol',quantity:1}]},
}
test('both established characters are present by default with separate campaign IDs',()=>{
 const p=readProfiles(storage())
 assert.equal(p.length,2)
 assert.equal(p[0].key,DEFAULT_PROFILE_KEY)
 assert.equal(p[1].key,QUIET_HAND_PROFILE_KEY)
 assert.equal(p[0].name,'Nathan Guen')
 assert.equal(p[1].name,'Isa (13) Yamikage')
 assert.equal(p[1].role,'Solo')
 assert.equal(p[1].fileId,'17yfrNWvdHTLwWMgF_5ha_trAXKdyBAJr')
 assert.equal(p[1].source,'drive')
 assert.notEqual(p[0].fileId,p[1].fileId)
 assert.equal(defaultProfile().key,DEFAULT_PROFILE_KEY)
 assert.equal(quietHandProfile().key,QUIET_HAND_PROFILE_KEY)
})
test('verified Isa projection loads into correct view model without a duplicate profile',()=>{
 const store=storage(),sheet=validatePlayerSheet(isaProjection)
 const vm=getViewModel(sheet)
 assert.equal(vm.characterKey,QUIET_HAND_PROFILE_KEY)
 assert.equal(vm.role,'Solo')
 assert.equal(vm.hp,60)
 assert.equal(vm.ip,0)
 const added=addProfile(store,sheet,{fileId:quietHandProfile().fileId,source:'drive'})
 assert.equal(added.key,QUIET_HAND_PROFILE_KEY)
 assert.equal(readProfiles(store).length,2)
 assert.equal(saveProfileSnapshot(store,added,sheet,1234567),true)
 assert.equal(readProfileSnapshot(store,added).sheet.player_character.full_name,'Isa (13) Yamikage')
 assert.equal(readProfileSnapshot(store,readProfiles(store)[0]),null)
 assert.equal(removeProfile(store,QUIET_HAND_PROFILE_KEY),false)
})
test('switching profile selection never merges Luck or rolls into Nathan',()=>{
 const store=storage(),profiles=readProfiles(store)
 assert.equal(readActiveProfileKey(store,profiles),DEFAULT_PROFILE_KEY)
 assert.ok(setActiveProfileKey(store,QUIET_HAND_PROFILE_KEY,profiles))
 assert.equal(readActiveProfileKey(store,profiles),QUIET_HAND_PROFILE_KEY)
 assert.equal(writeScopedLuck(store,QUIET_HAND_PROFILE_KEY,'CPR-TE-QUIET-HAND-001-PC-001',3,4),true)
 assert.equal(readScopedLuck(store,QUIET_HAND_PROFILE_KEY,'CPR-TE-QUIET-HAND-001-PC-001',4),3)
 assert.equal(readScopedLuck(store,DEFAULT_PROFILE_KEY,'CPR-HELIX-PC-001',5),0)
 assert.ok(writeRollLog(store,[{kind:'check',label:'Evasion',total:18}],QUIET_HAND_PROFILE_KEY))
 assert.equal(readRollLog(store,QUIET_HAND_PROFILE_KEY).length,1)
 assert.equal(readRollLog(store).length,0)
})
