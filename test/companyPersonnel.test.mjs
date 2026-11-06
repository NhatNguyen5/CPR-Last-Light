import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {getCompanyPersonnel} from '../src/lib/companyPersonnel.js'
import {getViewModel,validatePlayerSheet} from '../src/lib/projection.js'
import {projectPlayer} from '../scripts/project-player.mjs'

const driver={
 id:'CPR-HELIX-NPC-DRIVER-001',name:'not yet assigned on-screen',class:'Company Driver',cover_job:'HR to designate; not fixed by player',
 company_vehicle_id:'car',equipment_ids:['car','armor','pistol','ammo'],
 stats:{INT:5,REF:7,DEX:7,TECH:5,COOL:5,WILL:7,MOVE:4,BODY:7,EMP:3},
 derived:{current_hp:45,max_hp:45,death_save:7,seriously_wounded_threshold_hp:23},
 loyalty:7,loyalty_provenance:'explicitly approved fixed agreed value, NOT actual verified 1d6 roll',
 stats_provenance:'template row 2 as agreed fixed selection, NOT an actual verified roll',
 cyberware_package:['Radar/Sonar Implant','Cyberaudio Suite','Internal Agent','Homing Tracer','Radar Detector'],
 skills_at_rank_2:['Perception'],skills_at_rank_4:['Evasion'],skills_at_rank_6:['Drive Land Vehicle'],
 standard_company_policies:['GM controlled independent NPC'],
}
const items=[
 {id:'car',name:'Compact Groundcar with Seating Upgrade',owner_id:'corp',quantity:1},
 {id:'armor',name:'Light Armorjack — driver',owner_id:'corp',quantity:1},
 {id:'pistol',name:'Very Heavy Pistol — driver',owner_id:'corp',quantity:1},
 {id:'ammo',name:'Basic Very Heavy Pistol ammunition — driver',owner_id:'corp',quantity:50},
 {id:'secret',name:'GM-only item',owner_id:'corp',visibility:'gm-only'},
]
const sample={campaign:{id:'CPR-HELIX-LAST-LIGHT-001'},checkpoint:{revision:1},
 player_character:{id:'p',full_name:'Nathan Guen',skills:{Business:6},derived:{current_hp:40},equipment_item_ids:[]},
 team:{driver},property_and_inventory:{items},people_and_relationships:{},
 gm_only:{prepared_npcs_not_yet_introduced:[{name:'Hidden Villain'}]}}

test('assigned driver becomes a company roster entry without inventing name or title',()=>{
 const vm=getViewModel(validatePlayerSheet(projectPlayer(sample)))
 const people=getCompanyPersonnel(vm)
 assert.equal(people.length,1)
 const p=people[0]
 assert.equal(p.identityPending,true)
 assert.equal(p.label,'Assigned Company Driver')
 assert.equal(p.jobTitle,null)
 assert.equal(p.loyalty,7)
 assert.match(p.loyaltyProvenance,/NOT actual verified/)
 assert.equal(p.stats.REF,7)
 assert.equal(p.derived.current_hp,45)
 assert.equal(p.derived.death_save,7)
 assert.equal(p.vehicle.name,'Compact Groundcar with Seating Upgrade')
 assert.deepEqual(p.equipment.map(i=>i.name),['Light Armorjack — driver','Very Heavy Pistol — driver','Basic Very Heavy Pistol ammunition — driver'])
 assert.equal(p.equipment[2].quantity,50)
 assert.equal(p.cyberware.length,5)
 assert.deepEqual(p.skills.map(x=>x.rank),[2,4,6])
 assert.ok(!JSON.stringify(vm).includes('Hidden Villain'))
 assert.ok(!JSON.stringify(people).includes('GM-only item'))
})
test('does not fabricate company employees when no teammate is assigned',()=>{
 assert.deepEqual(getCompanyPersonnel({driver:{}}),[])
 assert.deepEqual(getCompanyPersonnel({driver:{id:'x',class:'Other'}}),[])
})
test('future verified introductions update display name and job title via projection only',()=>{
 const vm=getViewModel(projectPlayer({...sample,team:{driver:{...driver,name:'Recorded Staffer',cover_job:'Corporate Driver'}}}))
 const p=getCompanyPersonnel(vm)[0]
 assert.equal(p.label,'Recorded Staffer')
 assert.equal(p.identityPending,false)
 assert.equal(p.jobTitle,'Corporate Driver')
})
