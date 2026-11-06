import {useEffect,useMemo,useState} from 'react'
import {
  Activity, BookOpen, BriefcaseBusiness, ChevronRight, Cloud, ContactRound,
  Cpu, Dices, FileText, HeartPulse, LockKeyhole, MapPin, Search, ChevronLeft, Smartphone, Signal,
  Shield, UserRound, UsersRound, X, CarFront, RotateCcw, Copy, Trash2, Building2, IdCard,
} from 'lucide-react'
import {knownPeople,contactPeople} from './lib/people.js'
import {getCompanyPersonnel} from './lib/companyPersonnel.js'
import {rollRedCheck,rollInitiative,rollDamage,describeRoll} from './lib/dice.js'

const human=v => v===undefined||v===null||v===''?'Not recorded':String(v)
const unknown=v=>!v||/^(unknown|unestablished|undetermined|not yet)/i.test(String(v))
const contactFields = p => [
  ['Relationship',p.relation||p.role||p.relationship],
  ['Work / occupation',p.work],['Known location',p.location||p.whereabouts],
  ['Education',p.education],['Shared history',p.relationship_history||p.attitude_or_shared_history],
  ['Last contact',p.last_contact],['Known details',p.description],
].filter(([,v])=>v!==undefined&&v!==null&&v!=='')
const roleLabel = p => p.kind==='family'?'Family':p.kind==='friend'?'Personal contact':p.tag

export function AgentHub({vm,onNavigate}) {
 const entries=[
  {id:'contacts',label:'Contacts',sub:'Personal directory',Icon:ContactRound,number:contactPeople(vm).length},
  {id:'npcs',label:'Known NPCs',sub:'Player-known dossiers',Icon:UsersRound,number:knownPeople(vm).length},
  {id:'personnel',label:'Company Personnel',sub:'Assigned Helix staff',Icon:IdCard,number:getCompanyPersonnel(vm).length},
  {id:'records',label:'Records',sub:'History and journal',Icon:BookOpen},
  {id:'cyberware',label:'Cyberware',sub:'Augmentation record',Icon:Cpu},
  {id:'exec',label:'Teamwork',sub:'Exec resources',Icon:BriefcaseBusiness},
  {id:'combat',label:'Roller',sub:'Checks and combat',Icon:Dices},
 ]
 return <div className="content-grid">
  <section className="panel span-12 agent-hub-panel">
   <div className="micro-label">PERSONAL AGENT // PLAYER-KNOWN DATA</div>
   <h2 className="agent-hub-title">Your field directory</h2>
   <p className="subtle smaller">Open a dossier, inspect the current save, or prepare a roll. This terminal never reveals unrevealed GM information.</p>
   <div className="agent-hub-grid">{entries.map(({id,label,sub,Icon,number})=><button key={id} className="agent-hub-tile" onClick={()=>onNavigate(id)}>
    <Icon size={30} strokeWidth={1.65}/><strong>{label}</strong><small>{sub}</small>{number!==undefined&&<span className="hub-count">{number}</span>}
   </button>)}</div>
  </section>
 </div>
}

