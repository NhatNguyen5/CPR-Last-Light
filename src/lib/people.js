/** Deduplicate the player-known relationship record only; never query GM-only prepared NPCs. */
const isRealName = n => typeof n==='string' && n.trim().length>0 && !/^(unestablished|unknown|not yet|undetermined)/i.test(n)
export function knownPeople(vm = {}) {
  const groups = [
    ...(vm.family||[]).map(p=>({...p,kind:'family',tag:'Family',subtitle:p.relation||'Family'})),
    ...(vm.friends||[]).map(p=>({...p,kind:'friend',tag:'Connection',subtitle:p.role||'Connection'})),
    ...(vm.knownNpcs||[]).map(p=>({...p,kind:'npc',tag:p.relationship||'Known NPC',subtitle:p.role||p.relationship||'Known NPC'})),
  ]
  const seen=new Set()
  return groups.filter(p=>{
    if(!isRealName(p.name))return false
    const id=p.id||p.name.toLocaleLowerCase()
    if(seen.has(id))return false
    seen.add(id);return true
  })
}
export function contactPeople(vm = {}) {
  return knownPeople(vm).filter(p=>p.kind==='family'||p.kind==='friend'||p.contact_known === true)
}
