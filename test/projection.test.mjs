import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectPlayer} from '../scripts/project-player.mjs'
import {validatePlayerSheet,getViewModel} from '../src/lib/projection.js'

const sample={
 campaign:{id:'CPR-HELIX-LAST-LIGHT-001'},checkpoint:{revision:5},
 player_character:{id:'p1',full_name:'Nathan Guen',rank:{role:'Exec',level:4},skills:{Business:6},derived:{current_hp:40,max_hp:40,current_humanity:58,max_humanity_after_installed_cyberware:64},current_stats:{INT:8},equipment_item_ids:['i1'],money:{liquid_balance_eb:40}},
 world:{fictional_calendar:'2045-06-13',time_local:'08:30',current_scene:{location_name:'Office'}},
 property_and_inventory:{items:[{id:'i1',name:'Pistol',owner_id:'p1'},{id:'secret1',name:'Secret bomb',visibility:'gm-only'}]},
 people_and_relationships:{},team:{driver:{equipment_ids:[]}},
 gm_only:{prepared_npcs_not_yet_introduced:[{name:'Secret villain'}]},
 knowledge:{pc_knows:['Pistol is mine']},
}
test('projection is safe, excludes unrevealed GM truth and hidden inventory',()=>{
 const projection=projectPlayer(sample)
 assert.equal(projection.canonical_revision,5)
 assert.equal(projection.equipment_and_property.items.length,1)
 assert.ok(!JSON.stringify(projection).includes('Secret villain'))
 assert.ok(!JSON.stringify(projection).includes('Secret bomb'))
 assert.ok(!Object.hasOwn(projection,'gm_only'))
 assert.equal(getViewModel(validatePlayerSheet(projection)).hp,40)
})
test('canonical save cannot be loaded into the viewer',()=>{
 assert.throws(()=>validatePlayerSheet(sample),/GM-only|unfiltered/i)
})
test('rejects cross-campaign projections',()=>{
 assert.throws(()=>projectPlayer({...sample,campaign:{id:'other'}}),/Wrong campaign/)
})

test('introduced known NPCs project only explicitly visible fields; no prepared NPC leakage',()=>{
 const known={id:'seen',name:'Known coworker',role:'Engineer',description:'Observed at work',contact_known:true,visibility:'player-known',known_to_pc:true,secret:'Do not export'}
 const hidden={id:'hidden',name:'Unknown operative',visibility:'gm-only',known_to_pc:false,secret:'Hide me'}
 const p=projectPlayer({...sample,people_and_relationships:{player_known_npcs:[known,hidden]}})
 assert.equal(p.family_and_connections.known_npcs.length,1)
 assert.equal(p.family_and_connections.known_npcs[0].name,'Known coworker')
 assert.ok(!JSON.stringify(p).includes('Do not export'))
 assert.ok(!JSON.stringify(p).includes('Unknown operative'))
})

test('unspent IP and optional player-visible Reputation are read without defaults',()=>{
  const projected=projectPlayer({...sample,player_character:{...sample.player_character,ip:0,reputation:3}})
  const view=getViewModel(validatePlayerSheet(projected))
  assert.equal(view.ip,0)
  assert.equal(view.reputation,3)
  assert.equal(getViewModel(validatePlayerSheet(projectPlayer(sample))).reputation,null)
})
