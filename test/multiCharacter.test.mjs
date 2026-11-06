import {test} from 'node:test'
import assert from 'node:assert/strict'
import {validatePlayerSheet,getViewModel} from '../src/lib/projection.js'
import {readProfiles,addProfile,readActiveProfileKey,setActiveProfileKey,readProfileSnapshot,saveProfileSnapshot,readProfileDraft,writeProfileDraft,removeProfile,DEFAULT_PROFILE_KEY} from '../src/lib/profiles.js'
import {readScopedLuck,writeScopedLuck} from '../src/lib/scopedLuck.js'
import {readRollLog,writeRollLog,clearRollLog} from '../src/lib/dice.js'

function memoryStorage(){
 const data=new Map()
 return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}
}
const sample=(campaign,id,name,role)=>({
 canonical_campaign_id:campaign,canonical_revision:1,
 player_character:{id,full_name:name,rank:{role,level:4},current_stats:{LUCK:5,INT:7,REF:6},derived:{current_hp:30,max_hp:30},skills:{Perception:4},money:{liquid_balance_eb:150},ip:12},
 equipment_and_property:{items:[{id:'gear-1',name:'Flashlight',owner_id:id,quantity:1}]},
})
test('another role and campaign use a separate view model, not Nathan identity',()=>{
 const p=validatePlayerSheet(sample('OTHER-CAMPAIGN-001','PC-002','Test Netrunner','Netrunner'))
 const vm=getViewModel(p)
 assert.equal(vm.campaignId,'OTHER-CAMPAIGN-001')
 assert.equal(vm.characterId,'PC-002')
 assert.equal(vm.role,'Netrunner')
 assert.equal(vm.employer,null)
 assert.equal(vm.driver.id,undefined)
 assert.equal(vm.ip,12)
})
test('canonical and nested GM sections cannot be imported into player library',()=>{
 const p=sample('OTHER-CAMPAIGN-001','PC-002','Test Netrunner','Netrunner')
 assert.throws(()=>validatePlayerSheet({...p,campaign:{id:'secret'}}),/Refusing/)
 assert.throws(()=>validatePlayerSheet({...p,player_character:{...p.player_character,gm_only:{secret:true}}}),/GM-only/)
})
test('profiles, snapshot and draft are independently keyed and Nathan remains default',()=>{
 const store=memoryStorage(),other=sample('OTHER-CAMPAIGN-001','PC-002','Test Netrunner','Netrunner')
 assert.equal(readProfiles(store)[0].key,DEFAULT_PROFILE_KEY)
 const profile=addProfile(store,other)
 assert.equal(readProfiles(store).length,2)
 assert.equal(readActiveProfileKey(store),DEFAULT_PROFILE_KEY)
 assert.ok(setActiveProfileKey(store,profile.key))
 assert.equal(readActiveProfileKey(store),profile.key)
 assert.equal(saveProfileSnapshot(store,profile,other,123),true)
 assert.equal(readProfileSnapshot(store,profile).sheet.player_character.id,'PC-002')
 assert.equal(readProfileSnapshot(store,readProfiles(store)[0]),null)
 assert.equal(writeProfileDraft(store,profile.key,{'gear-1':2}),true)
 assert.deepEqual(readProfileDraft(store,profile.key),{'gear-1':2})
 assert.deepEqual(readProfileDraft(store,DEFAULT_PROFILE_KEY),{})
 assert.equal(removeProfile(store,DEFAULT_PROFILE_KEY),false)
 assert.equal(removeProfile(store,profile.key),true)
 assert.equal(readActiveProfileKey(store),DEFAULT_PROFILE_KEY)
})
test('character-specific LUCK and rolls never cross into Nathan history',()=>{
 const store=memoryStorage()
 const other='OTHER-CAMPAIGN-001::PC-002'
 assert.equal(writeScopedLuck(store,other,'PC-002',3,5),true)
 assert.equal(readScopedLuck(store,other,'PC-002',5),3)
 assert.equal(readScopedLuck(store,DEFAULT_PROFILE_KEY,'CPR-HELIX-PC-001',5),0)
 const roll={kind:'check',label:'Perception',total:17}
 assert.equal(writeRollLog(store,[roll],other),true)
 assert.equal(readRollLog(store,other).length,1)
 assert.equal(readRollLog(store).length,0)
 assert.equal(clearRollLog(store,other),true)
 assert.equal(readRollLog(store,other).length,0)
})
