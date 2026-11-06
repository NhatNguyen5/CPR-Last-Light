import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  Activity, ArrowDownToLine, ArrowRight, BriefcaseBusiness, CheckCircle2, ChevronRight,
  CircleHelp, Cloud, CloudOff, Cpu, ExternalLink, FileJson2, Fingerprint, HeartPulse,
  Home, IdCard, Layers3, LockKeyhole, LogOut, Menu, Radar, RefreshCcw, Search,
  Shield, ShieldCheck, Terminal, UserRound, UsersRound, Wallet, X, Zap,
} from 'lucide-react'
import {config} from './config.js'
import {fetchDriveJson, initTokenClient, loadGoogleSdk, openGooglePicker} from './lib/drive.js'
import {getViewModel, groupSkills, validatePlayerSheet} from './lib/projection.js'

const FILE_KEY = 'cpr-last-light:player-file-id'
const nav = [
  ['overview','Overview',Layers3],['skills','Skills',Activity],['inventory','Inventory',Shield],
  ['cyberware','Cyberware',Cpu],['contacts','Contacts',UsersRound],['records','Records',FileJson2],
]
const statOrder = ['INT','REF','DEX','TECH','COOL','WILL','LUCK','MOVE','BODY','EMP']
const fmt = (value, fallback='—') => value === undefined || value === null || value === '' ? fallback : Array.isArray(value) ? value.map(v => fmt(v)).join(' · ') : typeof value === 'object' ? Object.entries(value).map(([k,v]) => `${k}: ${fmt(v)}`).join(' · ') : String(value)
const cleanUnknown = text => (typeof text === 'string' && /^unestablished|^undetermined|^not yet|^unknown/i.test(text)) ? 'Undetermined' : fmt(text)
const formatDate = date => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date||'')) return fmt(date)
  return new Intl.DateTimeFormat('en-US',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'))
}

