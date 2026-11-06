export const EXPECTED_CAMPAIGN = 'CPR-HELIX-LAST-LIGHT-001'

/** Reject the full campaign save and any wrong-campaign/invalid projection. */
export function validatePlayerSheet(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('Expected a player-sheet JSON object.')
  if ('gm_only' in raw || 'framework_fixed_prepared_truth' in raw || 'prepared_npcs_not_yet_introduced' in raw) {
    throw Error('Refusing GM-only or unfiltered campaign state. Select PLAYER_SHEET.json instead.')
  }
  if (raw.canonical_campaign_id !== EXPECTED_CAMPAIGN) throw Error('This file is not Nathan Guen’s verified campaign.')
  if (!Number.isInteger(raw.canonical_revision) || raw.canonical_revision < 1) throw Error('The sheet has no valid canonical revision.')
  if (raw.player_character?.full_name !== 'Nathan Guen') throw Error('The player character identity does not match.')
  if (!raw.player_character?.derived || !raw.player_character?.skills || !raw.equipment_and_property) throw Error('Incomplete player-only projection.')
  // Only known, player-facing views consume properties below; never render arbitrary source JSON.
  return raw
}

const number = (n) => typeof n === 'number' && Number.isFinite(n) ? n : 0
export function getViewModel(data) {
  if (!data) return null
  const pc = data.player_character
  const derived = pc.derived || {}
  const inventory = Array.isArray(data.equipment_and_property?.items) ? data.equipment_and_property.items : []
  const ownId = pc.id
  const personal = inventory.filter(i => i.owner_id === ownId || i.acquisition === 'starting_fashion_budget')
  const cyberwareNames = new Set((pc.cyberware?.installed_on_pc || []).concat(pc.cyberware?.external_smart_glasses_options || []))
  const gear = personal.filter(i => !cyberwareNames.has(i.id))
  return {
    name: pc.full_name,
    age: pc.age,
    rank: pc.rank,
    employer: data.employer?.[0]?.name || 'Helix Meridian',
    department: data.employer?.[0]?.exec_division || 'Research & Development',
    revision: data.canonical_revision,
    date: data.fictional_calendar,
    time: data.fictional_time_local,
    scene: data.starting_scene?.location_name || 'Location not confirmed',
    hp: number(derived.current_hp),
    maxHp: number(derived.max_hp),
    humanity: number(derived.current_humanity),
    maxHumanity: number(derived.max_humanity_after_installed_cyberware),
    armorBody: number(pc.condition?.armor_body_sp),
    armorHead: number(pc.condition?.armor_head_sp),
    credits: number(pc.money?.liquid_balance_eb),
    reputation: Number.isInteger(pc.reputation) ? pc.reputation : null,
    stats: pc.current_stats || {},
    baseEmp: pc.base_stats?.EMP,
    skills: Object.entries(pc.skills || {}).sort((a,b)=> a[0].localeCompare(b[0])),
    inventory: personal,
    companyBenefits: inventory.filter(i => ['exec_company_benefit','exec_company_team_driver_package'].includes(i.acquisition)),
    // Driver assets are drawn from the already player-safe projection, never the canonical save.
    companyPersonnelAssets: inventory.filter(i => (data.company_driver?.equipment_ids || []).includes(i.id)),
    gear,
    cyberware: personal.filter(i=>cyberwareNames.has(i.id) || /Biomonitor/i.test(i.name)),
    ammo: data.equipment_and_property?.ammo_state || {},
    family: data.family_and_connections?.player_known_family || [],
    friends: data.family_and_connections?.personal_connections || [],
    knownNpcs: data.family_and_connections?.known_npcs || [],
    driver: data.company_driver || {},
    background: pc,
    housing: data.housing_and_lifestyle || {},
    obligations: data.obligations || {},
    knowledge: data.player_known_knowledge || [],
    ip: number(pc.ip),
  }
}

export function groupSkills(skills, filter) {
  const needle=(filter||'').trim().toLowerCase()
  return skills.filter(([name]) => name.toLowerCase().includes(needle))
}
