/**
 * Cyberpunk RED core skill taxonomy (core pp. 81-85).
 * Core Skills normally range from Level 1 to 10. Level 6 is the starting
 * character-creation maximum for the Complete Package method.
 * All levels come exclusively from the player-safe projection.
 */
export const SKILL_MAX_LEVEL = 10
export const STARTING_SKILL_MAX_LEVEL = 6
const x2 = new Set(['Pilot Air Vehicle','Martial Arts','Autofire','Heavy Weapons','Demolitions','Electronics/Security Tech','Paramedic'])

export const SKILL_CATEGORIES = [
  {name:'Awareness Skills',entries:[
    ['Concentration','WILL'],['Conceal/Reveal Object','INT'],['Lip Reading','INT'],['Perception','INT'],['Tracking','INT']]},
  {name:'Body Skills',entries:[
    ['Athletics','DEX'],['Contortionist','DEX'],['Dance','DEX'],['Endurance','WILL'],['Resist Torture/Drugs','WILL'],['Stealth','DEX']]},
  {name:'Control Skills',entries:[
    ['Drive Land Vehicle','REF'],['Pilot Air Vehicle','REF'],['Pilot Sea Vehicle','REF'],['Riding','REF']]},
  {name:'Education Skills',entries:[
    ['Accounting','INT'],['Animal Handling','INT'],['Bureaucracy','INT'],['Business','INT'],
    ['Composition','INT'],['Criminology','INT'],['Cryptography','INT'],['Deduction','INT'],
    ['Education','INT'],['Gamble','INT'],['Language','INT'],['Library Search','INT'],
    ['Local Expert','INT'],['Science','INT'],['Tactics','INT'],['Wilderness Survival','INT']]},
  {name:'Fighting Skills',entries:[
    ['Brawling','DEX'],['Evasion','DEX'],['Martial Arts','DEX'],['Melee Weapon','DEX']]},
  {name:'Performance Skills',entries:[['Acting','COOL'],['Play Instrument','TECH']]},
  {name:'Ranged Weapon Skills',entries:[
    ['Archery','REF'],['Autofire','REF'],['Handgun','REF'],['Heavy Weapons','REF'],['Shoulder Arms','REF']]},
  {name:'Social Skills',entries:[
    ['Bribery','COOL'],['Conversation','EMP'],['Human Perception','EMP'],['Interrogation','COOL'],
    ['Persuasion','COOL'],['Personal Grooming','COOL'],['Streetwise','COOL'],['Trading','COOL'],['Wardrobe & Style','COOL']]},
  {name:'Technique Skills',entries:[
    ['Air Vehicle Tech','TECH'],['Basic Tech','TECH'],['Cybertech','TECH'],['Demolitions','TECH'],
    ['Electronics/Security Tech','TECH'],['First Aid','TECH'],['Forgery','TECH'],
    ['Land Vehicle Tech','TECH'],['Paint/Draw/Sculpt','TECH'],['Paramedic','TECH'],
    ['Photography/Film','TECH'],['Pick Lock','TECH'],['Pick Pocket','TECH'],
    ['Sea Vehicle Tech','TECH'],['Weaponstech','TECH']]},
]

const specialized = new Set(['Language','Local Expert','Science','Martial Arts','Play Instrument'])
const finiteLevel = value => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0)

function makeRow(fullName,label,stat,level,currentStats,parent=null) {
  const statValue = typeof currentStats?.[stat] === 'number' && Number.isFinite(currentStats[stat]) ? currentStats[stat] : null
  const rank = finiteLevel(level)
  return {
    name:fullName,label,parent,stat,statValue,level:rank,
    base:rank > 0 && statValue !== null ? statValue + rank : null,
    doubleCost:x2.has(parent || fullName),
    trained:rank > 0,
    aboveNormalMax:rank > SKILL_MAX_LEVEL,
  }
}

/**
 * Show the complete rulebook categories including untrained skills.
 * Specialized Skills display one row per verified specialization in the save.
 * Expansion skills stay visible without guessing an unknown linked STAT.
 */
export function buildSkillGroups(skills = {}, currentStats = {}, {search='',trainedOnly=false}={}) {
  const known = new Set()
  const input = skills && typeof skills === 'object' && !Array.isArray(skills) ? skills : {}
  const needle = search.trim().toLowerCase()
  const groups = SKILL_CATEGORIES.map(category => {
    const rows = []
    for(const [name,stat] of category.entries){
      if(specialized.has(name)){
        const variants=Object.keys(input).filter(key => key === name || key.startsWith(name + ' (')).sort((a,b)=>a.localeCompare(b))
        for(const key of variants){
          known.add(key)
          const sublabel=key.startsWith(name + ' (') && key.endsWith(')') ? key.slice(name.length + 2,-1) : key
          rows.push(makeRow(key, sublabel, stat, input[key], currentStats, name))
        }
        if(!variants.length) rows.push(makeRow(name,name,stat,0,currentStats))
      }else {
        known.add(name)
        rows.push(makeRow(name,name,stat,input[name] ?? 0,currentStats))
      }
    }
    const relevant=rows.filter(row => (!trainedOnly || row.trained) &&
      (!needle || [row.name,row.label,row.parent,category.name].filter(Boolean).some(x=>x.toLowerCase().includes(needle))))
    return {name:category.name,rows:relevant,trainedCount:relevant.filter(r=>r.trained).length}
  }).filter(group=>group.rows.length>0)

  const extra = Object.keys(input).filter(key => !known.has(key)).sort((a,b)=>a.localeCompare(b))
    .map(key=>makeRow(key,key,null,input[key],currentStats))
    .filter(row=>(!trainedOnly || row.trained)&&(!needle || row.name.toLowerCase().includes(needle)||'additional skills'.includes(needle)))
  if(extra.length)groups.push({name:'Additional Skills',rows:extra,trainedCount:extra.filter(r=>r.trained).length})
  return groups
}