function PersonRows({people,query,onSelect}) {
 const shown=people.filter(p=>[p.name,p.subtitle,p.work,p.location,p.whereabouts,p.role].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase()))
 return shown.length?<div className="person-directory">{shown.map(p=><button className="person-directory-row" key={p.id||p.name} onClick={()=>onSelect(p)}>
   <span className="contact-avatar"><UserRound size={24}/></span>
   <span className="person-main"><strong>{p.name}</strong><small>{human(p.subtitle)} · {unknown(p.work)?'Occupation not recorded':p.work}</small></span>
   <span className="person-tag">{roleLabel(p)}</span><ChevronRight size={16}/>
  </button>)}</div>:<div className="empty-inline">No player-known entries match this search.</div>
}
function PersonDossier({person,onClose}) {
 if(!person)return null
 return <div className="dossier-mask" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="dossier-card" role="dialog" aria-modal="true" aria-labelledby="dossier-title">
   <div className="dossier-top"><span className="micro-label">PLAYER-KNOWN RECORD</span><button className="icon-button" aria-label="Close dossier" onClick={onClose}><X size={18}/></button></div>
   <div className="dossier-avatar"><UserRound size={36}/></div><h2 id="dossier-title">{person.name}</h2><p className="subtle smaller">{roleLabel(person)} · {human(person.subtitle)}</p>
   <dl className="dossier-details">{contactFields(person).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{human(value)}</dd></div>)}</dl>
   <p className="footnote">Only facts in the player-safe Drive projection appear here. Unknown facts remain unknown; no edits to the campaign save.</p>
  </section>
 </div>
}
export function ContactsPage({vm}) {
 const [query,setQuery]=useState('')
 const [filter,setFilter]=useState('all')
 const [selected,setSelected]=useState(null)
 const people=useMemo(()=>contactPeople(vm).sort((a,b)=>a.name.localeCompare(b.name)),[vm])
 const filtered=people.filter(p=>(filter==='all'||(filter==='family'&&p.kind==='family')||(filter==='connections'&&p.kind!=='family'))&&[p.name,p.subtitle,p.work,p.relation,p.role].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase()))
 const groups=[]
 for(const person of filtered){
   const letter=person.name.trim().charAt(0).toUpperCase()||'#'
   if(groups[groups.length-1]?.letter!==letter)groups.push({letter,people:[]})
   groups[groups.length-1].people.push(person)
 }
 return <div className="content-grid"><section className="panel span-12">
  <div className="micro-label">AGENT / PRIVATE CONTACTS</div>
  <div className="phone-stage"><div className="phone-frame">
   <div className="phone-notice" aria-hidden="true"/>
   <div className="phone-status"><span><Signal size={12}/> PERSONAL DIRECTORY</span><span>R{vm.revision} · OFFLINE VIEW</span></div>
   {selected?<>
     <button className="phone-detail-back" type="button" onClick={()=>setSelected(null)}><ChevronLeft size={17}/> All contacts</button>
     <div className="phone-detail-head"><div className="phone-detail-avatar"><UserRound size={34}/></div><h2>{selected.name}</h2><p>{roleLabel(selected)} · {human(selected.subtitle)}</p></div>
     <dl className="phone-detail-fields">
      <div><dt>Contact number</dt><dd>{selected.phone_number||selected.phone||selected.contact_number||'Not recorded in the verified save'}</dd></div>
      {contactFields(selected).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{human(value)}</dd></div>)}
     </dl>
     <p className="phone-offline"><Smartphone size={13}/> Viewing a player-known record; no call or message has been sent.</p>
   </>:<>
     <div className="phone-app-head"><div><strong>Contacts</strong><small>{people.length} saved people</small></div><Smartphone size={28}/></div>
     <div className="phone-filters" role="group" aria-label="Contact directory filter">{[['all','All'],['family','Family'],['connections','Connections']].map(([key,label])=><button type="button" key={key} className={filter===key?'active':''} onClick={()=>setFilter(key)}>{label}</button>)}</div>
     <label className="phone-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search contacts" placeholder="Search contacts"/></label>
     <div className="phone-list">{groups.length?groups.map(group=><div key={group.letter}><div className="phone-letter">{group.letter}</div>{group.people.map(person=><button type="button" key={person.id||person.name} className="phone-person" onClick={()=>setSelected(person)}>
       <span className="phone-person-avatar"><UserRound size={21}/></span><span className="phone-person-copy"><strong>{person.name}</strong><small>{roleLabel(person)}{person.work?' · '+person.work:''}</small></span><ChevronRight size={17}/>
     </button>)}</div>):<div className="empty-inline">No contacts match your search.</div>}</div>
     <p className="phone-offline"><Smartphone size={13}/> This is Nathan's recorded directory. Unrecorded numbers and availability are not invented.</p>
   </>}
  </div></div>
 </section></div>
}
export function KnownNpcsPage({vm}) {
 const [query,setQuery]=useState('')
 const [filter,setFilter]=useState('all')
 const [selected,setSelected]=useState(null)
 const people=useMemo(()=>knownPeople(vm),[vm])
 const filtered=people.filter(p=>filter==='all'||p.kind===filter)
 return <div className="content-grid"><section className="panel span-12">
  <div className="section-intro"><div><h2>Known NPCs</h2><p>{people.length} people established in Nathan's personal history or encountered during play</p></div><label className="search-field"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search known NPCs" placeholder="Search names and details"/></label></div>
  <div className="npc-filters" role="group" aria-label="Filter NPCs">{[['all','All'],['family','Family'],['friend','Connections'],['npc','Others']].map(([id,label])=><button key={id} className={filter===id?'active':''} onClick={()=>setFilter(id)}>{label}</button>)}</div>
  <PersonRows people={filtered} query={query} onSelect={setSelected}/>
  <p className="footnote">This index excludes unrevealed people from the GM's preparations. The company driver is an assigned employee, but their identity remains unestablished until introduced.</p>
 </section><PersonDossier person={selected} onClose={()=>setSelected(null)}/></div>
}
/** Assigned staff are distinct from Known NPCs until introduced on-screen. */
export function CompanyPersonnelPage({vm}) {
 const roster = useMemo(()=>getCompanyPersonnel(vm),[vm])
 const [selectedId,setSelectedId]=useState(null)
 const active=roster.find(p=>p.id===selectedId) || roster[0]
 const statOrder=['INT','REF','DEX','TECH','COOL','WILL','MOVE','BODY','EMP']
 return <div className="content-grid">
  <section className="panel span-12 company-personnel-panel">
   <div className="panel-heading"><span className="micro-label">HELIX MERIDIAN / ASSIGNED PERSONNEL</span><span className="tag">R{vm.revision} · PLAYER-SAFE</span></div>
   <div className="personnel-intro"><div><h2>Company Personnel</h2><p>Employees assigned to Nathan through established corporate benefits. Appointment does not imply personal acquaintance.</p></div><Building2 size={32} strokeWidth={1.5}/></div>
   {!roster.length?<div className="empty-inline">No assigned company personnel are present in the current player projection.</div>:<div className="personnel-layout">
    <div className="personnel-directory" aria-label="Assigned company personnel">
     {roster.map(p=><button className={'personnel-person'+(active?.id===p.id?' selected':'')} key={p.id} onClick={()=>setSelectedId(p.id)} aria-current={active?.id===p.id?'true':undefined}>
       <span className="personnel-avatar"><CarFront size={23}/></span>
       <span><strong>{p.label}</strong><small>{p.role}</small><small>{p.identityPending?'Identity pending on-screen introduction':'Named in player projection'}</small></span>
       <ChevronRight size={17}/>
     </button>)}
    </div>
    {active&&<article className="personnel-dossier">
     <div className="personnel-profile-head"><div className="personnel-avatar large"><CarFront size={30}/></div><div><span className="micro-label">TEAMWORK / COMPANY DRIVER</span><h3>{active.label}</h3><p>{active.identityPending?'Personal name not yet established':active.role} · HR title: {active.jobTitle||'Not yet designated'}</p></div></div>
     <p className="personnel-note">Assigned by Helix Meridian. The employee is an independent NPC under GM control, not an extension of Nathan. Personal background, personality, and current physical location remain unestablished.</p>
     <div className="personnel-kpis">
       <div><span>LOYALTY</span><strong>{active.loyalty??'—'}</strong><small>Fixed agreed value; not a roll</small></div>
       <div><span>HIT POINTS</span><strong>{active.derived.current_hp??'—'}<em> / {active.derived.max_hp??'—'}</em></strong><small>Current / maximum</small></div>
       <div><span>DEATH SAVE</span><strong>{active.derived.death_save??'—'}</strong><small>Threshold: {active.derived.seriously_wounded_threshold_hp??'—'} HP</small></div>
     </div>
     <section className="personnel-section"><h4>Core attributes</h4><div className="personnel-stat-grid">{statOrder.map(key=><div key={key}><span>{key}</span><strong>{active.stats[key]??'—'}</strong></div>)}</div><p className="personnel-subnote">Template row 2 is a fixed character-creation selection, not an actual dice result. No LUCK score is supplied in the teammate template.</p></section>
     <section className="personnel-section"><h4>Company vehicle</h4>{active.vehicle?<div className="personnel-asset"><CarFront size={18}/><div><strong>{active.vehicle.name}</strong><small>{active.vehicle.notes||'Helix Meridian company property'}</small><small>Parking / current custody: {active.vehicle.custody_or_location||'Not established'}</small></div></div>:<p className="personnel-muted">Vehicle assignment is referenced, but no matching player-visible asset is recorded.</p>}</section>
     <section className="personnel-section"><h4>Issued equipment</h4>{active.equipment.length?<div className="personnel-assets">{active.equipment.map(item=><div className="personnel-asset" key={item.id}><Shield size={17}/><div><strong>{item.name} <span className="personnel-count">×{item.quantity??1}</span></strong><small>{item.notes||item.custody_or_location||'Company-issued equipment'}</small></div></div>)}</div>:<p className="personnel-muted">No issued equipment details are recorded in the current player projection.</p>}</section>
     <section className="personnel-section"><h4>Cyberware package</h4>{active.cyberware.length?<div className="personnel-pills">{active.cyberware.map(name=><span key={name}>{name}</span>)}</div>:<p className="personnel-muted">Not recorded.</p>}</section>
     <section className="personnel-section"><h4>Template skill levels</h4>{active.skills.length?<div className="personnel-skill-tiers">{active.skills.map(tier=><div key={tier.rank}><strong>Level {tier.rank}</strong><p>{tier.skills.join(' · ')}</p></div>)}</div>:<p className="personnel-muted">No skill ranks available.</p>}</section>
     <section className="personnel-section"><h4>Employment policies</h4>{active.policies.length?<ul className="personnel-policies">{active.policies.map(rule=><li key={rule}>{rule}</li>)}</ul>:<p className="personnel-muted">No policies supplied.</p>}</section>
     <p className="footnote">This is a read-only player-safe company roster. All values are taken from the private Drive projection; missing identities and details are not invented. The canonical campaign, NPC choices, and fictional time remain unchanged.</p>
    </article>}
   </div>}
  </section>
 </div>
}

