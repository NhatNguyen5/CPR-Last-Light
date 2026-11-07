import {useEffect,useMemo,useState} from 'react'
import {ChevronLeft,ChevronRight,Clock3,Copy,Inbox,MessageCircle,Search,Send,Signal,UserRound,X} from 'lucide-react'
import {buildMessageThreads,agentMessageTime} from './lib/messages.js'
import {readMessageDraft,writeMessageDraft,clearMessageDraft} from './lib/messageDrafts.js'

const browserStore=()=>{try{return window.localStorage}catch{return null}}
export function MessagesPage({vm}){
 const threads=useMemo(()=>buildMessageThreads(vm),[vm])
 const [selectedId,setSelectedId]=useState(null)
 const [search,setSearch]=useState('')
 const [draft,setDraft]=useState('')
 const [notice,setNotice]=useState('')
 const selected=threads.find(t=>t.id===selectedId)||null
 const scope=vm.characterKey||vm.campaignId+'::'+vm.characterId
 const shown=threads.filter(t=>[t.name,t.subtitle,...t.messages.map(m=>m.body)].join(' ').toLowerCase().includes(search.toLowerCase()))
 useEffect(()=>{setSelectedId(null);setDraft('');setSearch('');setNotice('')},[scope])
 useEffect(()=>{setDraft(selected?readMessageDraft(browserStore(),scope,selected.id):'');setNotice('')},[scope,selected?.id])
 const changeDraft=value=>{
  setDraft(value);setNotice('')
  if(selected)writeMessageDraft(browserStore(),scope,selected.id,value)
 }
 const copyDraft=async()=>{
  if(!selected||!draft.trim())return
  try{
   if(!navigator.clipboard?.writeText)throw Error('Clipboard access is not available.')
   await navigator.clipboard.writeText('Agent reply to '+selected.name+':\n'+draft.trim())
   setNotice('Draft copied. Paste it into the campaign chat to request sending it in-game.')
  }catch{setNotice('Copy unavailable in this browser. Select the draft text and copy it manually.')}
 }
 const clearDraft=()=>{
  if(!selected)return
  clearMessageDraft(browserStore(),scope,selected.id)
  setDraft('');setNotice('Local draft cleared. No message was sent.')
 }
 return <div className="content-grid"><section className="panel span-12">
  <div className="micro-label">PERSONAL AGENT / VERIFIED CORRESPONDENCE</div>
  <div className="phone-stage"><div className="phone-frame agent-message-phone">
   <div className="phone-notice" aria-hidden="true"/>
   <div className="phone-status"><span><Signal size={12}/> MESSAGE ARCHIVE</span><span>R{vm.revision} · READ-ONLY</span></div>
   {selected?<div className="agent-message-thread">
    <div className="agent-message-thread-header">
     <button type="button" className="phone-detail-back" onClick={()=>setSelectedId(null)}><ChevronLeft size={18}/> Messages</button>
     <div className="agent-message-thread-person"><div className="phone-person-avatar"><UserRound size={19}/></div><div><strong>{selected.name}</strong><small>{selected.subtitle||'Known contact'}</small></div></div>
    </div>
    <div className="agent-message-timeline" aria-label={'Messages with '+selected.name}>
     {selected.messages.map(message=><article key={message.id} className={'agent-message-bubble '+(message.direction==='outgoing'?'outgoing':'incoming')}>
      <div className="agent-message-body">{message.body}</div>
      <div className="agent-message-meta"><span>{message.at?agentMessageTime(message.at):'Time not recorded'}</span><span>{message.direction==='incoming'?(message.read?'Read':'Received'):'Recorded outgoing'}</span></div>
     </article>)}
    </div>
    {selected.lastContact&&<p className="agent-message-contact-note"><Clock3 size={13}/> {selected.lastContact}</p>}
    <div className="agent-message-compose">
     <label htmlFor="agent-reply-text">Reply draft <small>Local only · not transmitted</small></label>
     <textarea id="agent-reply-text" value={draft} maxLength={3000} rows={3} onChange={e=>changeDraft(e.target.value)} placeholder={'Write a reply to '+selected.name+'…'} aria-label={'Unsent draft reply to '+selected.name}/>
     <div className="agent-compose-actions">
      <button type="button" className="agent-draft-clear" disabled={!draft} onClick={clearDraft}><X size={15}/> Clear</button>
      <button type="button" className="agent-draft-copy" disabled={!draft.trim()} onClick={copyDraft}><Copy size={15}/> Copy draft</button>
     </div>
     {notice&&<p className="agent-compose-notice" role="status">{notice}</p>}
     <p className="phone-offline"><Send size={13}/> Copy the draft into your campaign chat to request the message be sent. This viewer cannot send in-world messages or advance time.</p>
    </div>
   </div>:<>
    <div className="phone-app-head"><div><strong>Messages</strong><small>{threads.length?threads.length+' recorded conversation'+(threads.length===1?'':'s'):'No recorded conversations'}</small></div><MessageCircle size={28}/></div>
    <label className="phone-search"><Search size={17}/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} aria-label="Search messages" placeholder="Search messages…"/></label>
    <div className="phone-list agent-message-inbox" aria-label="Message inbox">
     {shown.length?shown.map(thread=>{
      const latest=thread.messages[thread.messages.length-1]
      return <button type="button" className="phone-person agent-inbox-item" key={thread.id} onClick={()=>setSelectedId(thread.id)}>
       <span className="phone-person-avatar"><UserRound size={21}/></span>
       <span className="phone-person-copy"><strong>{thread.name}</strong><small>{latest.body}</small><span className="agent-inbox-time">{latest.at?agentMessageTime(latest.at):'Time not recorded'} · {latest.read?'Read':'Recorded'}</span></span>
       <ChevronRight size={16}/>
      </button>
     }):<div className="agent-message-empty"><Inbox size={28}/><strong>{threads.length?'No matches':'No recorded messages yet'}</strong><p>{threads.length?'Try a different search.':'Messages will appear when their text is included in an approved player-only character sheet.'}</p></div>}
    </div>
    <p className="phone-offline"><MessageCircle size={13}/> Showing only messages established in the saved player projection. No invented conversations.</p>
   </>}
  </div></div>
 </section></div>
}
