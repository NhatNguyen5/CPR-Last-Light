/**
 * Build an Agent inbox exclusively from player-visible message content.
 * Presence in a contact directory never implies a conversation happened.
 */
const clean=v=>typeof v==='string'?v.trim():''
const choose=(...values)=>values.map(clean).find(Boolean)||''
const safeArray=v=>Array.isArray(v)?v:[]
const hasId=p=>p&&typeof p==='object'&&clean(p.name)
const timestampFromContact=value=>{
 const match=clean(value).match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/)
 return match?match[1]+'T'+match[2]:null
}
export const agentMessageTime=value=>{
 const raw=clean(value)
 if(!raw)return 'Time not recorded'
 const match=raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
 return match?match[1]+' · '+match[2]:raw.slice(0,48)
}
export function buildMessageThreads(vm={}){
 const threads=new Map()
 function add(threadId,name,message,metadata={}){
  const key=clean(threadId),speaker=clean(name),body=clean(message?.body||message?.text)
  if(!key||!speaker||!body)return
  if(!threads.has(key))threads.set(key,{id:key,name:speaker,subtitle:metadata.subtitle||'',messages:[],lastContact:metadata.lastContact||''})
  const thread=threads.get(key)
  const id=clean(message.id)||key+'-'+String(thread.messages.length+1)
  if(thread.messages.some(m=>m.id===id))return
  thread.messages.push({
   id,body,
   direction:message.direction==='outgoing'?'outgoing':'incoming',
   at:clean(message.at)||null,
   read:message.read===true,
  })
 }
 const people=[...safeArray(vm.family),...safeArray(vm.friends),...safeArray(vm.knownNpcs)]
 const seenContacts=new Set()
 for(const person of people){
  if(!hasId(person))continue
  const id=choose(person.id,person.name),name=person.name
  if(seenContacts.has(id))continue
  seenContacts.add(id)
  const lastContact=clean(person.last_contact)
  if(clean(person.new_message))add(id,name,{id:id+'-incoming',body:person.new_message,at:timestampFromContact(lastContact),direction:'incoming',read:/\bread at\b/i.test(lastContact)},{lastContact,subtitle:choose(person.role,person.relation,person.relationship)})
  for(const [i,item] of safeArray(person.messages).entries()){
   if(!item||typeof item!=='object')continue
   add(id,name,{id:choose(item.id,id+'-message-'+i),body:choose(item.body,item.text),at:choose(item.sent_at,item.at),direction:item.direction,read:item.read===true},{lastContact,subtitle:choose(person.role,person.relation)})
  }
 }
 // A future approved player-only projection may supply explicit Agent messages.
 for(const [i,item] of safeArray(vm.agentMessages).entries()){
  if(!item||typeof item!=='object')continue
  if(item.visibility==='gm-only'||item.player_known===false)continue
  const id=choose(item.thread_id,item.sender_id,item.contact_id)
  const name=choose(item.contact_name,item.sender_name,item.name)
  add(id,name,{id:choose(item.id,id+'-'+i),body:choose(item.body,item.text),at:choose(item.sent_at,item.at),direction:item.direction,read:item.read===true},{subtitle:clean(item.subtitle)})
 }
 return [...threads.values()].map(thread=>({
  ...thread,messages:thread.messages.sort((a,b)=>(a.at||'').localeCompare(b.at||'')),
  lastAt:thread.messages.reduce((last,m)=>m.at&&(!last||m.at>last)?m.at:last,null),
  unread:thread.messages.filter(m=>m.direction==='incoming'&&!m.read).length,
 })).filter(t=>t.messages.length).sort((a,b)=>(b.lastAt||'').localeCompare(a.lastAt||''))
}