export function ExecPage({vm,onNavigate}) {
 const driver=vm.driver||{}
 return <div className="content-grid">
  <section className="panel span-8"><div className="panel-heading"><span className="micro-label">ROLE ABILITY</span><span className="tag tag-accent">RANK {vm.rank?.level}</span></div>
   <div className="role-hero"><BriefcaseBusiness size={34}/><div><h2>Teamwork</h2><p>Exec · {vm.employer} · {vm.department}</p></div></div>
   <div className="role-feature"><CarFront size={22}/><div><strong>Company Driver</strong><p>{unknown(driver.name)?'Name not established':driver.name} · Loyalty {human(driver.loyalty)} (agreed fixed value)</p><small>Independent company employee. Transport and vehicle support; not a dedicated bodyguard.</small></div></div>
   <div className="role-feature"><Shield size={22}/><div><strong>Company vehicle</strong><p>Compact groundcar with seating upgrade</p><small>Provided by Helix Meridian. Not Nathan's personal property.</small></div></div>
   <div className="role-feature"><BriefcaseBusiness size={22}/><div><strong>Corporate housing</strong><p>Company conapt shared with Anna</p><small>Rent covered while Nathan retains the eligible corporate benefit.</small></div></div>
   <button type="button" className="btn outline personnel-exec-link" onClick={()=>onNavigate('personnel')}>View Company Personnel <ChevronRight size={17}/></button>
  </section>
  <section className="panel span-4"><div className="micro-label">COMPANY / COMMITMENTS</div><h2 className="page-side-title">Operating status</h2><div className="dossier-details">
    <div><dt>Employer</dt><dd>{vm.employer}</dd></div><div><dt>Division</dt><dd>{vm.department}</dd></div><div><dt>Living arrangement</dt><dd>{human(vm.housing.housing_type)}</dd></div><div><dt>Next lifestyle due</dt><dd>{human(vm.housing.next_lifestyle_due_fictional_date)}</dd></div>
   </div><p className="footnote">Role ability usage and new commitments are resolved by the GM. No actions are submitted from this viewer.</p></section>
 </div>
}

