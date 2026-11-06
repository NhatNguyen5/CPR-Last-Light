import {BriefcaseBusiness, Cpu, Wrench, HeartPulse, Shield, CarFront, Radio, Mic2, Handshake, UserRound, BookOpen} from 'lucide-react'
import {ExecPage} from './features.jsx'
import {RED_ROLES} from './lib/roles.js'

const icons={Solo:Shield,Netrunner:Cpu,Tech:Wrench,Medtech:HeartPulse,
 Media:BookOpen,Lawman:Shield,Fixer:Handshake,Nomad:CarFront,Rockerboy:Mic2,Exec:BriefcaseBusiness}
const display=value=>{
 if(value===null||value===undefined)return 'Not recorded'
 if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return String(value)
 if(Array.isArray(value))return value.map(display).join(' · ')
 return null
}
export function RolePage({vm,onNavigate}) {
 const role=vm.role||'Unspecified'
 if(role==='Exec'&&vm.campaignId==='CPR-HELIX-LAST-LIGHT-001'&&vm.characterId==='CPR-HELIX-PC-001')return <ExecPage vm={vm} onNavigate={onNavigate}/>
 const Icon=icons[role]||UserRound
 const ability=vm.roleAbility||RED_ROLES[role]||'Role Ability'
 const details=Object.entries(vm.roleData||{}).map(([key,value])=>[key,display(value)]).filter(([,value])=>value!==null)
 return <div className="content-grid">
  <section className="panel span-8">
   <div className="panel-heading"><span className="micro-label">ROLE MODULE / PLAYER-SAFE</span><span className="tag">RANK {vm.roleLevel??'—'}</span></div>
   <div className="role-hero"><Icon size={34}/><div><h2>{ability}</h2><p>{role} · {vm.name}</p></div></div>
   <p className="subtle smaller">Your role is drawn from the current character projection. This module never invents unrecorded role perks, NET programs, projects, contacts, or NPC support.</p>
   {details.length?<dl className="details">{details.map(([key,value])=><div className="detail-row" key={key}><dt>{key.replace(/_/g,' ')}</dt><dd>{value}</dd></div>)}</dl>:
    <div className="empty-inline">No detailed {ability} state has been published in this player sheet yet. Add player-known <code>player_character.role_data</code> fields in the next approved projection to populate this module.</div>}
  </section>
  <section className="panel span-4">
   <div className="micro-label">ROLE STATUS</div><h2 className="page-side-title">{role}</h2>
   <div className="dossier-details"><div><dt>Ability</dt><dd>{ability}</dd></div><div><dt>Rank</dt><dd>{vm.roleLevel??'Not recorded'}</dd></div><div><dt>Source</dt><dd>Player projection R{vm.revision}</dd></div></div>
   <p className="footnote">Role-specific content is read-only. Rule-based actions require GM adjudication. Campaign files are never modified here.</p>
  </section>
 </div>
}
