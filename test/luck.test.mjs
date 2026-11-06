import {test} from 'node:test'
import assert from 'node:assert/strict'
import {LUCK_TRACKER_KEY,LUCK_TRACKER_CAMPAIGN,changeLuckSpent,remainingLuck,readLuckSpent,writeLuckSpent} from '../src/lib/luck.js'
const data=new Map()
const store={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}
test('Luck 5 remains within 0–5 and rejects overspending or over-refunds',()=>{
 assert.equal(remainingLuck(5,0),5)
 assert.equal(changeLuckSpent(0,3,5),3)
 assert.equal(changeLuckSpent(3,2,5),5)
 assert.equal(changeLuckSpent(5,1,5),null)
 assert.equal(changeLuckSpent(0,-1,5),null)
 assert.equal(remainingLuck(5,3),2)
})
test('Luck persists across reloads and revision changes, scoped to Nathan',()=>{
 data.clear()
 assert.equal(writeLuckSpent(store,'CPR-HELIX-PC-001',2,5),true)
 assert.equal(readLuckSpent(store,'CPR-HELIX-PC-001',5),2)
 assert.equal(readLuckSpent(store,'another-character',5),0)
 const record=JSON.parse(data.get(LUCK_TRACKER_KEY))
 assert.equal(record.campaign,LUCK_TRACKER_CAMPAIGN)
 assert.equal(record.version,1)
 assert.equal(Object.hasOwn(record,'revision'),false)
 assert.equal(Object.hasOwn(record,'accessToken'),false)
})
test('corrupt records and unavailable storage do not invent spending',()=>{
 data.clear();data.set(LUCK_TRACKER_KEY,'bad')
 assert.equal(readLuckSpent(store,'CPR-HELIX-PC-001',5),0)
 data.set(LUCK_TRACKER_KEY,JSON.stringify({version:1,campaign:LUCK_TRACKER_CAMPAIGN,playerId:'CPR-HELIX-PC-001',spent:20}))
 assert.equal(readLuckSpent(store,'CPR-HELIX-PC-001',5),5)
 assert.equal(writeLuckSpent(null,'CPR-HELIX-PC-001',1,5),false)
 assert.equal(writeLuckSpent(store,'CPR-HELIX-PC-001',6,5),false)
})
test('pool only refills following an explicit reset action',()=>{
 data.clear();writeLuckSpent(store,'CPR-HELIX-PC-001',5,5)
 assert.equal(remainingLuck(5,readLuckSpent(store,'CPR-HELIX-PC-001',5)),0)
 writeLuckSpent(store,'CPR-HELIX-PC-001',0,5)
 assert.equal(readLuckSpent(store,'CPR-HELIX-PC-001',5),0)
})
