/**
 * Player-facing roster: exclusively assigned, player-visible team records from
 * the private PLAYER_SHEET projection. Never import unintroduced scenario NPCs.
 */
const hasText = value => typeof value === 'string' && value.trim().length > 0
const isUnset = value => !hasText(value) || /^(not yet|unestablished|unknown|undetermined|hr to designate)/i.test(value.trim())

const fixedSkillTiers = [
  [2, 'skills_at_rank_2'],
  [4, 'skills_at_rank_4'],
  [6, 'skills_at_rank_6'],
]

export function getCompanyPersonnel(vm = {}) {
  const driver = vm.driver
  if (!driver || typeof driver !== 'object' || !driver.id || driver.class !== 'Company Driver') return []
  const issuedIds = new Set(Array.isArray(driver.equipment_ids) ? driver.equipment_ids : [])
  const issued = (vm.companyPersonnelAssets || []).filter(item => issuedIds.has(item.id))
  const vehicle = issued.find(item => item.id === driver.company_vehicle_id) || null
  const equipment = issued.filter(item => item.id !== driver.company_vehicle_id)
  const skillTiers = fixedSkillTiers.map(([rank, key]) => ({
    rank,
    skills: Array.isArray(driver[key]) ? driver[key].filter(hasText) : [],
  })).filter(tier => tier.skills.length)

  return [{
    id: driver.id,
    label: isUnset(driver.name) ? 'Assigned Company Driver' : driver.name,
    identityPending: isUnset(driver.name),
    role: driver.class,
    jobTitle: isUnset(driver.cover_job) ? null : driver.cover_job,
    status: hasText(driver.status) ? driver.status : null,
    loyalty: typeof driver.loyalty === 'number' ? driver.loyalty : null,
    loyaltyProvenance: driver.loyalty_provenance || null,
    statsProvenance: driver.stats_provenance || null,
    stats: driver.stats && typeof driver.stats === 'object' ? driver.stats : {},
    derived: driver.derived && typeof driver.derived === 'object' ? driver.derived : {},
    vehicle,
    equipment,
    cyberware: Array.isArray(driver.cyberware_package) ? driver.cyberware_package.filter(hasText) : [],
    skills: skillTiers,
    policies: Array.isArray(driver.standard_company_policies) ? driver.standard_company_policies.filter(hasText) : [],
  }]
}
