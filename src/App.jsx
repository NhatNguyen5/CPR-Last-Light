import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  Activity, ArrowDownToLine, ArrowRight, BriefcaseBusiness, CheckCircle2, ChevronRight,
  CircleHelp, Cloud, CloudOff, Cpu, ExternalLink, FileJson2, Fingerprint, HeartPulse,
  Home, IdCard, Layers3, LockKeyhole, LogOut, Menu, Radar, RefreshCcw, Search,
  Shield, ShieldCheck, Terminal, UserRound, UsersRound, Wallet, X, Zap, Dices, ArrowLeft,
} from 'lucide-react'
import {config} from './config.js'
import {fetchDriveJson, initTokenClient, loadGoogleSdk, openGooglePicker} from './lib/drive.js'
import {getViewModel, validatePlayerSheet} from './lib/projection.js'
import {readCachedPlayerSheet, writeCachedPlayerSheet, clearCachedPlayerSheet} from './lib/cache.js'
import {buildSkillGroups, SKILL_MAX_LEVEL} from './lib/skillCatalog.js'
import {readRollLog, writeRollLog, clearRollLog} from './lib/dice.js'
import {AgentHub, ContactsPage, KnownNpcsPage, ExecPage, CombatPage, RollDialog, RollHistoryDialog} from './features.jsx'

