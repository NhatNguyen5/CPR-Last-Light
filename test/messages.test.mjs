import {test} from 'node:test'
import assert from 'node:assert/strict'
import {buildMessageThreads,agentMessageTime} from '../src/lib/messages.js'
import {readMessageDraft,writeMessageDraft,clearMessageDraft} from '../src/lib/messageDrafts.js'
import {getViewModel,validatePlayerSheet} from '../src/lib/projection.js'
import {projectPlayer} from '../scripts/project-player.mjs'

const text="Hey, Nate.\n\nIt's Christian. Found your name in Helix's directory."
const christian={
 id:'christian',name:'Christian',role:'long-lost close friend',
 last_contact:'2045-06-13 12:02 incoming personal Agent message (read at 12:15); Nathan has not replied',
 new_message:text
}
const makeStore=()=>{
 const data=new Map()
 return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)}
}
test('actual player-known Christian message is displayed verbatim and marked already read',()=>{
 const threads=buildMessageThreads({friends:[christian],family:[{id:'anna',name:'Anna Le'}]})
 assert.equal(threads.length,1)
 assert.equal(threads[0].name,'Christian')
 assert.equal(threads[0].messages.length,1)
 assert.equal(threads[0].messages[0].body,text)
 assert.equal(threads[0].messages[0].at,'2045-06-13T12:02')
 assert.equal(threads[0].messages[0].read,true)
 assert.equal(threads[0].unread,0)
 assert.equal(agentMessageTime(threads[0].lastAt),'2045-06-13 · 12:02')
})
test('contacts and player knowledge do not invent messages or sent replies',()=>{
 const threads=buildMessageThreads({
  friends:[{id:'a',name:'Anna Le'},{id:'c',name:'Christian',last_contact:'2026-01-01 12:00'}],
  knownNpcs:[{id:'x',name:'Mira Chen',relationship:'private work tension'}],
  knowledge:['Sent two pressure messages to Chen']
 })
 assert.deepEqual(threads,[])
})
test('future explicitly player-visible threads and multiple messages are handled independently',()=>{
 const threads=buildMessageThreads({
  agentMessages:[
   {id:'2',thread_id:'m',contact_name:'Mara',body:'Acknowledged.',direction:'incoming',sent_at:'2045-06-14T09:03',read:false},
   {id:'1',thread_id:'m',contact_name:'Mara',text:'Pickup?',direction:'outgoing',sent_at:'2045-06-14T09:00'},
   {id:'bad',thread_id:'s',contact_name:'Private',body:'Spoiler',visibility:'gm-only'},
  ]
 })
 assert.equal(threads.length,1)
 assert.deepEqual(threads[0].messages.map(m=>m.body),['Pickup?','Acknowledged.'])
 assert.equal(threads[0].unread,1)
})
test('unsent reply drafts stay separated by campaign, character and conversation',()=>{
 const store=makeStore()
 const x='CAMP-1::PC-1',y='CAMP-2::PC-1'
 assert.equal(writeMessageDraft(store,x,'christian','Beer sounds good.'),true)
 assert.equal(readMessageDraft(store,x,'christian'),'Beer sounds good.')
 assert.equal(readMessageDraft(store,y,'christian'),'')
 assert.equal(readMessageDraft(store,x,'anna'),'')
 assert.equal(clearMessageDraft(store,x,'christian'),true)
 assert.equal(readMessageDraft(store,x,'christian'),'')
 assert.equal(writeMessageDraft(store,x,'christian','x'.repeat(3001)),false)
})
test('explicit player-only contact message survives strict canonical projection',()=>{
 const canonical={
  campaign:{id:'CPR-HELIX-LAST-LIGHT-001'},checkpoint:{revision:3},
  player_character:{id:'CPR-HELIX-PC-001',full_name:'Nathan Guen',derived:{current_hp:40},skills:{}},
  people_and_relationships:{personal_connections:[christian]},
  team:{},property_and_inventory:{items:[]}
 }
 const projection=projectPlayer(canonical)
 const vm=getViewModel(validatePlayerSheet(projection))
 assert.equal(buildMessageThreads(vm)[0].messages[0].body,text)
 assert.equal(JSON.stringify(projection).includes('gm_only'),false)
})
