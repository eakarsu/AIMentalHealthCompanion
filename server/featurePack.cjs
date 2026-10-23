'use strict';
// FP wave 39A: authenticated tasks + search/filter + export + domain AI over own tasks.
// Storage is in-process (no DB migration). Provider is called only when a key is set;
// without a key every AI result is a labelled deterministic fallback (aiGenerated:false).
const DISCLAIMER = "Wellness and operational support only; not a diagnosis, treatment, or crisis service. If you may act on urges to harm yourself, contact local emergency services or a crisis line immediately.";
const FEATURE_DEFS = [{"id": "wellness-task-plan", "label": "Wellness task plan"}, {"id": "routine-workload-summary", "label": "Routine workload summary"}, {"id": "self-care-checklist", "label": "Self-care checklist (non-diagnostic)"}];
function hasProviderKey(env=process.env){ return Boolean(env.OPENROUTER_API_KEY||env.OPENAI_API_KEY); }
function createTaskStore(){ return new Map(); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function userKey(u){ const id=u&& (u.id??u.userId??u.sub); return String(id??'anonymous'); }
function normalize(input={}, existing={}){
  const title = input.title!==undefined? String(input.title).trim() : (existing.title||'');
  return {
    id: existing.id||uid(),
    title,
    description: input.description!==undefined? String(input.description) : (existing.description||''),
    notes: input.notes!==undefined? String(input.notes) : (existing.notes||''),
    status: ['todo','in_progress','done'].includes(input.status)? input.status : (existing.status||'todo'),
    priority: ['low','normal','high'].includes(input.priority)? input.priority : (existing.priority||'normal'),
    category: input.category!==undefined? String(input.category) : (existing.category||''),
    dueDate: input.dueDate!==undefined? String(input.dueDate) : (existing.dueDate||''),
    completed: input.completed!==undefined? Boolean(input.completed) : (input.status? input.status==='done' : Boolean(existing.completed)),
    count: Number.isFinite(Number(input.count))&&input.count!==undefined&&input.count!==''? Number(input.count) : (existing.count||0),
    createdAt: existing.createdAt||new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
function createTask(store, userId, input){
  if(!input||!String(input.title||'').trim()) throw Object.assign(new Error('title is required'),{status:400});
  const t=normalize(input); if(!store.has(String(userId))) store.set(String(userId),new Map());
  store.get(String(userId)).set(t.id,t); return t;
}
function listTasks(store, userId, filters={}){
  const rows=[...((store.get(String(userId))||new Map()).values())];
  const q=String(filters.q||filters.search||'').toLowerCase();
  return rows.filter(t=>{
    if(q && !(`${t.title} ${t.description} ${t.category} ${t.notes}`.toLowerCase().includes(q))) return false;
    if(filters.status && t.status!==filters.status) return false;
    if(filters.priority && t.priority!==filters.priority) return false;
    if(filters.category && t.category!==filters.category) return false;
    return true;
  });
}
function updateTask(store, userId, id, patch){
  const m=store.get(String(userId)); if(!m||!m.has(id)) return null;
  const merged={...m.get(id),...patch, title: patch.title!==undefined?patch.title:m.get(id).title};
  if(patch.status!==undefined && patch.completed===undefined) delete merged.completed;
  const updated=normalize(merged, m.get(id));
  if(!updated.title) throw Object.assign(new Error('title is required'),{status:400});
  m.set(id,updated); return updated;
}
function csvEscape(v){ const s=v===null||v===undefined?'':String(v); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }
function toCsv(tasks){
  const cols=['id','title','description','notes','status','priority','category','dueDate','completed','count','createdAt','updatedAt'];
  return [cols.join(','), ...tasks.map(t=>cols.map(c=>csvEscape(t[c])).join(','))].join('\n');
}
function exportTasks(tasks, format='json'){
  if(String(format).toLowerCase()==='csv') return {contentType:'text/csv', body:toCsv(tasks)};
  return {contentType:'application/json', body:JSON.stringify(tasks,null,2)};
}
function envelope(feature, sections, env=process.env){
  return { feature, aiGenerated:false, mode:'deterministic-fallback', provider:hasProviderKey(env)?'configured-not-used-for-fallback':'none', disclaimer:DISCLAIMER, sections };
}
function aiFeature(featureId, tasks, env=process.env){
  const open=tasks.filter(t=>t.status!=='done'), high=open.filter(t=>t.priority==='high'), done=tasks.filter(t=>t.status==='done');
  const byCategory={}; tasks.forEach(t=>{byCategory[t.category||'']=(byCategory[t.category||'']||0)+1;});
  if(featureId===FEATURE_DEFS[0].id) return envelope(featureId,[
    {label:'Open tasks', value:open.length},{label:'High-priority open tasks', value:high.length},
    {label:'Completed tasks', value:done.length},{label:'Next actions', items:open.slice(0,5).map(t=>t.title)},
    {label:'Notes', value:open[0]?.notes||''},{label:'Has open tasks', value:open.length>0}],env);
  if(featureId===FEATURE_DEFS[1].id) return envelope(featureId,[
    {label:'Total tasks', value:tasks.length},{label:'Tasks by category', value:byCategory},
    {label:'Open tasks', value:open.length},{label:'Empty result', value:tasks.length===0}],env);
  return envelope(FEATURE_DEFS[2].id,[
    {label:'Checklist', items:open.length?open.map(t=>`Review: ${t.title}`):[]},
    {label:'Open tasks', value:open.length},{label:'Completed tasks', value:done.length},
    {label:'Disclaimer', value:DISCLAIMER}],env);
}
async function runAiFeature(featureId, tasks, env=process.env, fetchImpl=globalThis.fetch){
  if(!FEATURE_DEFS.some(f=>f.id===featureId)) return null;
  if(!hasProviderKey(env)||typeof fetchImpl!=='function') return aiFeature(featureId,tasks,env);
  try{
    const key=env.OPENROUTER_API_KEY||env.OPENAI_API_KEY;
    const url=env.OPENROUTER_API_KEY?'https://openrouter.ai/api/v1/chat/completions':'https://api.openai.com/v1/chat/completions';
    const ctrl=new AbortController(); const timer=setTimeout(()=>ctrl.abort(),5000);
    const r=await fetchImpl(url,{method:'POST',signal:ctrl.signal,headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:env.AI_MODEL||'openai/gpt-4o-mini',messages:[{role:'user',content:`Summarise these own tasks operationally, no diagnosis: ${JSON.stringify(tasks).slice(0,3000)}`}]})});
    clearTimeout(timer); if(!r.ok) throw new Error('provider error');
    const data=await r.json(); const text=data.choices?.[0]?.message?.content||'';
    if(!text) throw new Error('empty provider response');
    return {feature:featureId, aiGenerated:true, mode:'provider', provider:'configured', disclaimer:DISCLAIMER, sections:[{label:'Provider summary', value:text},{label:'Open tasks', value:tasks.filter(t=>t.status!=='done').length}]};
  }catch{ return aiFeature(featureId,tasks,env); }
}
function createTasksRouter({auth, store=createTaskStore()}={}){
  const express=require('express'); const router=express.Router();
  if(!auth) throw new Error('auth middleware required');
  router.get('/ai/features', auth, (req,res)=>res.json({features:FEATURE_DEFS, aiGenerated:false, disclaimer:DISCLAIMER}));
  router.get('/export', auth, (req,res)=>{ const out=exportTasks(listTasks(store,userKey(req.user),req.query), req.query.format||'json'); res.type(out.contentType).send(out.body); });
  router.get('/', auth, (req,res)=>res.json({tasks:listTasks(store,userKey(req.user),req.query), total:listTasks(store,userKey(req.user),req.query).length}));
  router.post('/', auth, (req,res)=>{ try{ res.status(201).json(createTask(store,userKey(req.user),req.body||{})); }catch(e){ res.status(e.status||400).json({error:e.message}); }});
  router.put('/:id', auth, (req,res)=>{ try{ const t=updateTask(store,userKey(req.user),req.params.id,req.body||{}); if(!t) return res.status(404).json({error:'Task not found'}); res.json(t);}catch(e){res.status(e.status||400).json({error:e.message});}});
  router.patch('/:id', auth, (req,res)=>{ try{ const t=updateTask(store,userKey(req.user),req.params.id,req.body||{}); if(!t) return res.status(404).json({error:'Task not found'}); res.json(t);}catch(e){res.status(e.status||400).json({error:e.message});}});
  router.post('/ai/:feature', auth, async (req,res)=>{ const out=await runAiFeature(req.params.feature, listTasks(store,userKey(req.user),{})); if(!out) return res.status(404).json({error:'Unknown AI feature'}); res.json(out); });
  return router;
}
module.exports={DISCLAIMER,FEATURE_DEFS,hasProviderKey,createTaskStore,createTask,listTasks,updateTask,toCsv,exportTasks,aiFeature,runAiFeature,createTasksRouter,userKey};
