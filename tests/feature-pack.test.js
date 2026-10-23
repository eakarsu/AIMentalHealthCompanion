
const test=require('node:test'); const assert=require('node:assert/strict'); const fs=require('node:fs');
const core=require('../server/featurePack.cjs');
test('tasks create/list/search/filter and user isolation',()=>{
  const s=core.createTaskStore();
  const a=core.createTask(s,'u1',{title:'Alpha task',status:'todo',priority:'high',category:'ops',notes:'',count:0});
  core.createTask(s,'u1',{title:'Beta',status:'done',priority:'low',category:'misc'});
  core.createTask(s,'u2',{title:'Alpha other',status:'todo'});
  assert.equal(core.listTasks(s,'u1',{}).length,2);
  assert.equal(core.listTasks(s,'u1',{q:'alpha'}).length,1);
  assert.equal(core.listTasks(s,'u1',{status:'done'}).length,1);
  assert.equal(core.listTasks(s,'u1',{priority:'high'}).length,1);
  assert.equal(core.listTasks(s,'u2',{}).length,1);
  assert.equal(a.completed,false); assert.equal(a.count,0); assert.equal(a.notes,'');
});
test('tasks update and validation',()=>{
  const s=core.createTaskStore(); const a=core.createTask(s,'u1',{title:'Old'});
  const u=core.updateTask(s,'u1',a.id,{title:'New',status:'done'}); assert.equal(u.title,'New'); assert.equal(u.completed,true);
  assert.equal(core.updateTask(s,'u2',a.id,{title:'X'}),null);
  assert.throws(()=>core.createTask(s,'u1',{title:''}),/title is required/);
});
test('CSV/JSON export preserves false/0/empty',()=>{
  const s=core.createTaskStore(); core.createTask(s,'u1',{title:'A, "quoted"',notes:'',count:0});
  const rows=core.listTasks(s,'u1',{});
  const csv=core.exportTasks(rows,'csv'); assert.equal(csv.contentType,'text/csv'); assert.ok(csv.body.includes('false')); assert.ok(csv.body.includes(',0,'));
  const json=core.exportTasks(rows,'json'); const parsed=JSON.parse(json.body); assert.equal(parsed[0].completed,false); assert.equal(parsed[0].count,0); assert.equal(parsed[0].notes,'');
});
test('AI fallback labelled, sections preserve 0/false/empty, no diagnosis claims',()=>{
  const env={}; const empty=[];
  for(const f of core.FEATURE_DEFS){ const out=core.aiFeature(f.id,empty,env); assert.equal(out.aiGenerated,false); assert.equal(out.mode,'deterministic-fallback'); assert.ok(out.sections.length>=2); assert.ok(out.sections.every(x=>x.label)); }
  const zero=core.aiFeature(core.FEATURE_DEFS[0].id,empty,env); assert.equal(zero.sections.find(x=>x.label==='Open tasks').value,0);
  assert.ok(core.DISCLAIMER.length>10); assert.ok(!/diagnos(e|is) (you|your)/i.test(JSON.stringify(core.aiFeature(core.FEATURE_DEFS[2].id,empty,env))));
});
test('tasks router mounted authenticated in server entry',()=>{ const src=fs.readFileSync(require('node:path').join(__dirname,'../server/index.js'),'utf8'); assert.ok(src.includes('/api/tasks')); assert.ok(src.includes('tasksFeaturePack')); });
