import {test} from 'node:test'
import assert from 'node:assert/strict'
import {getDamagePresets,parseDamageDice} from '../src/lib/damagePresets.js'
import {rollDamage,describeRoll,readRollLog,writeRollLog} from '../src/lib/dice.js'

const seq=(...n)=>{let i=0;return ()=>n[i++]}

test('damage parser accepts verified d6 notation, never guesses from other numbers',()=>{
 assert.equal(parseDamageDice('3d6, ROF 2, concealable'),3)
 assert.equal(parseDamageDice('4d6 damage; ROF 1'),4)
 assert.equal(parseDamageDice('Martial Arts unarmed damage: 4d6'),4)
 assert.equal(parseDamageDice('No damage recorded'),null)
 assert.equal(parseDamageDice('6d10'),null)
 assert.equal(parseDamageDice('0d6'),null)
 assert.equal(parseDamageDice('21d6'),null)
 assert.equal(parseDamageDice(undefined),null)
})
test('Isa damage presets read Heavy Pistol and recorded unarmed pools, not ammo',()=>{
 const vm={
  inventory:[
   {id:'isa-heavy',name:'Heavy Pistol',mechanics:'3d6, ROF 2, concealable'},
   {id:'isa-ammo',name:'Basic Heavy Pistol ammunition',mechanics:'3d6'},
   {id:'isa-knife',name:'Combat Knife'},
   {id:'isa-tech',name:'Techtool'}
  ],
  background:{derived:{Brawling_unarmed_damage:'4d6',Martial_Arts_unarmed_damage:'4d6'}}
 }
 assert.deepEqual(getDamagePresets(vm).map(x=>[x.label,x.count,x.sides]),[
  ['Heavy Pistol',3,6],['Brawling (unarmed)',4,6],['Martial Arts (unarmed)',4,6]
 ])
})
test('Nathan owned Very Heavy Pistol gets indexed 4d6 but other characters do not inherit it',()=>{
 const n={inventory:[{id:'v1',name:'Standard Quality Very Heavy Pistol'}],background:{derived:{}}}
 const other={inventory:[{id:'g',name:'Flashlight'}],background:{derived:{}}}
 assert.deepEqual(getDamagePresets(n).map(x=>[x.label,x.count]),[['Standard Quality Very Heavy Pistol',4]])
 assert.deepEqual(getDamagePresets(other),[])
})
test('damage dice roll displays independent dice, modifier and no Skill critical explosion',()=>{
 const roll=rollDamage({label:'Martial Arts (unarmed)',count:4,sides:6,modifier:2,rng:seq(5,5,0,2)})
 assert.deepEqual(roll.dice,[6,6,1,3])
 assert.equal(roll.total,18)
 assert.equal(roll.kind,'damage')
 assert.ok(!Object.hasOwn(roll,'critical'))
 assert.match(describeRoll({...roll,at:1000}),/4d6/)
 assert.match(describeRoll({...roll,at:1000}),/6 \+ 6 \+ 1 \+ 3 \+ 2 = 18/)
 assert.throws(()=>rollDamage({count:0}),/Invalid damage roll/)
 assert.throws(()=>rollDamage({count:21}),/Invalid damage roll/)
})
test('local damage roll history stays separate for each character',()=>{
 const data=new Map()
 const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)}
 const roll=rollDamage({label:'Heavy Pistol',count:3,rng:seq(0,1,2)})
 assert.equal(writeRollLog(storage,[roll],'THE-QUIET-HAND::ISA'),true)
 assert.equal(readRollLog(storage,'THE-QUIET-HAND::ISA')[0].total,6)
 assert.deepEqual(readRollLog(storage),[])
})