const FILE_KEY = 'cpr-last-light:player-file-id'
const browserStorage = () => {try{return window.localStorage}catch{return null}}
const nav = [
  ['overview','Bio',UserRound],['skills','Skills',Activity],['inventory','Gear',Shield],
  ['agent','Agent',FileJson2],['combat','Combat',Dices],['exec','Exec',BriefcaseBusiness],
]
const agentSubs = new Set(['contacts','npcs','records','cyberware'])
const allPageTitles = {overview:'Bio',skills:'Skills',inventory:'Gear',agent:'Agent',combat:'Combat',exec:'Teamwork',contacts:'Contacts',npcs:'Known NPCs',records:'Records',cyberware:'Cyberware'}
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
function SkillBar({level}) {
  return <div className="skill-tenbar" aria-label={`Rank ${level} of ${SKILL_MAX_LEVEL}`}>
    {Array.from({length:SKILL_MAX_LEVEL},(_,i)=><i key={i} className={i<level?'active':''}/>)}
  </div>
}
function Skills({vm,onRoll}) {
  const [search,setSearch]=useState('')
  const [showUntrained,setShowUntrained]=useState(true)
  const learned=useMemo(()=>Object.fromEntries(vm.skills),[vm.skills])
  const groups=useMemo(()=>buildSkillGroups(learned,vm.stats,{search,trainedOnly:!showUntrained}),[learned,vm.stats,search,showUntrained])
  const shown=groups.reduce((count,g)=>count+g.rows.length,0)
  return <div className="content-grid">
    <div className="span-12 skill-stat-strip" aria-label="Current attribute values">{statOrder.map(key=><div key={key}><span>{key}</span><strong>{vm.stats[key]??'—'}</strong></div>)}</div>
    <Panel className="span-12 skill-matrix-panel" label="SKILL MATRIX // CYBERPUNK RED" right={<Tag>{vm.skills.length} trained specializations</Tag>}>
      <div className="section-intro">
        <div><h2>Capabilities</h2><p>Nine core categories · Level / STAT / Base · Saved revision {vm.revision}</p></div>
        <label className="search-field"><Search size={16}/><input type="search" placeholder="Search skill or category..." aria-label="Search skills" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      </div>
      <div className="skills-toolbar">
        <span>{shown} skill rows · Normal maximum Level {SKILL_MAX_LEVEL}</span>
        <button type="button" className={'skill-mode-button'+(showUntrained?' active':'')} aria-pressed={showUntrained} onClick={()=>setShowUntrained(v=>!v)}>
          {showUntrained?'Showing all core Skills':'Showing trained Skills only'}
        </button>
      </div>
      <div className="skill-category-grid">
        {groups.map(group=><section className="skill-category" key={group.name} aria-label={group.name}>
          <div className="skill-category-heading"><h3>{group.name}</h3><span>{group.trainedCount} TRAINED</span></div>
          <div className="skill-table-columns" aria-hidden="true"><span>SKILL</span><span>LEVEL</span><span>STAT</span><span>BASE</span></div>
          {group.rows.map(row=><div className={'skill-table-row'+(row.trained?'':' untrained')+(row.parent?' specialized':'')} key={row.name}>
            <div className="skill-table-name" title={row.name}>{row.parent&&<small>{row.parent}</small>}<span>{row.label}</span>{row.doubleCost&&<em title="Costs twice as many improvement points">×2</em>}</div>
            <div className="skill-table-level"><strong>{row.level}</strong><SkillBar level={row.level}/>{row.aboveNormalMax&&<small className="skill-overcap">CHECK</small>}</div>
            <div className="skill-table-stat" title={row.stat||'Linked STAT not established'}><strong>{row.statValue??'—'}</strong><small>{row.stat||'?'}</small></div>
            <div className="skill-table-base">{row.trained&&row.base!==null?<button className="skill-roll-button" type="button" title={`Roll ${row.name}: +${row.base}`} aria-label={`Roll ${row.name}, base ${row.base}`} onClick={()=>onRoll({kind:'check',label:row.name,base:row.base,stat:row.stat,rank:row.level})}><Dices size={12}/> +{row.base}</button>:<span>—</span>}</div>
          </div>)}
        </section>)}
      </div>
      {!groups.length&&<ListEmpty text="No skills match those filters."/>}
      <p className="footnote">Skill Level normally tops out at 10 (starting cap 6). Trained Base = current linked STAT + Skill Level, before any modifiers or 1d10 roll. Untrained entries are shown as Level 0 with no trained Base; a GM determines whether an untrained check is allowed. ×2 Skills cost twice as many improvement points. This view never modifies Nathan's saved Skills.</p>
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
function Records({vm}) {
 const b=vm.background
 return <div className="content-grid"><Panel className="span-8" label="LIFEPATH LOG"><div className="record-list"><div><span>ORIGIN</span><p>{fmt(b.original_family_background)}</p></div><div><span>CHILDHOOD</span><p>{fmt(b.childhood_environment)}</p></div><div><span>FAMILY HISTORY</span><p>{fmt(b.family_crisis)}</p></div><div><span>RELATIONSHIP</span><p>{fmt(b.relationship_milestones)}</p></div><div><span>CAREER</span><p>{fmt(b.career_transition)}</p></div><div><span>MOVE TO NIGHT CITY</span><p>{fmt(b.move_to_night_city)}</p></div></div></Panel>
 <div className="span-4 stacked"><Panel label="CHECKPOINT"><div className="hero-numeric">R{vm.revision}</div><div className="subtle smaller">Canonical checkpoint revision</div><div className="panel-separator"/><Details pairs={[["Campaign","CPR-HELIX-LAST-LIGHT-001"],["IP",vm.ip],["Last fictional date",formatDate(vm.date)],["Current time",vm.time]]}/></Panel><Panel label="CAMPAIGN NOTES"><div className="record-list">{vm.knowledge.length?vm.knowledge.map((line,i)=><div key={i}><p>{line}</p></div>):<ListEmpty/>}</div><p className="footnote">Only facts Nathan knows are visible here. No unrevealed NPC truths or future plots.</p></Panel></div></div>
}
const pages={overview:Overview,skills:Skills,inventory:Inventory,agent:AgentHub,combat:CombatPage,exec:ExecPage,contacts:ContactsPage,npcs:KnownNpcsPage,cyberware:Cyberware,records:Records}
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
 const [syncOpen,setSyncOpen]=useState(false)
 const [rollRequest,setRollRequest]=useState(null)
 const [historyOpen,setHistoryOpen]=useState(false)
 const [rollHistory,setRollHistory]=useState(()=>readRollLog(browserStorage()))
 const [initialCache]=useState(()=>readCachedPlayerSheet(browserStorage(),config.expectedPlayerFileId))
 const [sheet,setSheet]=useState(initialCache?.sheet??null)
 const [token,setToken]=useState('')
 const [mode,setMode]=useState(initialCache?'cached':'disconnected')
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 const [needsConsent,setNeedsConsent]=useState(false)
 const [offlineCopyEnabled,setOfflineCopyEnabled]=useState(true)
 const [sdkReady,setSdkReady]=useState(false)
 const [fileId,setFileId]=useState(()=>{try{return localStorage.getItem(FILE_KEY)||config.expectedPlayerFileId}catch{return config.expectedPlayerFileId}})
 const [lastFetched,setLastFetched]=useState(initialCache?new Date(initialCache.savedAt):null)
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
     const fetchedAt=Date.now()
     setSheet(result);setMode('drive');setLastFetched(new Date(fetchedAt));setFileId(id);fileIdRef.current=id
     if(offlineCopyEnabled)writeCachedPlayerSheet(browserStorage(),id,config.expectedPlayerFileId,result,fetchedAt)
     try{localStorage.setItem(FILE_KEY,id)}catch{}
     return true
   }catch(e){setError(e.message||String(e));return false}
   finally{setBusy(false)}
 },[offlineCopyEnabled])
 useEffect(()=>{
   if(!cfgReady)return
   let cancelled=false
   loadGoogleSdk().then(()=>{if(cancelled)return
     const client=initTokenClient(config.googleClientId,async response=>{
       if(cancelled)return
       if(response.error||!response.access_token){setError(`Google authorization requires attention: ${response.error||'no access token'}. Tap Connect again to grant access if needed.`);setNeedsConsent(true);setBusy(false);return}
       tokenRef.current=response.access_token;setToken(response.access_token);setNeedsConsent(false);setBusy(false)
       if(fileIdRef.current)await refresh(fileIdRef.current,response.access_token)
     })
     tokenClientRef.current=client;setSdkReady(true)
   }).catch(e=>{if(!cancelled)setError(e.message)})
   return ()=>{cancelled=true}
 },[cfgReady,refresh])
 const connect=()=>{setError('');if(!sdkReady){setError('Google SDK is not ready yet.');return}setBusy(true);tokenClientRef.current?.requestAccessToken({prompt:needsConsent?'consent':''})}
 const removeOfflineCopy=()=>{clearCachedPlayerSheet(browserStorage());setOfflineCopyEnabled(false);if(mode==='cached'){setSheet(null);setMode('disconnected');setLastFetched(null)}}
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
   clearCachedPlayerSheet(browserStorage())
   tokenRef.current='';setToken('');setSheet(null);setMode('disconnected');setLastFetched(null);setError('')
 }
 const saveLocalRoll=(roll)=>setRollHistory(previous=>{const next=[roll,...previous].slice(0,30);writeRollLog(browserStorage(),next);return next})
 const deleteRollHistory=()=>{clearRollLog(browserStorage());setRollHistory([])}
 const goToPage=(id)=>{setTab(id);setNavOpen(false);setSyncOpen(false);window.scrollTo?.({top:0,behavior:'instant'})}
 useEffect(()=>{
   if(!rollRequest&&!historyOpen&&!syncOpen)return
   const onKey=e=>{if(e.key==='Escape'){setRollRequest(null);setHistoryOpen(false);setSyncOpen(false)}}
   document.addEventListener('keydown',onKey)
   return ()=>document.removeEventListener('keydown',onKey)
 },[rollRequest,historyOpen,syncOpen])
 const CurrentPage=pages[tab]||Overview
 const activeTab=agentSubs.has(tab)?'agent':tab
 return <div className="app">
  <aside className={'sidebar '+(navOpen?'sidebar-open':'')}>
   <div className="brand"><Logo/><div><div className="brand-title">HELIX <span>MERIDIAN</span></div><div className="brand-sub">CORPORATE SYSTEMS / N.C.</div></div><button className="mobile-close icon-button" onClick={()=>setNavOpen(false)} aria-label="Close menu"><X size={20}/></button></div>
   <div className="sidebar-line"/>
   <div className="side-kicker">PERSONNEL DATABASE</div>
   <nav aria-label="Character dossier sections">{nav.map(([id,label,Icon],i)=><button key={id} className={'nav-link '+(activeTab===id?'selected':'')} onClick={()=>goToPage(id)}><Icon size={18} strokeWidth={1.7}/><span>{label}</span>{tab===id&&<ChevronRight size={15} className="nav-chevron"/>}</button>)}</nav>
   <div className="sidebar-spacer"/>
   <div className="sidebar-info"><div className="side-kicker">DATA CONNECTION</div><div className="connection-line"><i className={'connection-led '+(mode==='drive'?'on':'')}/>{mode==='drive'?'DRIVE CONNECTED':mode==='cached'?'SAVED OFFLINE COPY':mode==='local'?'LOCAL EXPORT':'NOT CONNECTED'}</div><p>PLAYER-ONLY PROJECTION</p><div className="build-id">CPR // LAST LIGHT</div></div>
  </aside>
  <div className="main-region">
   <header className="topbar"><div className="top-left"><button className="mobile-menu icon-button" aria-label="Open menu" onClick={()=>setNavOpen(true)}><Menu/></button>{agentSubs.has(tab)&&<button className="icon-button subpage-back" title="Back to Agent" aria-label="Back to Agent" onClick={()=>goToPage('agent')}><ArrowLeft size={18}/></button>}<span className="breadcrumb">SYSTEM <ChevronRight size={12}/> PERSONNEL <ChevronRight size={12}/><b>{allPageTitles[tab]?.toUpperCase()||'OVERVIEW'}</b></span></div>
    <div className="top-actions"><div className="sync-anchor"><button className={'sync-toggle icon-button '+(mode==='cached'?'sync-is-cached':mode==='drive'?'sync-is-drive':'')} title="Drive sync and offline settings" aria-label={mode==='cached'?'Offline snapshot: open sync controls':mode==='drive'?'Drive data loaded: open sync controls':'Open Drive connection settings'} aria-expanded={syncOpen} onClick={()=>setSyncOpen(v=>!v)}>{mode==='cached'?<CloudOff size={19}/>:<Cloud size={19}/>}<i className="sync-indicator"/></button>
    {syncOpen&&<><button className="sync-dismiss" aria-label="Close sync menu" onClick={()=>setSyncOpen(false)}/><section className="sync-popover" role="dialog" aria-label="Character sync status"><div className="sync-popover-head"><strong>{mode==='cached'?'Offline snapshot':mode==='drive'?'Drive data loaded':mode==='local'?'Local file loaded':'Drive connection'}</strong><button className="icon-button" aria-label="Close sync menu" onClick={()=>setSyncOpen(false)}><X size={16}/></button></div><p>{vm?`Revision ${vm.revision} · ${mode==='cached'?'Stored locally; may be outdated.':mode==='drive'?'Loaded from private Drive.':'Not synchronized.'}`:'Sign in to load your private player sheet.'}</p>{lastFetched&&<small>Last download: {lastFetched.toLocaleString()}</small>}{error&&<div className="sync-error">{error}</div>}<button className="btn primary sync-main-action" onClick={()=>{setSyncOpen(false);if(tokenRef.current&&fileId){refresh(fileId)}else connect()}} disabled={!cfgReady||busy}>{busy?'Working…':token?'Refresh from Drive':'Connect & refresh'}<RefreshCcw size={16}/></button>{token&&<button className="sync-menu-link" onClick={()=>{setSyncOpen(false);picker()}}>Select player file with Picker</button>}{vm&&mode!=='local'&&<button className="sync-menu-link" onClick={()=>{removeOfflineCopy();setSyncOpen(false)}}>Remove offline copy</button>}{token&&<button className="sync-menu-link" onClick={()=>{signOut();setSyncOpen(false)}}>Sign out</button>}<p className="sync-warning">Local copy is not guaranteed current. The canonical campaign remains in private Drive.</p></section></>}</div></div></header>
   <main className="main-body"><div className="section-header"><div><div className="overline">CASE FILE / {tab==='overview'?'IDENTITY & CAPABILITIES':(allPageTitles[tab]||tab).toUpperCase()}</div><h1>{vm?(tab==='overview'?vm.name:allPageTitles[tab]):'Executive Dossier'}<span className="header-period">.</span></h1><p>Restricted personnel terminal <span className="header-sep">/</span> {vm?`${tab==='overview'?vm.employer:vm.name} · ${vm.department}`:'Authorized access required'}</p></div><div className="sheet-stamp"><div>{vm?`REVISION ${String(vm.revision).padStart(3,'0')}`:'SECURITY LEVEL 04'}</div><span>{vm?`${formatDate(vm.date)} / ${vm.time}`:'DRIVE AUTH REQUIRED'}</span></div></div>
    {vm&&tab==='overview'&&<div className="metric-grid"><Metric label="HIT POINTS" value={vm.hp} denominator={vm.maxHp} Icon={HeartPulse}/><Metric label="HUMANITY" value={vm.humanity} denominator={vm.maxHumanity} Icon={Activity}/><Metric label="EUROBUCKS" value={vm.credits} Icon={Wallet} hint="LIQUID BALANCE"/><Metric label="ARMOR / BODY" value={vm.armorBody} Icon={ShieldCheck} hint={`HEAD SP ${vm.armorHead}`}/></div>}
    {vm?<CurrentPage vm={vm} onNavigate={goToPage} onRoll={setRollRequest} history={rollHistory} onShowHistory={()=>setHistoryOpen(true)}/>:<EmptyState onConnect={connect} onSelectLocal={()=>inputRef.current?.click()} loading={busy} configured={cfgReady} error={error} hasToken={Boolean(token)} openPicker={picker}/>}
   </main>
   <footer className="site-footer"><span>HELIX MERIDIAN © 2045 / FICTIONAL SETTING</span><span>{mode==='drive'?'PRIVATE DRIVE VIEW':mode==='cached'?'SAVED OFFLINE SNAPSHOT — MAY BE OUTDATED':mode==='local'?'LOCAL SNAPSHOT — NOT SYNCHRONIZED':'READ-ONLY PORTAL'} · NEVER AUTHORITATIVE</span></footer>
  </div>
  <nav className="mobile-bottom-nav" aria-label="Main character pages">{nav.map(([id,label,Icon])=><button key={id} className={activeTab===id?'is-active':''} aria-current={activeTab===id?'page':undefined} onClick={()=>goToPage(id)}><Icon size={20} strokeWidth={2}/><span>{label}</span></button>)}</nav>
  <RollDialog request={rollRequest} onClose={()=>setRollRequest(null)} onSave={saveLocalRoll}/>
  {historyOpen&&<RollHistoryDialog history={rollHistory} onClose={()=>setHistoryOpen(false)} onClear={deleteRollHistory}/>}
  <input ref={inputRef} type="file" accept=".json,application/json" hidden onChange={importLocal}/>
  {navOpen&&<button className="mobile-shade" aria-label="Close menu" onClick={()=>setNavOpen(false)}/>}
 </div>
}
export default App
