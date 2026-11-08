import {describeItem} from './itemReference.js'

/**
 * Present only damage pools documented on the current player-only character sheet
 * (or an indexed published rule for an actually owned weapon).
 * These are reference rolls, never proof of an equipped/loaded weapon or a hit.
 */
export function parseDamageDice(value) {
 if(typeof value!=='string')return null
 const match=value.match(/(?:^|[^\w])(\d{1,2})d6\b/i)
 if(!match)return null
 const count=Number(match[1])
 return Number.isInteger(count)&&count>=1&&count<=20?count:null
}
export function getDamagePresets(vm={}) {
 const presets=[],seen=new Set()
 function add(id,label,value) {
  const count=parseDamageDice(value)
  if(!count||!id||seen.has(id))return
  seen.add(id)
  presets.push({id,label,count,sides:6})
 }
 for(const item of vm.inventory||[]) {
  const name=typeof item?.name==='string'?item.name:''
  if(!name||!item.id||/\b(ammo|ammunition|rounds?|magazine|cartridge|bullets?)\b/i.test(name))continue
  if(!/\b(pistol|rifle|shotgun|knife|blade|wolver|baton|club|bow|grenade|weapon|sword|smg|machinegun|axe)\b/i.test(name))continue
  const reference=describeItem(item)
  add('weapon:'+item.id,name,item.mechanics||((reference?.isRulesReference&&reference.rules)||''))
 }
 const derived=vm.background?.derived||{}
 add('unarmed:brawling','Brawling (unarmed)',derived.Brawling_unarmed_damage)
 add('unarmed:martial-arts','Martial Arts (unarmed)',derived.Martial_Arts_unarmed_damage)
 return presets
}
