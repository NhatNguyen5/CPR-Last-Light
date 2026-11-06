import {test} from 'node:test'
import assert from 'node:assert/strict'
import {SKILL_MAX_LEVEL, STARTING_SKILL_MAX_LEVEL, SKILL_CATEGORIES, buildSkillGroups} from '../src/lib/skillCatalog.js'

const stats={INT:8,REF:8,DEX:5,TECH:5,COOL:8,WILL:6,EMP:5}
const getRow=(groups,name)=>groups.flatMap(g=>g.rows).find(r=>r.name===name)

test('core taxonomy has nine categories, rank scale 10, and calculates Bases',()=>{
 assert.equal(SKILL_MAX_LEVEL,10)
 assert.equal(STARTING_SKILL_MAX_LEVEL,6)
 assert.equal(SKILL_CATEGORIES.length,9)
 const groups=buildSkillGroups({Business:10,Handgun:9},stats)
 assert.equal(getRow(groups,'Business').base,18)
 assert.equal(getRow(groups,'Handgun').base,17)
 assert.equal(getRow(groups,'Business').aboveNormalMax,false)
})
test('subspecialties appear under Education; EMP uses current reduced STAT',()=>{
 const groups=buildSkillGroups({
  'Language (Streetslang)':2,'Language (Vietnamese)':4,
  'Science (Computer Science)':4,
  'Local Expert (Helix corporate residential complex)':2,
  'Human Perception':4,'Electronics/Security Tech':4,
 },stats)
 const edu=groups.find(g=>g.name==='Education Skills')
 assert.equal(edu.rows.filter(r=>r.parent==='Language').length,2)
 assert.equal(getRow(groups,'Science (Computer Science)').base,12)
 assert.equal(getRow(groups,'Human Perception').base,9)
 assert.equal(getRow(groups,'Electronics/Security Tech').doubleCost,true)
})
test('untrained Skills are distinct and trained-only filter preserves existing ranks',()=>{
 const groups=buildSkillGroups({Handgun:4},stats)
 assert.equal(getRow(groups,'Handgun').level,4)
 assert.equal(getRow(groups,'Archery').level,0)
 assert.equal(getRow(groups,'Archery').base,8)
 assert.equal(getRow(groups,'Archery').trained,false)
 assert.equal(getRow(groups,'Archery').requiresSpecialization,false)
 const trained=buildSkillGroups({Handgun:4},stats,{trainedOnly:true})
 assert.equal(getRow(trained,'Handgun').level,4)
 assert.equal(getRow(trained,'Archery'),undefined)
 const searched=buildSkillGroups({'Science (Mathematics)':2},stats,{search:'math'})
 assert.equal(searched.length,1)
 assert.equal(searched[0].name,'Education Skills')
})
test('unknown expansion Skills are displayed with unknown linked STAT',()=>{
 const row=getRow(buildSkillGroups({'Unmapped Expansion Skill':3},stats),'Unmapped Expansion Skill')
 assert.ok(row)
 assert.equal(row.statValue,null)
 assert.equal(row.base,null)
 assert.equal(getRow(buildSkillGroups({Business:11},stats),'Business').aboveNormalMax,true)
})

test('untrained abstract specialties require a named subject but retain STAT+0',()=>{
 const groups=buildSkillGroups({},stats)
 const lang=getRow(groups,'Language')
 const science=getRow(groups,'Science')
 assert.equal(lang.base,8)
 assert.equal(lang.requiresSpecialization,true)
 assert.equal(science.base,8)
 assert.equal(science.requiresSpecialization,true)
 assert.equal(getRow(groups,'Conceal/Reveal Object').base,8)
})
