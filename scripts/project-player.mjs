#!/usr/bin/env node
/**
 * Canonical state -> player-only projection. STRICT allowlist, no GM-only copy.
 * Example: npm run project -- /private/CAMPAIGN_STATE.json /private/PLAYER_SHEET.json
 * The output is private! Upload IN PLACE to the designated Drive player file ID.
 */
import fs from 'node:fs'
import path from 'node:path'

const PC_KEYS = [
  'advancement','age','alt_spelling','base_stats','career_transition','childhood_environment',
  'condition','current_stats','cyberware','derived','education','equipment_item_ids','family_crisis',
  'freeform_agency','full_name','hair','hometown','id','ip','language_cultural','life_goal','money',
  'move_to_night_city','opening_preferences','origin','original_family_background','person_most_valued',
  'personal_style','personality_baseline','prior_profession','pronouns','rank','regard_for_people',
  'relationship_milestones','signature_eyewear','skill_allocation','skills','special_possession_item_id','top_value'
]
const COMPANY_KEYS = ['id','name','industry','exec_division','headquarters','products','select_international_offices','boss_relationship']
const ITEM_KEYS=['id','name','owner_id','quantity','condition','custody_or_location','acquisition','unit_cost_eb','total_cost_eb','notes']
const DRIVER_KEYS=['id','name','class','cover_job','status','stats','derived','loyalty','loyalty_provenance','stats_provenance','company_vehicle_id','equipment_ids','cyberware_package','skills_at_rank_2','skills_at_rank_4','skills_at_rank_6','standard_company_policies']
const FAMILY_KEYS=['id','name','relation','age','education','living','location','work','children_with_nathan','relationship_history','personality']
const CONTACT_KEYS=['id','name','role','work','last_contact','whereabouts','attitude_or_shared_history']
const HOUSING_KEYS=['area','first_month_paid_by_creation_rule','home_neighborhood_local_expert','housing_type','monthly_cost_eb','monthly_lifestyle','next_lifestyle_due_fictional_date','ownership','rent_due_eb','residents','unconfirmed']
const OBLIGATION_KEYS=['housing_and_lifestyle','professional_employment']
const OBLIGATION_ARRAY_KEYS=['accepted_jobs','debt','family_support_promises','offered_jobs_to_pc','player_contracts']
const VISIBLE_JOB_FIELDS=['id','title','name','description','status','accepted_at','due_date','reward_eb','paid_eb','counterparty','visibility']
const safeObligations=(obligations)=>({
  ...pick(obligations,OBLIGATION_KEYS),
  ...Object.fromEntries(OBLIGATION_ARRAY_KEYS.map(key=>[key,(obligations?.[key]||[])
    .filter(record=>record && record.visibility==='player-known')
    .map(record=>pick(record,VISIBLE_JOB_FIELDS))])),
})
const pick=(src,fields)=>Object.fromEntries(fields.filter(k=>Object.hasOwn(src||{},k)).map(k=>[k,src[k]]))

export function projectPlayer(canonical) {
  if (canonical?.campaign?.id !== 'CPR-HELIX-LAST-LIGHT-001') throw Error('Wrong campaign ID — refusing to export.')
  if (!Number.isInteger(canonical?.checkpoint?.revision)||canonical.checkpoint.revision<1) throw Error('Missing committed checkpoint revision.')
  const pc=canonical.player_character||{}
  if (pc.full_name!=='Nathan Guen') throw Error('Character identity mismatch.')
  const team=canonical.team?.driver||{}
  const knownIds=new Set([...(pc.equipment_item_ids||[]),...(team.equipment_ids||[])])
  // Additional company items only if explicitly tagged player-visible in canonical state.
  const safeItems=(canonical.property_and_inventory?.items||[])
    .filter(i=>knownIds.has(i.id) || i.visibility==='player-known')
    .map(i=>pick(i,ITEM_KEYS))
  const rel=canonical.people_and_relationships||{}
  const selectedScene=pick(canonical.world?.current_scene||{},['title','location_name','exact_room','description','combat'])
  const projection = {
    projection_schema: 'campaign-red-player-projection-v1',
    canonical_campaign_id: canonical.campaign.id,
    canonical_revision: canonical.checkpoint.revision,
    // Identifier only; do not fetch the canonical source from the public web viewer.
    canonical_drive_file_id: '1ErY7bCOQhehWZDL3RhdP0H8KXMPv14q2',
    title: 'Nathan Guen — Player Character Sheet (NONCANONICAL DERIVATIVE)',
    note: 'Spoiler-free derivative. The canonical Drive state is authoritative. No fictional time advances by generating this file.',
    fictional_calendar: canonical.world?.fictional_calendar,
    fictional_time_local: canonical.world?.time_local,
    starting_scene: selectedScene,
    employer:(canonical.corporations||[]).map(c=>pick(c,COMPANY_KEYS)),
    player_character:pick(pc,PC_KEYS),
    housing_and_lifestyle:pick(canonical.housing_lifestyle,HOUSING_KEYS),
    family_and_connections:{
      player_known_family:(rel.player_known_family||[]).map(p=>pick(p,FAMILY_KEYS)),
      personal_connections:(rel.personal_connections||[]).map(p=>pick(p,CONTACT_KEYS)),
      helix_staff:{
        boss:pick(rel.helix_staff?.boss,['name','relationship']),
        assigned_driver_id:rel.helix_staff?.assigned_driver_id,
      },
    },
    company_driver:pick(team,DRIVER_KEYS),
    equipment_and_property:{
      items:safeItems,
      ammo_state:pick(canonical.property_and_inventory?.ammo_state,['loaded_magazine','pc_vh_pistol_basic_total','pc_vh_pistol_ap_total','driver_vh_pistol_basic_total','driver_loaded_magazine']),
    },
    obligations:safeObligations(canonical.obligations),
    player_known_knowledge:[...(canonical.knowledge?.pc_knows||[])],
  }
  // Assert this output cannot accidentally be the full campaign payload.
  const out=JSON.stringify(projection,null,2)+'\n'
  for(const forbidden of ['"gm_only"','"framework_fixed_prepared_truth"','"prepared_npcs_not_yet_introduced"']) {
    if(out.includes(forbidden)) throw Error(`Refusing hidden-state key ${forbidden}`)
  }
  return projection
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const [input,output]=process.argv.slice(2)
  if(!input||!output){console.error('Usage: npm run project -- PATH_TO_CANONICAL.json OUTPUT_PLAYER_SHEET.json');process.exit(2)}
  const full=JSON.parse(fs.readFileSync(input,'utf8'))
  const projected=projectPlayer(full)
  fs.writeFileSync(output, JSON.stringify(projected,null,2)+'\n',{encoding:'utf8',mode:0o600})
  console.log(`Player-only projection R${projected.canonical_revision}: ${output}`)
}
