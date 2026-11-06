/**
 * Cyberpunk RED dice helpers. Game rolls happen only on explicit button clicks.
 * Results are local reference records, not authoritative campaign events.
 */
export const ROLL_LOG_KEY = 'cpr-last-light:local-rolls-v1'

/** Cryptographically secure, rejection-sampled uniform die (no Math.random fallback). */
export function secureDie(sides, rng = () => globalThis.crypto?.getRandomValues(new Uint32Array(1))[0]) {
  if (!Number.isInteger(sides) || sides < 2 || sides > 100) throw Error('Invalid die size.')
  const ceiling = 0x100000000
  const limit = Math.floor(ceiling / sides) * sides
  for (let tries = 0; tries < 100; tries++) {
    const value = rng()
    if (!Number.isInteger(value) || value < 0 || value >= ceiling) throw Error('Secure randomness is unavailable.')
    if (value < limit) return value % sides + 1
  }
  throw Error('Unable to obtain an unbiased roll.')
}

/** RED Skill checks: natural 10 adds one more d10; natural 1 subtracts one. Never chain. */
export function rollRedCheck({label, base, modifier = 0, rng} = {}) {
  if (!Number.isFinite(base) || !Number.isInteger(modifier)) throw Error('Invalid roll base or modifier.')
  const first = secureDie(10, rng)
  const second = first === 1 || first === 10 ? secureDie(10, rng) : null
  const adjustment = first === 10 ? second : first === 1 ? -second : 0
  return {kind:'check',label,base,modifier,first,second,adjustment,total:base+modifier+first+adjustment,
    critical:first === 10?'success':first === 1?'failure':null}
}

/** Initiative is REF + 1d10; not a Skill Check, so no critical-explosion rule. */
export function rollInitiative({base, modifier = 0, rng} = {}) {
  if (!Number.isFinite(base) || !Number.isInteger(modifier)) throw Error('Invalid roll base or modifier.')
  const first=secureDie(10,rng)
  return {kind:'initiative',label:'Initiative',base,modifier,first,second:null,adjustment:0,total:base+modifier+first,critical:null}
}

export function rollDamage({label = 'Damage', count = 4, sides = 6, modifier = 0, rng} = {}) {
  if (!Number.isInteger(count)||count<1||count>20||!Number.isInteger(modifier))throw Error('Invalid damage roll.')
  const dice=Array.from({length:count},()=>secureDie(sides,rng))
  return {kind:'damage',label,modifier,dice,sides,total:dice.reduce((a,b)=>a+b,0)+modifier}
}

export function readRollLog(storage) {
  try {
    const raw=JSON.parse(storage?.getItem(ROLL_LOG_KEY)||'[]')
    return Array.isArray(raw)?raw.filter(x=>x&&['check','initiative','damage'].includes(x.kind)&&Number.isFinite(x.total)).slice(0,30):[]
  }catch{return []}
}
export function writeRollLog(storage, records) {
  try{storage?.setItem(ROLL_LOG_KEY,JSON.stringify(records.slice(0,30)));return true}catch{return false}
}
export function clearRollLog(storage){try{storage?.removeItem(ROLL_LOG_KEY);return true}catch{return false}}

export function describeRoll(roll) {
  if (!roll) return ''
  const date=roll.at?new Date(roll.at).toLocaleString():''
  if(roll.kind==='damage')return `${roll.label}: ${roll.dice.join(' + ')}${roll.modifier?` ${roll.modifier<0?'-':'+'} ${Math.abs(roll.modifier)}`:''} = ${roll.total}. Local reference roll ${date}; not committed to campaign.`
  const followup=roll.second!==null?` ${roll.critical==='success'?'+':'-'} ${roll.second} (critical ${roll.critical})`:''
  return `${roll.label}: ${roll.base} base ${roll.modifier<0?'-':'+'} ${Math.abs(roll.modifier)} modifier + ${roll.first}${followup} = ${roll.total}${Number.isFinite(roll.dv)?` vs DV ${roll.dv}`:''}. Local reference roll ${date}; not committed to campaign.`
}
