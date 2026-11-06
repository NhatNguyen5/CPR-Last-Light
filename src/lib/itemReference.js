/**
 * Concise, rules-faithful summaries of Nathan's known equipment.
 * Sources: Cyberpunk RED Core Rulebook pp. 340–355, 358–362.
 * This is reference material, not a grant of equipment or a campaign action.
 */
export const GEAR_TABS = ['Ammo', 'Armor', 'Clothing', 'Cyberware', 'Gear', 'Programs', 'Vehicles', 'Weapons']
export const REFERENCE_URLS = Object.freeze({
  gear: 'https://drive.google.com/file/d/1R8KnCQmnWdw8htUyQRRHStdeNTTjFmTl/view',
  cyberware: 'https://drive.google.com/file/d/1y0G0HDSHNnHyaLTb13yxfoo9AOZbOpd4/view',
  weapons: 'https://drive.google.com/file/d/1M1gUYdG0NN46zn-WDyWOKBNlvCMELdWE/view',
  ammunition: 'https://drive.google.com/file/d/1A68LI3Sl1swbpoD2p7eHxg6xibB41vC2/view',
  fashion: 'https://drive.google.com/file/d/1ztHhAF6wZ81yR7rvj7T0QaXTkE3PLqdQ/view',
})
const ref = (description, rules, page, source) => ({description, rules, page, source: REFERENCE_URLS[source]})
const ruleIndex = [
  [/^Cyberaudio Suite$/i, ref('An invisible inner-skull audio system that serves as the foundation for cyberaudio options.', 'Three option slots. Only one Cyberaudio Suite may be installed.', 361, 'cyberware')],
  [/^Internal Agent$/i, ref('Voice-operated Agent built into a Cyberaudio Suite. Can describe visual content or send it to a linked display, including a Chyron.', 'Requires Cyberaudio Suite. Its Memory Chip can be removed only through surgery.', 362, 'cyberware')],
  [/^Enhanced Antibodies$/i, ref('Implant that speeds natural recovery after the patient has been stabilized.', 'With rest and light activity, recover HP equal to 2 × BODY per day instead of the usual healing rate; does not instantly restore HP.', 362, 'cyberware')],
  [/^Smart Glasses$/i, ref('Wearable frames that house cybereye options and confer their benefits while worn.', 'Two cybereye option slots per pair; one pair can be worn at a time. External, not an implanted Cybereye.', 354, 'gear')],
  [/^Chyron cyberoptic option for Smart Glasses$/i, ref('Small heads-up display for messages, video, and information over the wearer’s normal view.', 'Installed in Nathan’s Smart Glasses; its benefits apply while those glasses are worn. No implanted Cybereye is established.', 360, 'cyberware')],
  [/^Biomonitor fashionware$/i, ref('Under-skin biometric readout tracking measurements such as pulse, temperature, and respiration.', 'Can connect to an Agent for wellness tracking. Fashionware: no Humanity Loss.', 358, 'cyberware')],
  [/^Light Armorjack body armor$/i, ref('Flexible Kevlar and plastic-mesh armor woven into clothing to resist bullets and other attacks.', 'Body SP 11; no REF, DEX, or MOVE penalty. Ownership does not establish whether it is currently worn.', 350, 'gear')],
  [/^Light Armorjack head armor$/i, ref('Head protection made using the Light Armorjack armor specification.', 'Head SP 11; no REF, DEX, or MOVE penalty. Worn status is unconfirmed.', 350, 'gear')],
  [/^Standard Quality Very Heavy Pistol$/i, ref('Conventional Very Heavy Pistol at standard weapon quality.', '4d6 damage; ROF 1; eight-round standard magazine. Loaded status is not yet established; no excellent-quality bonus.', 342, 'weapons')],
  [/^Basic Very Heavy Pistol rounds$/i, ref('Standard ammunition for the Very Heavy Pistol.', 'Nathan has 30 basic rounds in the verified save; allocation between magazine and reserve is unconfirmed.', 345, 'ammunition')],
  [/^Armor-Piercing Very Heavy Pistol rounds$/i, ref('Special Very Heavy Pistol ammunition intended to wear through armor more quickly.', 'If armor is ablated by the hit, the attack ablates one extra SP. Ten rounds in the verified save.', 345, 'ammunition')],
  [/^Medtech Bag$/i, ref('Portable medical toolkit containing instruments and supplies for performing medical work.', 'Supports medical tasks appropriate to the user’s actual Skills. Carrying the kit does not grant medical training.', 354, 'gear')],
  [/^Techtool$/i, ref('Compact folding multi-tool with a utility blade, pliers, screwdrivers, files, and clippers.', 'General tool; not a complete Tech Bag or a substitute for specialized equipment.', 355, 'gear')],
  [/^Anti-Smog Breathing Mask$/i, ref('Protective breathing mask that filters contaminated air, fumes, and smoke.', 'Protects against toxic gases and similar inhaled dangers while it is properly worn.', 352, 'gear')],
  [/^Flashlight$/i, ref('Rechargeable portable flashlight.', 'Beam reaches 100 m/yd; charge lasts up to 10 hours.', 353, 'gear')],
  [/^Carryall$/i, ref('Durable ripstop-nylon utility bag available in sizes from messenger bag to large duffel.', 'Storage item; no additional carrying-capacity bonus is established.', 352, 'gear')],
  [/^Duct Tape$/i, ref('Adhesive utility tape, sold in ordinary or optional glow-in-the-dark varieties.', 'Can mark locations and caches. Nathan’s roll is not established as the glowing variety.', 353, 'gear')],
  [/^Radio Communicator$/i, ref('Wearable radio earpiece for local communication.', 'Radio range: one mile.', 354, 'gear')],
  [/^Leisurewear (Bottoms|Top|Jacket|Footwear)$/i, ref('Leisurewear clothing from Nathan’s personal wardrobe.', 'Fashion item. Individual appearance and currently worn outfit are not established.', 356, 'fashion')],
  [/^Businesswear (Jacket|Top|Bottom|Footwear)$/i, ref('Businesswear issued through Nathan’s Exec corporate benefits.', 'Helix Meridian property. Issuance does not establish that the garment is currently worn.', 356, 'fashion')],
  [/^Jewelry ring — gift from Anna$/i, ref('A personal ring given to Nathan by Anna Le.', 'Saved as a treasured possession. Its precise appearance and current location are not established.', null, null)],
  [/^Compact Groundcar with Seating Upgrade$/i, ref('A compact company groundcar with a seating upgrade, assigned as part of Exec Teamwork.', 'Helix Meridian asset in the company driver’s custody; not Nathan’s personal vehicle.', null, null)],
]