export function CombatPage({vm,onRoll,history,onShowHistory}) {
 const skills=Object.fromEntries(vm.skills)
 const stat=vm.stats||{}
 const checks=[
  {label:'Initiative',stat:'REF',rank:0,kind:'initiative',desc:'Turn order · REF + 1d10'},
  {label:'Handgun',stat:'REF',rank:skills.Handgun||0,kind:'check',desc:'Very Heavy Pistol · no attack attempted'},
  {label:'Evasion',stat:'DEX',rank:skills.Evasion||0,kind:'check',desc:'Defensive Skill Check'},
  {label:'Brawling',stat:'DEX',rank:skills.Brawling||0,kind:'check',desc:'Unarmed Skill Check'},
 ]
 return <div className="content-grid">
 <section className="panel span-8"><div className="panel-heading"><span className="micro-label">COMBAT REFERENCE</span><span className="tag">NO ACTIVE COMBAT</span></div>
  <div className="combat-vitals"><div><HeartPulse size={17}/><strong>{vm.hp}/{vm.maxHp}</strong><small>HP</small></div><div><Shield size={17}/><strong>{vm.armorBody}</strong><small>Body SP</small></div><div><Shield size={17}/><strong>{vm.armorHead}</strong><small>Head SP</small></div></div>
  <div className="directory-heading">QUICK CHECKS</div><div className="combat-checks">{checks.map(c=><div className="combat-row" key={c.label}>
   <div><strong>{c.label}</strong><span>{c.desc}</span><small>{c.stat} {human(stat[c.stat])} {c.rank?`+ Skill ${c.rank}`:''}</small></div>
   <button className="roll-trigger" onClick={()=>onRoll({kind:c.kind,label:c.label,base:Number(stat[c.stat]||0)+c.rank,stat:c.stat,rank:c.rank})}><Dices size={18}/> +{Number(stat[c.stat]||0)+c.rank}</button>
  </div>)}</div>
  <div className="directory-heading">DAMAGE DICE</div>
  <div className="combat-row"><div><strong>Very Heavy Pistol</strong><span>4d6 damage if a hit is confirmed</span><small>No ammo, HP, or armor is changed by rolling here.</small></div><button className="roll-trigger" onClick={()=>onRoll({kind:'damage',label:'Very Heavy Pistol · 4d6 damage',count:4,sides:6})}><Dices size={18}/> 4d6</button></div>
 </section>
 <section className="panel span-4"><div className="micro-label">SESSION ROLLS</div><h2 className="page-side-title">Local history</h2><p className="subtle smaller">{history.length} rolls saved in this browser. They are not campaign checkpoint events.</p><button className="btn outline history-launch" onClick={onShowHistory}>View roll history <ChevronRight size={17}/></button>
  <p className="footnote">Set stakes and modifiers with the GM before consequential checks. These buttons calculate dice only; the GM adjudicates outcomes and saves approved changes.</p></section>
 </div>
}

