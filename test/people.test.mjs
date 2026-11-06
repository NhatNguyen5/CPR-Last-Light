import {test} from 'node:test'
import assert from 'node:assert/strict'
import {knownPeople,contactPeople} from '../src/lib/people.js'
test('only recorded player-known people appear, excluding unnamed driver/boss',()=>{
 const vm={family:[{id:'a',name:'Anna Le',relation:'wife'}],friends:[{id:'c',name:'Christian',role:'old friend'}],knownNpcs:[{id:'x',name:'unestablished'}, {id:'a',name:'Anna Le',contact_known:true},{id:'n',name:'Known Medic',contact_known:false}]}
 assert.deepEqual(knownPeople(vm).map(x=>x.name),['Anna Le','Christian','Known Medic'])
 assert.deepEqual(contactPeople(vm).map(x=>x.name),['Anna Le','Christian'])
})
