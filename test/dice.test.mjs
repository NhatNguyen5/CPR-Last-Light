import {test} from 'node:test'
import assert from 'node:assert/strict'
import {secureDie,rollRedCheck,rollInitiative,rollDamage,readRollLog,writeRollLog,clearRollLog,describeRoll,ROLL_LOG_KEY} from '../src/lib/dice.js'
const seq=(...values)=>{let i=0;return ()=>values[i++]}
test('uniform die maps uint32 without modulo bias',()=>{
 assert.equal(secureDie(10,seq(0)),1)
 assert.equal(secureDie(10,seq(9)),10)
 assert.equal(secureDie(10,seq(4294967295,5)),6)
 assert.throws(()=>secureDie(10,()=>undefined),/unavailable/)
})
test('natural ten adds exactly one extra roll, even when follow-up is ten',()=>{
 const x=rollRedCheck({label:'Business',base:14,rng:seq(9,9)})
 assert.equal(x.total,34);assert.equal(x.second,10);assert.equal(x.critical,'success')
})
test('natural one subtracts exactly one extra roll',()=>{
 const x=rollRedCheck({label:'Evasion',base:9,modifier:-2,rng:seq(0,9)})
 assert.equal(x.total,-2);assert.equal(x.critical,'failure');assert.equal(x.second,10)
})
test('normal Skill and initiative differ on a ten',()=>{
 assert.equal(rollRedCheck({base:12,rng:seq(5)}).total,18)
 assert.equal(rollInitiative({base:8,rng:seq(9)}).total,18)
})
test('damage rolls add separate six-sided dice without critical effects',()=>{
 const x=rollDamage({count:4,rng:seq(0,1,2,3)})
 assert.deepEqual(x.dice,[1,2,3,4]);assert.equal(x.total,10)
})
test('roll history stays local, bounded, clearable; descriptions retain breakdown',()=>{
 const data=new Map();const store={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}
 const rolls=Array.from({length:40},(_,i)=>({kind:'check',label:`Check${i}`,total:i}))
 assert.equal(writeRollLog(store,rolls),true)
 assert.equal(readRollLog(store).length,30)
 assert.match(describeRoll({...rollRedCheck({label:'Handgun',base:12,rng:seq(5)}),at:1000}),/not committed/)
 assert.equal(clearRollLog(store),true);assert.equal(store.has,undefined);assert.equal(data.has(ROLL_LOG_KEY),false)
})