function Logo({large=false}) {return <div className={'helix-logo'+(large?' helix-logo--large':'')} aria-hidden="true"><span>H</span><i /></div>}
function Tag({children,accent=false}) {return <span className={'tag '+(accent?'tag-accent':'')}>{children}</span>}
function Panel({children,className='',label='',right}) {return <section className={'panel '+className}>{(label||right)&&<div className="panel-heading"><div className="micro-label">{label}</div>{right}</div>}{children}</section>}
function StatBar({value,max,warning=false}) {const n=max>0?Math.max(0,Math.min(100,100*value/max)):0;return <div className="meter-track" aria-label={`${value} of ${max}`}><div className={'meter-fill'+(warning?' meter-fill-warning':'')} style={{width:`${n}%`}} /></div>}
function Metric({label,value,denominator,Icon,hint,tone}) {return <div className="metric"><div className="metric-top"><span className="micro-label">{label}</span>{Icon&&<Icon size={18} strokeWidth={1.6}/>}</div><div className="metric-value">{value}{denominator!==undefined&&<span> / {denominator}</span>}</div>{hint&&<div className="metric-hint">{hint}</div>}{denominator!==undefined&&<StatBar value={value} max={denominator} warning={tone==='warning'}/>}</div>}
function Details({pairs}) {return <dl className="details">{pairs.map(([k,v],i)=><div className="detail-row" key={i}><dt>{k}</dt><dd>{fmt(v)}</dd></div>)}</dl>}
function ListEmpty({text='Nothing recorded in the current save.'}) {return <div className="empty-inline">{text}</div>}
function Overview({vm}) {
  const pc=vm.background
  return <div className="content-grid">
    <Panel className="span-8 bio-card" label="OPERATIVE PROFILE" right={<Tag>VERIFIED · R{vm.revision}</Tag>}>
      <div className="bio-header"><div className="portrait-placeholder"><Fingerprint size={56} strokeWidth={1}/><span>HM / 001</span></div><div><div className="overline">PERSONNEL / R&D / EXECUTIVE</div><h2>{vm.name}</h2><div className="subtle">Vietnamese · Age {fmt(vm.age)} · {vm.department}</div><div className="tag-row"><Tag accent>TEAMWORK RANK {fmt(vm.rank?.level)}</Tag><Tag>{fmt(pc.personal_style)}</Tag></div></div></div>
      <Details pairs={[
        ['Hometown',pc.hometown],['Education',pc.education],['Previous work',pc.prior_profession],
        ['Current focus',pc.career_transition],['Values most',pc.top_value],['Life goal',pc.life_goal],
        ['Personality',pc.personality_baseline],['Outlook',pc.regard_for_people]
      ]}/>
    </Panel>
    <Panel className="span-4" label="LIVING SITUATION" right={<Home size={16}/> }>
      <div className="callout-icon"><Home size={25}/></div><div className="section-main">CORPORATE CONAPT</div><p className="subtle smaller">{fmt(vm.housing.area)}</p>
      <div className="panel-separator"/><Details pairs={[["Lifestyle",vm.housing.monthly_lifestyle],["Next due",formatDate(vm.housing.next_lifestyle_due_fictional_date)],["Monthly lifestyle",`${fmt(vm.housing.monthly_cost_eb)}eb`],["Rent",`${fmt(vm.housing.rent_due_eb)}eb (company covered)`]]}/>
      <p className="footnote">Company-provided housing remains conditional on eligible employment.</p>
    </Panel>
    <Panel className="span-8" label="CORE ATTRIBUTES" right={<span className="secondary-note">CURRENT VALUES</span>}>
      <div className="stats-grid">{statOrder.map(name=><div className="stat-tile" key={name}><span>{name}</span><strong>{fmt(vm.stats[name])}</strong><div className="stat-ticks">{Array.from({length:10},(_,i)=><b key={i} className={i<Number(vm.stats[name])?'active':''}/>)}</div></div>)}</div>
      <p className="footnote">Current EMP reflects Humanity loss. Base EMP {fmt(vm.baseEmp)} remains recorded in the save.</p>
    </Panel>
    <Panel className="span-4" label="TODAY'S POSITION" right={<Radar size={16}/>}>
      <div className="section-main">{formatDate(vm.date)}</div><div className="clock">{vm.time}</div><p className="subtle smaller">{vm.scene}</p>
      <div className="panel-separator"/><div className="status-line"><span className="status-dot"/> NO ACTIVE COMBAT</div>
      <p className="footnote">This is a saved state, not a live clock. Time only advances during play.</p>
    </Panel>
  </div>
}
function Skills({vm}) {
  const [search,setSearch]=useState('')
  const skills=groupSkills(vm.skills,search)
  return <div className="content-grid">
    <Panel className="span-12" label="SKILL MATRIX" right={<Tag>{vm.skills.length} skills</Tag>}>
      <div className="section-intro"><div><h2>Capabilities</h2><p>Rank values reflect the last verified campaign checkpoint.</p></div><label className="search-field"><Search size={16}/><input type="search" placeholder="Search skills..." aria-label="Search skills" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
      <div className="skill-grid">{skills.map(([name,rank])=><div className="skill-row" key={name}><span>{name}</span><div className="skill-right"><div className="small-meter">{Array.from({length:8},(_,i)=><i key={i} className={i<rank?'active':''}/>)}</div><strong>{rank}</strong></div></div>)}</div>
      {!skills.length&&<ListEmpty text="No skills match that search."/>}
      <p className="footnote">Skill checks generally combine STAT + Skill + 1d10 and modifiers. The sheet displays Skill ranks; it does not roll dice or alter your character.</p>
    </Panel>
  </div>
}
function Inventory({vm}) {
  const items=vm.inventory.filter(i=>!i.name?.match(/^(Cyberaudio Suite|Internal Agent|Enhanced Antibodies|Chyron|Biomonitor)$/i))
  return <div className="content-grid">
    <Panel className="span-8" label="PERSONAL INVENTORY" right={<Tag>{items.length} entries</Tag>}>
      <div className="items">{items.map(i=><div className="item" key={i.id}><div className="item-icon"><Shield size={19}/></div><div className="item-copy"><strong>{i.name}</strong><span>{fmt(i.custody_or_location,'Location unconfirmed')}</span></div><span className="item-count">×{i.quantity||1}</span></div>)}</div>
      {!items.length&&<ListEmpty/>}
      <p className="footnote">Owned is not necessarily carried or currently worn. Unconfirmed starting positions are preserved as unknown.</p>
    </Panel>
    <div className="span-4 stacked">
      <Panel label="PROTECTION"><Details pairs={[["Body armor",`SP ${vm.armorBody}`],["Head armor",`SP ${vm.armorHead}`],["Currently worn",vm.background.condition.armor_currently_worn]]}/></Panel>
      <Panel label="AMMUNITION"><Details pairs={[["Basic pistol rounds",vm.ammo.pc_vh_pistol_basic_total],["Armor-piercing",vm.ammo.pc_vh_pistol_ap_total],["Magazine loaded",vm.ammo.loaded_magazine]]}/></Panel>
      <Panel label="FUNDS"><div className="funds"><Wallet size={25}/><span>{vm.credits}<small>eb</small></span></div><p className="footnote">Only confirmed liquid starting cash. No presumed salary or savings.</p></Panel>
    </div>
  </div>
}
function Cyberware({vm}) {
 const names = ['Cyberaudio Suite','Internal Agent','Enhanced Antibodies','Smart Glasses','Chyron','Biomonitor']
 const owned=vm.inventory.filter(x=>names.some(n=>x.name?.includes(n)))
 return <div className="content-grid">
   <Panel className="span-8" label="AUGMENTATION RECORD" right={<Tag>PERSONAL</Tag>}><div className="items">{owned.map((i)=><div className="item" key={i.id}><div className="item-icon cyber-icon"><Cpu size={19}/></div><div className="item-copy"><strong>{i.name}</strong><span>{fmt(i.notes)}</span></div><span className="item-count">INSTALLED / OWNED</span></div>)}</div><p className="footnote">Smart Glasses and their Chyron are external. The Biomonitor has no Humanity Loss.</p></Panel>
   <div className="span-4 stacked"><Panel label="HUMANITY"><div className="hero-numeric">{vm.humanity}<small> / {vm.maxHumanity}</small></div><StatBar value={vm.humanity} max={vm.maxHumanity}/><p className="footnote">Effective EMP {fmt(vm.stats.EMP)} · Natural base EMP {fmt(vm.baseEmp)}.</p></Panel>
   <Panel label="CYBERWARE LOSS"><Details pairs={Object.entries(vm.background.derived.cyberware_generation_humanity_losses||{}).map(([k,v])=>[k,`−${v} HL`])}/></Panel></div>
 </div>
}
function Contacts({vm}) {
 const people=[...vm.family.map(p=>({...p,type:'FAMILY'})),...vm.friends.map(p=>({...p,type:'PERSONAL'}))]
 return <div className="content-grid"><Panel className="span-8" label="RELATIONSHIPS" right={<Tag>{people.length} KNOWN</Tag>}><div className="contacts">{people.map(p=><div className="contact" key={p.id}><div className="contact-avatar"><UserRound size={24}/></div><div><div className="contact-head"><strong>{p.name}</strong><Tag>{p.type}</Tag></div><div className="subtle smaller">{fmt(p.relation||p.role)} · {fmt(p.work)}</div><div className="contact-location">{fmt(p.location||p.whereabouts,'Location unconfirmed')}</div></div></div>)}</div></Panel>
 <div className="span-4 stacked"><Panel label="COMPANY SUPPORT"><div className="callout-icon"><BriefcaseBusiness/></div><div className="section-main">ASSIGNED DRIVER</div><p className="subtle smaller">{cleanUnknown(vm.driver.name)}</p><Details pairs={[["Loyalty",fmt(vm.driver.loyalty)],["Vehicle","Company-owned groundcar"],["Role","Driver · Transport support"]]}/><p className="footnote">Loyalty 7 is an approved fixed starting value, not a verified dice roll. NPC acts independently.</p></Panel></div></div>
}
function Records({vm}) {
 const b=vm.background
 return <div className="content-grid"><Panel className="span-8" label="LIFEPATH LOG"><div className="record-list"><div><span>ORIGIN</span><p>{fmt(b.original_family_background)}</p></div><div><span>CHILDHOOD</span><p>{fmt(b.childhood_environment)}</p></div><div><span>FAMILY HISTORY</span><p>{fmt(b.family_crisis)}</p></div><div><span>RELATIONSHIP</span><p>{fmt(b.relationship_milestones)}</p></div><div><span>CAREER</span><p>{fmt(b.career_transition)}</p></div><div><span>MOVE TO NIGHT CITY</span><p>{fmt(b.move_to_night_city)}</p></div></div></Panel>
 <div className="span-4 stacked"><Panel label="CHECKPOINT"><div className="hero-numeric">R{vm.revision}</div><div className="subtle smaller">Canonical checkpoint revision</div><div className="panel-separator"/><Details pairs={[["Campaign","CPR-HELIX-LAST-LIGHT-001"],["IP",vm.ip],["Last fictional date",formatDate(vm.date)],["Current time",vm.time]]}/></Panel><Panel label="CAMPAIGN NOTES"><div className="record-list">{vm.knowledge.length?vm.knowledge.map((line,i)=><div key={i}><p>{line}</p></div>):<ListEmpty/>}</div><p className="footnote">Only facts Nathan knows are visible here. No unrevealed NPC truths or future plots.</p></Panel></div></div>
}
const pages={overview:Overview,skills:Skills,inventory:Inventory,cyberware:Cyberware,contacts:Contacts,records:Records}
function EmptyState({onConnect, onSelectLocal,loading,configured,error,hasToken,openPicker}) {
 return <div className="empty-shell"><div className="empty-diamond"><LockKeyhole size={30}/></div><div className="overline">SECURE PERSONNEL ACCESS // DRIVE VAULT</div><h2>PRIVATE DOSSIER ACCESS</h2><p>The viewer never stores your character in GitHub. Authorize your Google account to read the player-only projection, or inspect a local export without uploading it.</p>
 <div className="empty-actions"><button className="btn primary" disabled={!configured||loading} onClick={onConnect}><Cloud size={16}/>{loading?'AUTHENTICATING…':hasToken?'Reconnect Google':'Connect Google Drive'}<ArrowRight size={15}/></button><button className="btn outline" onClick={onSelectLocal}><ArrowDownToLine size={16}/>Open local export</button></div>
 {hasToken&&<button className="text-button" onClick={openPicker}>Select Drive file with Google Picker <ChevronRight size={15}/></button>}
 {!configured&&<div className="alert"><CircleHelp size={17}/>OAuth configuration is missing. Set GitHub repository variables or local .env as described in README.</div>}
 {error&&<div className="alert error-alert">{error}</div>}
 <div className="empty-foot"><ShieldCheck size={14}/>Drive scope: file-by-file · No secrets in this site · No write operations</div></div>
}
function App(){
 const [tab,setTab]=useState('overview')
 const [navOpen,setNavOpen]=useState(false)
 const [sheet,setSheet]=useState(null)
 const [token,setToken]=useState('')
 const [mode,setMode]=useState('disconnected')
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 const [sdkReady,setSdkReady]=useState(false)
 const [fileId,setFileId]=useState(()=>{try{return localStorage.getItem(FILE_KEY)||config.expectedPlayerFileId}catch{return config.expectedPlayerFileId}})
 const [lastFetched,setLastFetched]=useState(null)
 const tokenRef=useRef('')
 const tokenClientRef=useRef(null)
 const fileIdRef=useRef(fileId)
 const inputRef=useRef(null)
 const cfgReady=Boolean(config.googleClientId && config.pickerApiKey && config.googleProjectNumber)
 const vm=useMemo(()=>getViewModel(sheet),[sheet])
 const refresh=useCallback(async(id,accessToken=tokenRef.current)=>{
   if(!accessToken){setError('Sign in to Google first.');return false}
   setBusy(true);setError('')
   try{
     const result=validatePlayerSheet(await fetchDriveJson(id,accessToken))
     setSheet(result);setMode('drive');setLastFetched(new Date());setFileId(id);fileIdRef.current=id
     try{localStorage.setItem(FILE_KEY,id)}catch{}
     return true
   }catch(e){setError(e.message||String(e));return false}
   finally{setBusy(false)}
 },[])
 useEffect(()=>{
   if(!cfgReady)return
   let cancelled=false
   loadGoogleSdk().then(()=>{if(cancelled)return
     const client=initTokenClient(config.googleClientId,async response=>{
       if(cancelled)return
       if(response.error||!response.access_token){setError(`Sign-in was not completed: ${response.error||'no access token'}`);setBusy(false);return}
       tokenRef.current=response.access_token;setToken(response.access_token);setBusy(false)
       if(fileIdRef.current)await refresh(fileIdRef.current,response.access_token)
     })
     tokenClientRef.current=client;setSdkReady(true)
   }).catch(e=>{if(!cancelled)setError(e.message)})
   return ()=>{cancelled=true}
 },[cfgReady,refresh])
 const connect=()=>{setError('');if(!sdkReady){setError('Google SDK is not ready yet.');return}setBusy(true);tokenClientRef.current?.requestAccessToken({prompt: 'consent'})}
 const picker=()=>{
   try{
     if(!tokenRef.current){setError('Sign in to Google before selecting a file.');return}
     openGooglePicker({token:tokenRef.current,apiKey:config.pickerApiKey,projectNumber:config.googleProjectNumber,onFileSelected:({id,name})=>{
       if(name&&name!=='PLAYER_SHEET.json'){setError('Select PLAYER_SHEET.json only. The canonical save contains private GM-only information.');return}
       refresh(id)
     }})
   }catch(e){setError(e.message)}
 }
 const importLocal=async e=>{
   const f=e.target.files?.[0];if(!f)return
   setError('')
   try{const result=validatePlayerSheet(JSON.parse(await f.text()));setSheet(result);setMode('local');setLastFetched(new Date())}
   catch(e){setError(e.message)}
   e.target.value=''
 }
 const signOut=()=>{
   if(tokenRef.current&&window.google?.accounts?.oauth2)window.google.accounts.oauth2.revoke(tokenRef.current,()=>{})
   tokenRef.current='';setToken('');setSheet(null);setMode('disconnected');setLastFetched(null);setError('')
 }
 const CurrentPage=pages[tab]||Overview
 return <div className="app">
  <aside className={'sidebar '+(navOpen?'sidebar-open':'')}>
   <div className="brand"><Logo/><div><div className="brand-title">HELIX <span>MERIDIAN</span></div><div className="brand-sub">CORPORATE SYSTEMS / N.C.</div></div><button className="mobile-close icon-button" onClick={()=>setNavOpen(false)} aria-label="Close menu"><X size={20}/></button></div>
   <div className="sidebar-line"/>
   <div className="side-kicker">PERSONNEL DATABASE</div>
   <nav aria-label="Character dossier sections">{nav.map(([id,label,Icon],i)=><button key={id} className={'nav-link '+(tab===id?'selected':'')} onClick={()=>{setTab(id);setNavOpen(false)}}><Icon size={18} strokeWidth={1.7}/><span>{label}</span>{tab===id&&<ChevronRight size={15} className="nav-chevron"/>}</button>)}</nav>
   <div className="sidebar-spacer"/>
   <div className="sidebar-info"><div className="side-kicker">DATA CONNECTION</div><div className="connection-line"><i className={'connection-led '+(mode==='drive'?'on':'')}/>{mode==='drive'?'DRIVE CONNECTED':mode==='local'?'LOCAL EXPORT':'NOT CONNECTED'}</div><p>PLAYER-ONLY PROJECTION</p><div className="build-id">CPR // LAST LIGHT</div></div>
  </aside>
  <div className="main-region">
   <header className="topbar"><div className="top-left"><button className="mobile-menu icon-button" aria-label="Open menu" onClick={()=>setNavOpen(true)}><Menu/></button><span className="breadcrumb">SYSTEM <ChevronRight size={12}/> PERSONNEL <ChevronRight size={12}/><b>{tab.toUpperCase()}</b></span></div><div className="top-actions"><Tag accent={mode==='drive'}>{mode==='drive'?'SYNCED TO DRIVE':mode==='local'?'OFFLINE VIEW':'PRIVATE ACCESS'}</Tag>{token&&<button className="icon-button" onClick={picker} title="Select another Drive file"><Cloud size={18}/></button>}{token&&<button className="icon-button" onClick={()=>refresh(fileId)} disabled={busy} title="Refresh player sheet"><RefreshCcw size={18} className={busy?'spinning':''}/></button>}{token&&<button className="icon-button" onClick={signOut} title="Sign out"><LogOut size={18}/></button>}</div></header>
   <main className="main-body"><div className="section-header"><div><div className="overline">CASE FILE / {tab==='overview'?'IDENTITY & CAPABILITIES':tab.toUpperCase()}</div><h1>{vm?vm.name:'Executive Dossier'}<span className="header-period">.</span></h1><p>Restricted personnel terminal <span className="header-sep">/</span> {vm?`${vm.employer} · ${vm.department}`:'Authorized access required'}</p></div><div className="sheet-stamp"><div>{vm?`REVISION ${String(vm.revision).padStart(3,'0')}`:'SECURITY LEVEL 04'}</div><span>{vm?`${formatDate(vm.date)} / ${vm.time}`:'DRIVE AUTH REQUIRED'}</span></div></div>
    {vm&&<div className="metric-grid"><Metric label="HIT POINTS" value={vm.hp} denominator={vm.maxHp} Icon={HeartPulse}/><Metric label="HUMANITY" value={vm.humanity} denominator={vm.maxHumanity} Icon={Activity}/><Metric label="EUROBUCKS" value={vm.credits} Icon={Wallet} hint="LIQUID BALANCE"/><Metric label="ARMOR / BODY" value={vm.armorBody} Icon={ShieldCheck} hint={`HEAD SP ${vm.armorHead}`}/></div>}
    {error&&vm&&<div className="alert error-alert top-error">{error}</div>}
    {vm?<CurrentPage vm={vm}/>:<EmptyState onConnect={connect} onSelectLocal={()=>inputRef.current?.click()} loading={busy} configured={cfgReady} error={error} hasToken={Boolean(token)} openPicker={picker}/>}
   </main>
   <footer className="site-footer"><span>HELIX MERIDIAN © 2045 / FICTIONAL SETTING</span><span>{mode==='drive'?'PRIVATE DRIVE VIEW':mode==='local'?'LOCAL SNAPSHOT — NOT SYNCHRONIZED':'READ-ONLY PORTAL'} · NEVER AUTHORITATIVE</span></footer>
  </div>
  <input ref={inputRef} type="file" accept=".json,application/json" hidden onChange={importLocal}/>
  {navOpen&&<button className="mobile-shade" aria-label="Close menu" onClick={()=>setNavOpen(false)}/>}
 </div>
}
export default App
