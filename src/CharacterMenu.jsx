import {useState} from 'react'
export function CharacterMenu({profiles=[],activeKey,onSelect,onImport,onDrive}){
 const [open,setOpen]=useState(false)
 return <div className="character-selector">
  <button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>Characters ▾</button>
  {open&&<div className="character-menu">
   {profiles.map(p=><button key={p.key} type="button" onClick={()=>{onSelect(p.key);setOpen(false)}} aria-current={p.key===activeKey}>{p.name} · {p.role}</button>)}
   <button type="button" onClick={()=>{onImport();setOpen(false)}}>Import JSON</button>
   <button type="button" onClick={()=>{onDrive();setOpen(false)}}>Choose Drive file</button>
  </div>}
 </div>
}
