import {useEffect,useMemo,useRef,useState} from 'react'
import {ChevronDown, ClipboardCopy, Cpu, Minus, Package, Plus, RotateCcw, Shield, Wallet, Zap} from 'lucide-react'
import {classifyItem,describeItem,effectiveQuantity,GEAR_TABS,stageQuantityDelta} from './lib/itemReference.js'

const companyItem = (item,playerId) => item.owner_id !== playerId
const getAllItems = vm => [...(vm.inventory || []), ...(vm.companyBenefits || [])]

export function Inventory({vm,initialCategory='Gear',draftAdjustments={},onDraftChange=()=>{}}) {
 const [category,setCategory] = useState(initialCategory)
 const [expanded,setExpanded] = useState({})
 const tabRefs = useRef({})
 const allItems = useMemo(()=>getAllItems(vm),[vm])
 const counts=useMemo(()=>Object.fromEntries(GEAR_TABS.map(c=>[c,allItems.filter(i=>classifyItem(i)===c).length])),[allItems])
 const shown=allItems.filter(i=>classifyItem(i)===category)
 const staged=allItems.filter(i=>Number(draftAdjustments[i.id])!==0 && Number.isFinite(Number(draftAdjustments[i.id])))
 useEffect(()=>setCategory(initialCategory),[initialCategory])
 const selectCategory = name => {
  setCategory(name)
  tabRefs.current[name]?.scrollIntoView?.({behavior:'smooth',inline:'center',block:'nearest'})
 }
 const updateQuantity=(item,delta)=>{
  if(companyItem(item,vm.background.id)) return
  onDraftChange(stageQuantityDelta(draftAdjustments,item,delta))
 }
 const summary=staged.map(item=>{
  const d=Number(draftAdjustments[item.id]);return `${d>0?'+':''}${d} × ${item.name} (${Number(item.quantity)||0} saved → ${effectiveQuantity(item,draftAdjustments)} draft)`
 }).join('\n')
 const copyDraft=()=>{
  if(!summary)return
  const text=`Campaign ${vm.revision} inventory proposals (NOT SAVED):\n${summary}\nNo purchases, ammo expenditure, cyberware surgery, or Humanity Loss recorded.`
  navigator.clipboard?.writeText?.(text).catch(()=>{})
 }
 return <div className="content-grid">
  <section className="panel span-12 gear-browser">
   <div className="gear-browser-heading"><div><span className="micro-label">INVENTORY / VERIFIED SAVE R{vm.revision}</span><h2>{initialCategory==='Cyberware'?'Augmentations & gear':'Inventory'}</h2><p>Source-aware descriptions · saved equipment and property</p></div><span className="tag">{allItems.length} entries</span></div>
   <nav className="gear-tab-strip" aria-label="Inventory categories">
    {GEAR_TABS.map(name=><button key={name} type="button" ref={el=>tabRefs.current[name]=el} className={category===name?'active':''} aria-current={category===name?'page':undefined} onClick={()=>selectCategory(name)}>{name}<small>{counts[name]}</small></button>)}
   </nav>
   <div className="inventory-draft-note"><Zap size={15}/><span>Quantity buttons stage proposals in this browser only. They do not acquire, consume, install, or remove actual items.</span></div>
   {shown.length?<div className="gear-card-list">
    {shown.map(item=>{
      const reference=describeItem(item),isCompany=companyItem(item,vm.background.id)
      const count=effectiveQuantity(item,draftAdjustments),base=Number(item.quantity)||0
      const delta=count-base,isOpen=expanded[item.id]===true
      const Icon=category==='Cyberware'?Cpu:category==='Armor'?Shield:Package
      return <article key={item.id} className="gear-entry">
       <div className="gear-entry-main"><div className="gear-entry-icon"><Icon size={21}/></div>
        <div className="gear-entry-body"><div className="gear-entry-title"><strong>{item.name}</strong>{isCompany&&<span className="property-tag">COMPANY PROPERTY</span>}</div>
         <p className="gear-description">{reference.description}</p>{reference.rules&&<p className="gear-rule-line">{reference.rules}</p>}
         {item.notes&&<p className="gear-saved-note">Saved note: {item.notes}</p>}
         <div className="gear-reference-line">{reference.page&&reference.source?<a href={reference.source} rel="noopener noreferrer" target="_blank">Cyberpunk RED Core · p.{reference.page}</a>:<span>Saved campaign record</span>}
          {typeof item.unit_cost_eb==='number'&&item.unit_cost_eb>0&&<span>{item.unit_cost_eb.toLocaleString()} eb / unit at acquisition</span>}
         </div>
        </div>
        <div className="gear-quantity" aria-label={`${item.name} quantity controls`}>
         {isCompany?<><strong>×{base}</strong><small>issued</small></>:<>
          <div className="gear-quantity-buttons"><button type="button" onClick={()=>updateQuantity(item,-1)} disabled={count<=0} aria-label={`Stage removal of one ${item.name}`}><Minus size={17}/></button><output aria-live="polite" className={delta!==0?'changed':''}>×{count}</output><button type="button" disabled={count>=9999} onClick={()=>updateQuantity(item,1)} aria-label={`Stage addition of one ${item.name}`}><Plus size={17}/></button></div>
          <small>{delta===0?`saved ×${base}`:`${delta>0?'+':''}${delta} draft`}</small>
         </>}
        </div>
       </div>
       <button type="button" className="gear-detail-toggle" aria-expanded={isOpen} onClick={()=>setExpanded(prev=>({...prev,[item.id]:!isOpen}))}>Saved ownership & custody <ChevronDown size={14}/></button>
       {isOpen&&<dl className="gear-entry-details"><div><dt>Owner</dt><dd>{isCompany?(vm.employer||'Other owner'):vm.name}</dd></div><div><dt>Custody</dt><dd>{item.custody_or_location||'Not established'}</dd></div><div><dt>Condition</dt><dd>{item.condition||'Not established'}</dd></div><div><dt>Saved quantity</dt><dd>{base}</dd></div></dl>}
      </article>
    })}
   </div>:<div className="gear-empty-category"><Package size={27}/><strong>No {category.toLowerCase()} recorded</strong><p>No items in this category are established in this character’s saved equipment. Empty does not mean an item is impossible to acquire later.</p></div>}
   {category==='Ammo'&&<p className="gear-bottom-note">Magazine allocation is not established. Changing the draft count does not fire, reload, or spend ammunition.</p>}
   {category==='Cyberware'&&<p className="gear-bottom-note">Implanted options are distinct from external Smart Glasses. Draft changes never alter Humanity, EMP, option slots, or installed status.</p>}
   {staged.length>0&&<div className="gear-draft-footer"><div><strong>{staged.length} proposed change{staged.length===1?'':'s'}</strong><p>No campaign save was altered. Share this draft with the GM for approval and resolution.</p></div><div className="gear-draft-actions"><button type="button" onClick={copyDraft}><ClipboardCopy size={15}/> Copy</button><button type="button" onClick={()=>onDraftChange({})}><RotateCcw size={15}/> Reset</button></div></div>}
  </section>
 </div>
}
export function Cyberware({vm,draftAdjustments,onDraftChange}){
 return <Inventory vm={vm} initialCategory="Cyberware" draftAdjustments={draftAdjustments} onDraftChange={onDraftChange}/>
}