export function RollDialog({request,onClose,onSave}) {
 const [modifier,setModifier]=useState('0')
 const [dv,setDv]=useState('')
 const [specialization,setSpecialization]=useState('')
 const [result,setResult]=useState(null)
 const [error,setError]=useState('')
 useEffect(()=>{setModifier('0');setDv('');setSpecialization('');setResult(null);setError('')},[request])
 if(!request)return null
 const roll=()=>{
  const m=Number(modifier||0)
  if(!Number.isInteger(m)||Math.abs(m)>100){setError('Enter an integer modifier between -100 and 100.');return}
  if(request.requiresSpecialization&&!specialization.trim()){setError('Name the specific subject, language, style, or field before rolling.');return}
  const parsedDv=dv.trim()===''?null:Number(dv)
  if(parsedDv!==null&&(!Number.isInteger(parsedDv)||parsedDv<0||parsedDv>100)){setError('Enter a DV from 0 to 100, or leave it blank.');return}
  try{
   const rollLabel=request.requiresSpecialization?`${request.label} (${specialization.trim()})`:request.label
   const data=request.kind==='initiative'?rollInitiative({base:request.base,modifier:m}):request.kind==='damage'?rollDamage({label:rollLabel,count:request.count,sides:request.sides,modifier:m}):rollRedCheck({label:rollLabel,base:request.base,modifier:m})
   const recorded={...data,dv:parsedDv,at:Date.now()}
   setResult(recorded);setError('');onSave(recorded)
  }catch(e){setError(e.message||String(e))}
 }
 const copy=()=>{if(result&&navigator.clipboard?.writeText)navigator.clipboard.writeText(describeRoll(result)).catch(()=>{})}
 return <div className="dossier-mask dice-mask" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
 <section className="dossier-card dice-card" role="dialog" aria-modal="true" aria-labelledby="dice-title">
  <div className="dossier-top"><span className="micro-label">LOCAL DICE TERMINAL</span><button className="icon-button" onClick={onClose} aria-label="Close roller"><X size={19}/></button></div>
  <h2 id="dice-title">{request.label}</h2><p className="subtle smaller">{request.kind==='damage'?`${request.count}d${request.sides}`:request.kind==='initiative'?'REF + 1d10 (no Skill critical explosion)':'STAT + Skill + 1d10'}</p>
  {!result?<>{request.untrained&&<p className="untrained-note">Untrained attempt: Skill Level 0. Whether this task is possible without specific training, equipment, or knowledge is for the GM to decide.</p>}{request.requiresSpecialization&&<label className="specialization-label">Specific field / language / style<input type="text" value={specialization} maxLength={100} onChange={e=>setSpecialization(e.target.value)} placeholder="Name the attempted specialization" aria-label="Attempted specialization"/></label>}<div className="roll-fields"><label>Situational modifier<input type="number" step="1" value={modifier} onChange={e=>setModifier(e.target.value)} aria-label="Situational modifier"/></label>{request.kind==='check'&&<label>GM-set DV (optional)<input type="number" step="1" min="0" value={dv} onChange={e=>setDv(e.target.value)} placeholder="Unknown" aria-label="GM-set difficulty"/></label>}</div>
  <div className="roll-base-display">{request.kind==='damage'?'Dice pool':`Base ${request.base}`} <strong>{request.kind==='damage'?`${request.count}d${request.sides}`:`+${request.base}`}</strong></div>
  <button className="btn primary roll-now" onClick={roll}><Dices size={21}/> Roll dice</button></>:
  <div className="roll-result"><div className="dice-total">{result.total}</div><div className="micro-label">{result.critical?`CRITICAL ${result.critical.toUpperCase()}`:result.kind==='damage'?'DAMAGE TOTAL':'TOTAL ROLL'}</div>
   <div className="roll-breakdown">{result.kind==='damage'?<><span>Dice: {result.dice.join(' + ')}</span><span>Modifier: {result.modifier>=0?'+':''}{result.modifier}</span></>:<><span>Base: {result.base}</span><span>Modifier: {result.modifier>=0?'+':''}{result.modifier}</span><span>First d10: {result.first}</span>{result.second!==null&&<span>Critical follow-up: {result.critical==='success'?'+':'−'}{result.second}</span>}{result.dv!==null&&<span>DV: {result.dv} · {result.total>result.dv?'Beats DV':'Does not beat DV'}</span>}</>}</div>
   <div className="roll-actions"><button className="btn outline" onClick={copy}><Copy size={16}/> Copy result</button><button className="btn primary" onClick={()=>setResult(null)}><RotateCcw size={16}/> New roll</button></div>
  </div>}
  {error&&<p className="alert error-alert">{error}</p>}
  <p className="footnote">Local roll only. No combat, resources, story, or canonical record is changed. Confirm consequential rolls with the GM.</p>
 </section></div>
}

export function RollHistoryDialog({history,onClose,onClear}) {
 return <div className="dossier-mask dice-mask" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
 <section className="dossier-card dice-card" role="dialog" aria-modal="true" aria-labelledby="history-title">
  <div className="dossier-top"><span className="micro-label">LOCAL SESSION HISTORY</span><button className="icon-button" onClick={onClose} aria-label="Close history"><X size={19}/></button></div>
  <h2 id="history-title">Recent dice rolls</h2>
  {history.length?<div className="history-list">{history.map((r,i)=><div key={`${r.at||i}-${i}`}><strong>{r.label} · {r.total}</strong><small>{describeRoll(r)}</small></div>)}</div>:<p className="subtle smaller">No rolls in this browser yet.</p>}
  {history.length>0&&<button className="btn outline history-clear" onClick={onClear}><Trash2 size={16}/> Clear local history</button>}
  <p className="footnote">Browser history only; it cannot establish or overwrite a canonical campaign event.</p>
 </section></div>
}