export function classifyItem(item = {}) {
  const name = String(item.name || '')
  if (/\b(rounds|ammunition)\b/i.test(name)) return 'Ammo'
  if (/Armorjack|body armor|head armor|\barmor\b/i.test(name)) return 'Armor'
  if (/^(Leisurewear|Businesswear)\b|^Jewelry ring/i.test(name)) return 'Clothing'
  if (/Cyberaudio Suite|Internal Agent|Enhanced Antibodies|Smart Glasses|Chyron|Biomonitor/i.test(name)) return 'Cyberware'
  if (/\bprogram\b/i.test(name)) return 'Programs'
  if (/Groundcar|\bvehicle\b/i.test(name)) return 'Vehicles'
  if (/\bPistol\b|\bRifle\b|\bShotgun\b|\bWeapon\b/i.test(name)) return 'Weapons'
  return 'Gear'
}

export function describeItem(item = {}) {
  const name = String(item.name || '')
  const found = ruleIndex.find(([matcher]) => matcher.test(name))
  return found ? {...found[1], isRulesReference: found[1].page != null} : {
    description: item.notes ? String(item.notes) : 'No indexed core-rule description for this saved item.',
    rules: null, page: null, source: null, isRulesReference: false,
  }
}

export function effectiveQuantity(item, draft = {}) {
  return Math.max(0, (Number(item.quantity) || 0) + (Number(draft[item.id]) || 0))
}

export function stageQuantityDelta(draft, item, direction) {
  if (!item?.id || !Number.isInteger(direction) || Math.abs(direction) !== 1) return draft
  const quantity = Number(item.quantity) || 0
  const current = effectiveQuantity(item, draft)
  if ((direction < 0 && current <= 0) || (direction > 0 && current >= 9999)) return draft
  const next = {...draft, [item.id]: (Number(draft[item.id]) || 0) + direction}
  if (next[item.id] === 0) delete next[item.id]
  return next
}
