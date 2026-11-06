import {test} from 'node:test'
import assert from 'node:assert/strict'
import {classifyItem,describeItem,effectiveQuantity,GEAR_TABS,stageQuantityDelta} from '../src/lib/itemReference.js'
const item=(name,quantity=1,id=name)=>({name,id,quantity})
test('companion category order and categorization',()=>{
 assert.deepEqual(GEAR_TABS,['Ammo','Armor','Clothing','Cyberware','Gear','Programs','Vehicles','Weapons'])
 for(const [name,category] of [['Basic Very Heavy Pistol rounds','Ammo'],['Light Armorjack head armor','Armor'],['Businesswear Top','Clothing'],['Cyberaudio Suite','Cyberware'],['Smart Glasses','Cyberware'],['Techtool','Gear'],['Compact Groundcar with Seating Upgrade','Vehicles'],['Standard Quality Very Heavy Pistol','Weapons']]){
  assert.equal(classifyItem(item(name)),category,name)
 }
})
test('core reference text includes actual mechanics and pages',()=>{
 assert.match(describeItem(item('Enhanced Antibodies')).rules,/2 × BODY/)
 assert.equal(describeItem(item('Biomonitor fashionware')).page,358)
 assert.match(describeItem(item('Cyberaudio Suite')).rules,/Three option slots/)
 assert.match(describeItem(item('Smart Glasses')).rules,/Two cybereye option slots/)
 assert.match(describeItem(item('Light Armorjack body armor')).rules,/SP 11/)
})
test('unmapped items use saved notes and do not invent rules',()=>{
 const result=describeItem({name:'Mystery device',notes:'Save says this is a test'})
 assert.equal(result.isRulesReference,false)
 assert.equal(result.rules,null)
 assert.equal(result.description,'Save says this is a test')
})
test('quantity stepper only updates local draft and cannot go below zero',()=>{
 const record=item('Duct Tape',1,'item-4')
 let draft={}
 draft=stageQuantityDelta(draft,record,-1)
 assert.equal(effectiveQuantity(record,draft),0)
 draft=stageQuantityDelta(draft,record,-1)
 assert.equal(effectiveQuantity(record,draft),0)
 draft=stageQuantityDelta(draft,record,1)
 assert.deepEqual(draft,{})
 assert.equal(record.quantity,1)
})
