const $=s=>document.querySelector(s),DAY=864e5,SLA=3;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ago=d=>new Date(Date.now()-d*DAY).toISOString();
const fmt=d=>new Date(d).toLocaleDateString('en-ZA',{day:'numeric',month:'short'});
const fmtT=d=>new Date(d).toLocaleString('en-ZA',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const rel=d=>{const n=Math.floor((Date.now()-new Date(d))/DAY);return n<1?'today':n+'d ago'};
const ST=['Open','Assigned','In Progress','Waiting for Candidate','Resolved','Closed','Reopened'],PR=['Low','Medium','High','Urgent'];
const LOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>';

/* ---------- sample data (fictional) ---------- */
const db={users:[
 {id:1,name:'Amina Khan',email:'amina@demo.test',pass:'demo1234',role:'candidate',active:true},
 {id:2,name:'Sipho Mokoena',email:'sipho@demo.test',pass:'demo1234',role:'candidate',active:true},
 {id:3,name:'Thandi Naidoo',email:'thandi@demo.test',pass:'demo1234',role:'support',active:true},
 {id:4,name:'Lerato Dlamini',email:'lerato@demo.test',pass:'demo1234',role:'support',active:true},
 {id:5,name:'Nomsa Peters',email:'nomsa@demo.test',pass:'demo1234',role:'admin',active:true}],
 categories:['Technical support','Learning platform access','Connectivity','Attendance','Course content','Assessments','Career support','Administration','Well-being referral','General enquiry'].map(name=>({name,on:true})),requests:[]};
let session=null,tok=0,tt,curPage='',F;
const DEF=()=>({q:'',status:'All',pri:'All',cat:'All',asg:'All',sort:'new',person:'All',range:'all'});F=DEF();
const U=id=>db.users.find(u=>u.id===id),nm=id=>id?U(id).name:'Unassigned',me=()=>U(session),req=id=>db.requests.find(r=>r.id===id);
const log=(r,text,type,by,age=0)=>r.history.push({at:ago(age),by,text,type});
const seed=(n,uid,subject,category,desc,priority,status,assignee,age,res)=>{
 const r={id:'REQ-'+String(n).padStart(4,'0'),uid,subject,category,desc,priority,status,assignee,created:ago(age),resolution:res||'',history:[]};
 log(r,'Request submitted.','status',uid,age);
 if(assignee)log(r,'Assigned to '+nm(assignee)+'.','status',assignee,age-.1);
 if(!['Open','Assigned'].includes(status))log(r,'Status changed to '+status+'.','status',assignee||uid,age/2);
 if(res)r.resolvedAt=ago(age/2);db.requests.push(r);return r};
const r1=seed(1,1,'Cannot log in to learning platform','Learning platform access','I get an error every time I try to log in since Monday.','High','Waiting for Candidate',3,2);
log(r1,'Please send a screenshot of the error message.','public',3,1.5);log(r1,'Looks like a password reset loop. Check SSO next.','internal',3,1.4);
seed(2,1,'Missing quiz 1 result','Assessments','My quiz 1 result is not showing on the platform.','Medium','Resolved',4,6,'The result was captured late and has now been added.');
seed(3,2,'No data for online sessions','Connectivity','I cannot attend online sessions because I have no data.','Urgent','Open',null,5);
seed(4,2,'Marked absent in error','Attendance','I was marked absent on Tuesday but I attended the whole day.','Medium','In Progress',4,4);
seed(5,1,'Need a CV review','Career support','Could someone review my CV before I apply?','Low','Assigned',3,1);
seed(6,2,'Update my surname','Administration','My surname changed and I need my records updated.','Low','Closed',3,9,'Records updated.');
seed(7,2,'Week 3 slides will not open','Course content','The file is corrupted when I download it.','Medium','Reopened',4,3);
seed(8,1,'Laptop keeps freezing','Technical support','My laptop freezes whenever I open VS Code.','Medium','Open',null,.5);

/* ---------- helpers ---------- */
const slug=s=>s.toLowerCase().replace(/ /g,'-');
const badge=s=>`<span class="badge s-${slug(s)}">${s}</span>`,prio=p=>`<span class="prio p-${p.toLowerCase()}">${p}</span>`;
const done=r=>['Resolved','Closed'].includes(r.status),due=r=>new Date(new Date(r.created).getTime()+SLA*DAY),overdue=r=>!done(r)&&due(r)<Date.now();
const byNew=(a,b)=>a.created<b.created?1:-1,upd=r=>r.history.filter(h=>h.type!=='internal').reduce((m,h)=>h.at>m?h.at:m,'');
const opts=(a,sel)=>a.map(x=>`<option${x===sel?' selected':''}>${esc(x)}</option>`).join('');
const field=(l,n,t='text',v='')=>`<div class="field"><label for="${n}">${l}</label><input id="${n}" name="${n}" type="${t}" value="${esc(v)}"><small class="err" role="alert"></small></div>`;
const area=(l,n)=>`<div class="field"><label for="${n}">${l}</label><textarea id="${n}" name="${n}"></textarea><small class="err" role="alert"></small></div>`;
const head=(t,s='',x='')=>`<div class="head"><div><h1>${t}</h1>${s?`<p class="sup">${s}</p>`:''}</div>${x}</div>`;
const stats=a=>'<div class="stats">'+a.map(([l,n,at])=>`<div class="stat${at?' stat--attn':''}"><b>${n}</b><span>${l}</span></div>`).join('')+'</div>';
const count=(a,f)=>a.reduce((o,x)=>(o[f(x)]=(o[f(x)]||0)+1,o),{});
const bars=o=>{const m=Math.max(1,...Object.values(o));return Object.entries(o).map(([k,v])=>`<div class="bar"><span>${esc(k)}</span><i style="--w:${v/m*100}%"></i><b>${v}</b></div>`).join('')||'<p class="sup">No data.</p>'};
const staffList=()=>db.users.filter(x=>x.role==='support'&&x.active);
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),5000)};
const go=h=>location.hash===h?render():(location.hash=h);
function ask(t,m,ok,yes,danger,no){const d=$('#dlg'),y=$('#dyes');$('#dt').textContent=t;$('#dm').textContent=m;y.textContent=ok;y.className='btn'+(danger?' btn--danger':'');d.showModal();$('#dno').focus();
 y.onclick=()=>{d.close();yes()};$('#dno').onclick=()=>{d.close();no&&no()};d.oncancel=()=>{no&&no()}}
function check(f,rules){let ok=true;f.querySelectorAll('.err').forEach(s=>s.textContent='');f.querySelectorAll('[aria-invalid]').forEach(i=>i.removeAttribute('aria-invalid'));
 for(const[n,pass,msg]of rules)if(!pass){const i=f.elements[n];i.setAttribute('aria-invalid','true');i.closest('.field').querySelector('.err').textContent=msg;if(ok)i.focus();ok=false}return ok}
const scope=p=>{const u=me(),rs=db.requests.slice();return u.role==='candidate'?rs.filter(r=>r.uid===session):p==='mine'?rs.filter(r=>r.assignee===session):rs};

/* ---------- tables ---------- */
function table(rs,full){
 const staff=me().role!=='candidate';
 if(!rs.length)return `<div class="card empty"><p>No requests yet.</p>${staff?'':'<a class="btn" href="#/new">Submit your first request</a>'}</div>`;
 const rows=rs.map(r=>{const a=full?`<select data-asg="${r.id}" aria-label="Assign ${r.id}"><option value="">Unassigned</option>${staffList().map(x=>`<option value="${x.id}"${x.id===r.assignee?' selected':''}>${esc(x.name)}</option>`).join('')}</select>`:esc(nm(r.assignee));
  return `<tr><td data-l="Ref"><a href="#/request/${r.id}">${r.id}</a></td><td data-l="Subject">${esc(r.subject)}</td>`+
  (staff?`<td data-l="Candidate">${esc(nm(r.uid))}</td><td data-l="Status">${badge(r.status)}</td><td data-l="Priority">${prio(r.priority)}</td><td data-l="Assigned to">${a}</td><td data-l="Due" class="${overdue(r)?'late':''}">${done(r)?'–':fmt(due(r))+(overdue(r)?' · overdue':'')}</td>`
  :`<td data-l="Status">${badge(r.status)}</td><td data-l="Updated">${rel(upd(r))}</td>`)+'</tr>'}).join('');
 return `<div class="card flush"><table class="stack"><thead><tr><th scope="col">Ref</th><th scope="col">Subject</th>${staff?'<th scope="col">Candidate</th><th scope="col">Status</th><th scope="col">Priority</th><th scope="col">Assigned to</th><th scope="col">Due</th>':'<th scope="col">Status</th><th scope="col">Updated</th>'}</tr></thead><tbody>${rows}</tbody></table></div>`}

function listHTML(){
 const q=F.q.toLowerCase(),all=scope(curPage);
 let rs=all.filter(r=>(F.status==='All'||r.status===F.status)&&(F.pri==='All'||r.priority===F.pri)&&(F.cat==='All'||r.category===F.cat)&&(F.asg==='All'||(F.asg==='Unassigned'?!r.assignee:String(r.assignee)===F.asg))&&(!q||(r.id+' '+r.subject+' '+nm(r.uid)).toLowerCase().includes(q)));
 const S={new:byNew,old:(a,b)=>byNew(b,a),pri:(a,b)=>PR.indexOf(b.priority)-PR.indexOf(a.priority),due:(a,b)=>due(a)-due(b)};rs.sort(S[F.sort]);
 if(!rs.length&&all.length)return `<div class="card empty"><p>No requests match your filters.</p><button class="btn btn--outline" data-act="reset">Clear filters</button></div>`;
 return table(rs,curPage==='requests'&&me().role==='admin')}

/* ---------- views ---------- */
function vDashboard(){
 const u=me(),rs=scope('dashboard'),first=u.name.split(' ')[0];
 if(u.role==='candidate'){const w=rs.filter(r=>r.status==='Waiting for Candidate');
  return head('Dashboard',`Hi ${esc(first)}. Here’s where your requests stand.`,'<a class="btn" href="#/new">Submit request</a>')+
  (w.length?`<div class="alert alert--warning" role="status"><b>${w.length===1?'1 request needs':w.length+' requests need'} your reply.</b> <a href="#/request/${w[0].id}">Reply now</a></div>`:'')+
  stats([['Open',rs.filter(r=>!done(r)).length],['Waiting for your reply',w.length],['Resolved',rs.filter(done).length]])+
  `<section class="blk"><h2>Recent requests</h2>${table(rs.sort(byNew).slice(0,5))}</section>`}
 const open=rs.filter(r=>!done(r)),late=rs.filter(overdue).length;
 if(u.role==='support'){
  const need=open.filter(r=>overdue(r)||r.priority==='Urgent'||!r.assignee).sort((a,b)=>PR.indexOf(b.priority)-PR.indexOf(a.priority)).slice(0,5);
  return head('Overview','Your work today.')+stats([['Unassigned',open.filter(r=>!r.assignee).length],['Assigned to me',open.filter(r=>r.assignee===session).length],['Overdue',late,1],['Waiting for candidate',rs.filter(r=>r.status==='Waiting for Candidate').length]])+
  `<section class="blk"><div class="head" style="margin-bottom:12px"><h2 style="margin:0">Needs attention</h2><a href="#/requests">View queue</a></div>${table(need)}</section>`}
 const fin=rs.filter(r=>r.resolvedAt&&done(r)),avg=fin.length?(fin.reduce((s,r)=>s+(new Date(r.resolvedAt)-new Date(r.created))/DAY,0)/fin.length).toFixed(1)+' days':'–';
 const ev=events().slice(0,5),w=count(open,r=>nm(r.assignee));
 const work=staffList().map(s=>`<tr><td data-l="Support member">${esc(s.name)}</td><td data-l="Open">${open.filter(r=>r.assignee===s.id).length}</td><td data-l="Overdue">${rs.filter(r=>overdue(r)&&r.assignee===s.id).length}</td></tr>`).join('')+`<tr><td data-l="Support member">Unassigned</td><td data-l="Open">${w.Unassigned||0}</td><td data-l="Overdue">${rs.filter(r=>overdue(r)&&!r.assignee).length}</td></tr>`;
 return head('Overview','How the support system is doing.')+stats([['Unresolved',open.length],['Unassigned',open.filter(r=>!r.assignee).length],['Overdue',late,1],['Avg. resolution',avg]])+
 `<div class="two"><section class="card flush"><h2 style="padding:16px 16px 0">Workload</h2><table class="stack"><thead><tr><th scope="col">Support member</th><th scope="col">Open</th><th scope="col">Overdue</th></tr></thead><tbody>${work}</tbody></table></section>
 <section class="card"><h2>Requests by category</h2>${bars(Object.fromEntries(Object.entries(count(rs,r=>r.category)).sort((a,b)=>b[1]-a[1]).slice(0,5)))}</section></div>
 <section class="card"><div class="head" style="margin-bottom:0"><h2>Latest activity</h2><a href="#/logs">View all</a></div><ul class="plain">${ev.map(e=>`<li>${esc(nm(e.by))} · ${esc(e.act)} on <a href="#/request/${e.id}">${e.id}</a> <span class="sup">· ${rel(e.at)}</span></li>`).join('')}</ul></section>`}

function vList(){
 const u=me(),c=u.role==='candidate',T=c?['My Requests','Everything you’ve submitted.']:curPage==='mine'?['Assigned to Me','Requests you’re responsible for.']:u.role==='admin'?['All Requests','Every request in the system.']:['Request Queue','All incoming requests.'];
 const f=c?`<div class="filters cand"><input type="search" data-f="q" value="${esc(F.q)}" placeholder="Search by reference or subject" aria-label="Search requests"><select data-f="status" aria-label="Status">${opts(['All',...ST],F.status)}</select></div>`:
 `<div class="filters"><input type="search" data-f="q" value="${esc(F.q)}" placeholder="Search reference, subject or name" aria-label="Search requests"><select data-f="status" aria-label="Status">${opts(['All',...ST],F.status)}</select><select data-f="pri" aria-label="Priority">${opts(['All',...PR],F.pri)}</select><select data-f="cat" aria-label="Category">${opts(['All',...db.categories.map(x=>x.name)],F.cat)}</select>
 ${curPage==='mine'?'':`<select data-f="asg" aria-label="Assigned to"><option>All</option><option${F.asg==='Unassigned'?' selected':''}>Unassigned</option>${staffList().map(s=>`<option value="${s.id}"${String(s.id)===F.asg?' selected':''}>${esc(s.name)}</option>`).join('')}</select>`}
 <select data-f="sort" aria-label="Sort by"><option value="new"${F.sort==='new'?' selected':''}>Newest first</option><option value="old"${F.sort==='old'?' selected':''}>Oldest first</option><option value="pri"${F.sort==='pri'?' selected':''}>Highest priority</option><option value="due"${F.sort==='due'?' selected':''}>Due soonest</option></select></div>`;
 return head(T[0],T[1],c?'<a class="btn" href="#/new">Submit request</a>':'')+f+`<div id="list">${listHTML()}</div>`}

function vNew(){
 const cats=db.categories.filter(c=>c.on).map(c=>c.name);
 if(!cats.length)return head('Submit request')+'<div class="card empty">Requests are unavailable right now. Please try again later.</div>';
 return head('Submit request','Tell us what’s wrong and we’ll get back to you.')+`<form class="card" style="max-width:640px" data-form="newreq" novalidate><div class="field"><label for="category">Category</label><select id="category" name="category">${opts(cats)}</select><small class="err"></small></div>${field('Subject (required)','subject')}${area('Describe the problem (required)','description')}<button class="btn" type="submit">Submit request</button> <a class="btn btn--outline" href="#/dashboard">Cancel</a></form>`}

const LINE={Open:'We’ve received your request and will assign it soon.',Assigned:r=>nm(r.assignee)+' is looking after your request.','In Progress':'We’re working on it.','Waiting for Candidate':'We’re waiting for your reply.',Resolved:'We’ve provided a solution. If it didn’t help, you can reopen it.',Closed:'This request is closed.',Reopened:'You asked for more help. We’ll be in touch.'};
function vDetail(id){
 const r=req(id),u=me(),staff=u.role!=='candidate';
 if(!r||(!staff&&r.uid!==session))return denied();
 const th='<ol class="thread">'+r.history.filter(h=>staff||h.type!=='internal').sort((a,b)=>a.at<b.at?-1:1).map(h=>h.type==='status'?`<li class="thread__item thread__item--system">${esc(h.text)} · ${fmt(h.at)}</li>`:
  `<li class="thread__item${h.type==='internal'?' thread__item--internal':''}"><b>${esc(nm(h.by))}</b>${h.type==='internal'?`<span class="tag">${LOCK} Internal note</span>`:''}<span class="when">${fmt(h.at)}</span><p>${esc(h.text)}</p></li>`).join('')+'</ol>';
 const res=done(r)&&r.resolution?`<div class="resolution"><b>Resolution</b><p>${esc(r.resolution)}</p></div>`:'';
 if(!staff){const l=LINE[r.status];
  return head(`${esc(r.subject)}`,r.id+' · '+esc(r.category)+' · Submitted '+fmt(r.created))+`<div class="status-line">${badge(r.status)}<span>${typeof l==='function'?l(r):l}</span></div><p class="desc">${esc(r.desc)}</p>${res}<h2>Conversation</h2>${th}
  <form class="composer" data-form="reply" data-id="${r.id}" novalidate>${area(done(r)?'Not solved? Tell us what still needs help':'Reply','message')}<button class="btn" name="mode" value="${done(r)?'reopen':'reply'}" type="submit">${done(r)?'Reopen request':'Send reply'}</button></form>`}
 return head(esc(r.subject),r.id+' · '+esc(r.category)+' · '+esc(nm(r.uid)))+`<div class="cols"><div><div class="status-line">${badge(r.status)}${prio(r.priority)}</div><p class="desc">${esc(r.desc)}</p>${res}<h2>Conversation</h2>${th}
 <form class="composer" data-form="compose" data-id="${r.id}" data-mode="public" novalidate><div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-act="tab" data-m="public">Public reply</button><button type="button" role="tab" aria-selected="false" data-act="tab" data-m="internal">Internal note</button></div>
 <p class="hint">${LOCK} Internal note. Not visible to the candidate.</p>${area('Message','message')}<button class="btn" type="submit" id="sendbtn">Send reply</button></form></div>
 <form class="card" data-form="update" data-id="${r.id}" novalidate><h2>Details</h2>
 <div class="field"><label for="assignee">Assigned to</label><select id="assignee" name="assignee"><option value="">Unassigned</option>${db.users.filter(x=>x.role==='support'&&x.active||x.id===r.assignee).map(x=>`<option value="${x.id}"${x.id===r.assignee?' selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
 <div class="field"><label for="priority">Priority</label><select id="priority" name="priority">${opts(PR,r.priority)}</select></div>
 <div class="field"><label for="status">Status</label><select id="status" name="status">${opts(ST,r.status)}</select></div>
 <div class="field"><label for="resolution">Resolution</label><input id="resolution" name="resolution" value="${esc(r.resolution)}" placeholder="Needed to mark as Resolved"><small class="err" role="alert"></small></div>
 <p class="sup" style="margin-bottom:16px">Due ${fmt(due(r))}${overdue(r)?' <b class="late">· overdue</b>':''}</p><button class="btn" type="submit">Save changes</button></form></div>`}

function vUsers(){
 return head('User Management','Change roles or deactivate accounts.')+`<div class="card flush"><table class="stack"><thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col"></th></tr></thead><tbody>`+
 db.users.map(u=>{const s=u.id===session;return `<tr><td data-l="Name">${esc(u.name)}</td><td data-l="Email">${esc(u.email)}</td><td data-l="Role"><select class="cap" data-role="${u.id}" aria-label="Role for ${esc(u.name)}"${s?' disabled':''}>${opts(['candidate','support','admin'],u.role)}</select></td><td data-l="Status">${u.active?'Active':'Deactivated'}</td><td>${s?'':`<button class="btn btn--outline btn--sm" data-act="toggleuser" data-id="${u.id}">${u.active?'Deactivate':'Activate'}</button>`}</td></tr>`}).join('')+'</tbody></table></div>'}
function vCategories(){
 const n=count(db.requests,r=>r.category);
 return head('Category Management','Categories candidates can choose when submitting a request.')+`<form class="card inline" data-form="addcat" novalidate>${field('New category','cat')}<button class="btn" type="submit" style="margin-bottom:${'0'}">Add category</button></form><div class="card flush"><table class="stack"><thead><tr><th scope="col">Category</th><th scope="col">Requests</th><th scope="col">Status</th><th scope="col"></th></tr></thead><tbody>`+
 db.categories.map((c,i)=>`<tr><td data-l="Category">${esc(c.name)}</td><td data-l="Requests">${n[c.name]||0}</td><td data-l="Status">${c.on?'Enabled':'Disabled'}</td><td><button class="btn btn--outline btn--sm" data-act="togglecat" data-i="${i}">${c.on?'Disable':'Enable'}</button></td></tr>`).join('')+'</tbody></table></div>'}
const events=()=>db.requests.flatMap(r=>r.history.map(h=>({...h,id:r.id,act:h.type==='status'?h.text.replace(/\.$/,''):'Added a '+(h.type==='internal'?'internal note':'public reply')}))).sort((a,b)=>b.at<a.at?-1:1);
function vLogs(){
 const ev=events().filter(e=>F.person==='All'||String(e.by)===F.person).slice(0,50);
 return head('Activity Logs','Who did what, most recent first.')+`<div class="filters cand"><select data-f="person" aria-label="Filter by person"><option>All</option>${db.users.map(u=>`<option value="${u.id}"${String(u.id)===F.person?' selected':''}>${esc(u.name)}</option>`).join('')}</select></div>`+
 (ev.length?`<div class="card flush"><table class="stack"><thead><tr><th scope="col">Time</th><th scope="col">Person</th><th scope="col">Action</th><th scope="col">Request</th></tr></thead><tbody>${ev.map(e=>`<tr><td data-l="Time">${fmtT(e.at)}</td><td data-l="Person">${esc(nm(e.by))}</td><td data-l="Action">${esc(e.act)}</td><td data-l="Request"><a href="#/request/${e.id}">${e.id}</a></td></tr>`).join('')}</tbody></table></div>`:'<div class="card empty">No activity for this person.</div>')}

function vLogin(){return `<h1>HelpPoint</h1><p class="sup" style="margin:4px 0 24px">One place for every support request.</p><form class="card" data-form="login" novalidate>${field('Email','email','email')}${field('Password','password','password')}<small class="err form-err" id="formerr" role="alert"></small><button class="btn" type="submit" style="width:100%">Log in</button></form>
 <p>New here? <a href="#/register">Create an account</a></p><p class="sup" style="margin-top:16px">Demo accounts (password demo1234):</p><div class="demo"><button class="btn btn--outline btn--sm" data-act="demo" data-e="amina@demo.test">Candidate</button><button class="btn btn--outline btn--sm" data-act="demo" data-e="thandi@demo.test">Support</button><button class="btn btn--outline btn--sm" data-act="demo" data-e="nomsa@demo.test">Administrator</button></div>`}
function vRegister(){return `<h1>Create your account</h1><p class="sup" style="margin:4px 0 24px">Candidate accounts only. Staff accounts are set up by an administrator.</p><form class="card" data-form="register" novalidate>${field('Full name','name')}${field('Email','email','email')}${field('Password (8 or more characters)','password','password')}${field('Confirm password','confirm','password')}<button class="btn" type="submit" style="width:100%">Register</button></form>
 <p class="sup" style="margin-bottom:12px">Privacy: we store your name, email and requests only to provide support. Data would be kept for 12 months after a case closes, then deleted.</p><p>Already registered? <a href="#/login">Log in</a></p>`}
function vProfile(){const u=me();
 return head('Profile','Update your details and password.')+`<div class="two"><form class="card" data-form="profile" novalidate><h2>Your details</h2>${field('Full name','name','text',u.name)}${field('Email','email','email',u.email)}<div class="field"><span class="lbl">Role</span><p class="cap">${u.role}</p><small class="sup block">Your role is set by an administrator.</small></div><button class="btn" type="submit">Save changes</button></form>
 <form class="card" data-form="password" novalidate><h2>Change password</h2>${field('Current password','current','password')}${field('New password (8 or more characters)','next','password')}${field('Confirm new password','confirm','password')}<button class="btn" type="submit">Update password</button></form></div>`}
function vReports(){
 const days=F.range==='all'?0:+F.range,since=days?Date.now()-days*DAY:0,rs=db.requests.filter(r=>new Date(r.created)>=since);
 const fin=rs.filter(done),avg=a=>{const x=a.filter(r=>r.resolvedAt);return x.length?(x.reduce((s,r)=>s+(new Date(r.resolvedAt)-new Date(r.created))/DAY,0)/x.length).toFixed(1)+' days':'–'};
 const tbl=(hd,rows)=>`<div class="card flush"><table class="stack"><thead><tr>${hd.map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>'<tr>'+r.map((c,i)=>`<td data-l="${hd[i]}">${c}</td>`).join('')+'</tr>').join('')}</tbody></table></div>`;
 const rg=`<select data-f="range" aria-label="Report period" style="width:auto">${[['all','All time'],['30','Last 30 days'],['7','Last 7 days']].map(([v,l])=>`<option value="${v}"${F.range===v?' selected':''}>${l}</option>`).join('')}</select>`;
 const h=head('Summary Reports','Requests created in the selected period.',rg);
 if(!rs.length)return h+'<div class="card empty">No requests in this period.</div>';
 const cn=count(rs,r=>r.category),sc=count(rs,r=>r.status),pc=count(rs,r=>r.priority);
 return h+stats([['Submitted',rs.length],['Resolved or closed',fin.length],['Resolution rate',Math.round(fin.length/rs.length*100)+'%'],['Avg. resolution time',avg(fin)]])+
 `<div class="two"><section class="card"><h2>By status</h2>${bars(Object.fromEntries(ST.map(s=>[s,sc[s]||0])))}</section><section class="card"><h2>By priority</h2>${bars(Object.fromEntries(PR.map(p=>[p,pc[p]||0])))}</section></div>
 <section class="blk"><h2>By category</h2>${tbl(['Category','Total','Resolved','Overdue'],Object.keys(cn).sort((a,b)=>cn[b]-cn[a]).map(c=>{const x=rs.filter(r=>r.category===c);return [esc(c),x.length,x.filter(done).length,x.filter(overdue).length]}))}</section>
 <section class="blk"><h2>Support team</h2>${tbl(['Support member','Assigned','Resolved','Avg. resolution','Overdue'],[...staffList().map(s=>[s.id,esc(s.name)]),[0,'Unassigned']].map(([id,n])=>{const x=rs.filter(r=>(r.assignee||0)===id);return [n,x.length,x.filter(done).length,avg(x.filter(done)),x.filter(overdue).length]}))}</section>`}
const denied=()=>head('Page not available')+'<div class="card empty"><p>This page doesn’t exist or you don’t have permission to view it.</p><a class="btn btn--outline" href="#/dashboard">Go to dashboard</a></div>';

/* ---------- router ---------- */
const ALL=['candidate','support','admin'],STAFF=['support','admin'];
const ROUTES={login:{pub:1,v:vLogin},register:{pub:1,v:vRegister},dashboard:{roles:ALL,v:vDashboard},my:{roles:['candidate'],v:vList},requests:{roles:STAFF,v:vList},mine:{roles:['support'],v:vList},new:{roles:['candidate'],v:vNew},request:{roles:ALL,v:vDetail},users:{roles:['admin'],v:vUsers},categories:{roles:['admin'],v:vCategories},logs:{roles:['admin'],v:vLogs},reports:{roles:['admin'],v:vReports},profile:{roles:ALL,v:vProfile}};
const NAV={candidate:[['dashboard','Dashboard'],['my','My Requests'],['new','Submit Request'],['profile','Profile']],support:[['dashboard','Overview'],['requests','Request Queue'],['mine','Assigned to Me'],['profile','Profile']],admin:[['dashboard','Overview'],['users','User Management'],['categories','Category Management'],['requests','All Requests'],['reports','Summary Reports'],['logs','Activity Logs'],['profile','Profile']]};
function render(){
 const [page,arg]=location.hash.replace(/^#\//,'').split('/'),R=ROUTES[page]||ROUTES.dashboard,app=$('#app'),t=++tok;
 if(!session&&!R.pub)return go('#/login');
 if(session&&R.pub)return go('#/dashboard');
 const key=ROUTES[page]?page:'dashboard';if(key!==curPage){F=DEF()}curPage=key;
 let body;
 if(!session){app.className='auth';app.removeAttribute('data-role');app.innerHTML='<main id="main"></main>'}
 else{const u=me(),back=u.role==='candidate'?['my','My Requests']:u.role==='admin'?['requests','All Requests']:['requests','Request Queue'];
  const cur=key==='request'?back[0]:key,ini=u.name.split(' ').map(w=>w[0]).join('').slice(0,2);
  app.className='';app.dataset.role=u.role;
  app.innerHTML=`<aside class="sidebar" id="side"><a class="wordmark" href="#/dashboard">HelpPoint</a><nav aria-label="Main">${NAV[u.role].map(([k,l])=>`<a class="nav__item" href="#/${k}"${k===cur?' aria-current="page"':''}>${l}</a>`).join('')}</nav><p class="role cap">${u.role} workspace</p></aside><div class="scrim" data-act="menu"></div>
  <div><header class="topbar"><div class="l"><button class="btn btn--outline btn--sm burger" data-act="menu" aria-label="Open menu" aria-controls="side" aria-expanded="false">Menu</button>${key==='request'?`<nav class="crumbs" aria-label="Breadcrumb"><a href="#/${back[0]}">${back[1]}</a> / <span aria-current="page">${esc(arg||'')}</span></nav>`:''}</div>
  <details class="menu"><summary><span class="avatar">${esc(ini)}</span><span class="nm">${esc(u.name)}</span></summary><div class="menu__panel"><p><b>${esc(u.name)}</b><span class="sup block">${esc(u.email)}</span><span class="sup block cap">${u.role}</span></p><a class="btn btn--outline btn--sm" href="#/profile">Profile</a><button class="btn btn--outline btn--sm" data-act="logout">Log out</button></div></details></header><main id="main"></main></div>`}
 const m=$('#main');m.innerHTML='<p class="loading" role="status">Loading…</p>';
 setTimeout(()=>{if(t!==tok)return;
  try{body=(R.pub||R.roles.includes(me().role))?R.v(arg):denied()}catch(e){body='<div class="card empty"><p>Something went wrong.</p><button class="btn btn--outline" data-act="retry">Try again</button></div>'}
  m.innerHTML=body+'<p class="note">Prototype with fictional data. Nothing is saved after you refresh.</p>';window.scrollTo(0,0)},session?250:0)}
window.addEventListener('hashchange',render);

/* ---------- forms ---------- */
const apply=(r,a,p,s,res)=>{let ch=false,ns=s;
 if(a!==r.assignee){if(a&&r.status==='Open'&&s==='Open')ns='Assigned';log(r,a?'Assigned to '+nm(a)+'.':'Unassigned.','status',session);r.assignee=a;ch=true}
 if(p!==r.priority){log(r,'Priority changed to '+p+'.','status',session);r.priority=p;ch=true}
 if(ns!==r.status){log(r,'Status changed to '+ns+'.','status',session);r.status=ns;ch=true;if(ns==='Resolved')r.resolvedAt=ago(0);if(ns==='Closed'&&!r.resolvedAt)r.resolvedAt=ago(0);if(ns==='Reopened')delete r.resolvedAt}
 if(res!==r.resolution){r.resolution=res;ch=true}
 toast(ch?'Request updated':'No changes to save');if(ch)render()};
const H={
 login(f){const email=f.email.value.trim().toLowerCase(),pw=f.password.value;
  if(!check(f,[['email',/^\S+@\S+\.\S+$/.test(email),'Enter a valid email address.'],['password',pw,'Enter your password.']]))return;
  const u=db.users.find(x=>x.email===email&&x.pass===pw),fe=$('#formerr');
  if(!u){fe.textContent='Incorrect email or password.';return}
  if(!u.active){fe.textContent='This account is deactivated. Please contact an administrator.';return}
  session=u.id;go('#/dashboard')},
 register(f){const n=f.name.value.trim(),email=f.email.value.trim().toLowerCase(),pw=f.password.value;
  if(!check(f,[['name',n.length>=2,'Enter your full name.'],['email',/^\S+@\S+\.\S+$/.test(email),'Enter a valid email address.'],['email',!db.users.some(u=>u.email===email),'That email is already registered.'],['password',pw.length>=8,'Use at least 8 characters.'],['confirm',pw===f.confirm.value,'Passwords do not match.']]))return;
  const u={id:db.users.length+1,name:n,email,pass:pw,role:'candidate',active:true};db.users.push(u);session=u.id;toast('Account created');go('#/dashboard')},
 newreq(f){const s=f.subject.value.trim(),d=f.description.value.trim();
  if(!check(f,[['subject',s.length>=5,'Enter a subject of at least 5 characters.'],['description',d.length>=20,'Describe the problem in at least 20 characters.']]))return;
  const b=f.querySelector('button');b.disabled=true;b.textContent='Submitting…';
  setTimeout(()=>{const r={id:'REQ-'+String(db.requests.length+1).padStart(4,'0'),uid:session,subject:s,category:f.category.value,desc:d,priority:'Medium',status:'Open',assignee:null,created:ago(0),resolution:'',history:[]};
   log(r,'Request submitted.','status',session);db.requests.push(r);toast(r.id+' submitted');go('#/request/'+r.id)},600)},
 reply(f,e){const r=req(f.dataset.id),m=f.message.value.trim(),reopen=e.submitter.value==='reopen';
  if(!check(f,[['message',m.length>=3,reopen?'Tell us what still needs help.':'Write a reply first.']]))return;
  log(r,m,'public',session);
  if(reopen){r.status='Reopened';delete r.resolvedAt;log(r,'Status changed to Reopened.','status',session)}
  else if(r.status==='Waiting for Candidate'){r.status='In Progress';log(r,'Status changed to In Progress.','status',session)}
  toast(reopen?'Request reopened':'Reply sent');render()},
 compose(f){const r=req(f.dataset.id),m=f.message.value.trim(),mode=f.dataset.mode;
  if(!check(f,[['message',m.length>=2,'Write a message first.']]))return;
  log(r,m,mode,session);toast(mode==='internal'?'Note added':'Reply sent');render()},
 update(f){const r=req(f.dataset.id),a=f.assignee.value?+f.assignee.value:null,p=f.priority.value,s=f.status.value,res=f.resolution.value.trim();
  if(!check(f,[['resolution',s!=='Resolved'||res,'Add a resolution before marking as Resolved.']]))return;
  if(s==='Closed'&&r.status!=='Closed')ask('Close this request?','The candidate will see it as closed. They can still reopen it.','Close request',()=>apply(r,a,p,s,res),true);else apply(r,a,p,s,res)},
 profile(f){const u=me(),n=f.name.value.trim(),email=f.email.value.trim().toLowerCase();
  if(!check(f,[['name',n.length>=2,'Enter your full name.'],['email',/^\S+@\S+\.\S+$/.test(email),'Enter a valid email address.'],['email',!db.users.some(x=>x.id!==u.id&&x.email===email),'That email is already used by another account.']]))return;
  u.name=n;u.email=email;toast('Profile updated');render()},
 password(f){const u=me(),n=f.next.value;
  if(!check(f,[['current',f.current.value===u.pass,'Your current password is incorrect.'],['next',n.length>=8,'Use at least 8 characters.'],['next',n!==u.pass,'Choose a password you haven’t used before.'],['confirm',n===f.confirm.value,'Passwords do not match.']]))return;
  u.pass=n;toast('Password updated');render()},
 addcat(f){const n=f.cat.value.trim();
  if(!check(f,[['cat',n.length>=2,'Enter a category name.'],['cat',!db.categories.some(c=>c.name.toLowerCase()===n.toLowerCase()),'That category already exists.']]))return;
  db.categories.push({name:n,on:true});toast('Category added');render()}};
document.addEventListener('submit',e=>{e.preventDefault();H[e.target.dataset.form]?.(e.target,e)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const d=b.dataset;
 ({logout(){session=null;go('#/login')},retry:render,reset(){F=DEF();render()},
  menu(){const a=$('#app'),o=a.classList.toggle('open');document.querySelector('.burger')?.setAttribute('aria-expanded',o)},
  demo(){const f=$('form');f.email.value=d.e;f.password.value='demo1234';f.querySelector('button[type=submit]').focus()},
  tab(){const f=b.closest('form');f.dataset.mode=d.m;f.querySelectorAll('[role=tab]').forEach(t=>t.setAttribute('aria-selected',t===b));$('#sendbtn').textContent=d.m==='internal'?'Add note':'Send reply'},
  toggleuser(){const u=U(+d.id);if(u.active)ask('Deactivate '+u.name+'?','They will no longer be able to log in.','Deactivate',()=>{u.active=false;toast(u.name+' deactivated');render()},true);else{u.active=true;toast(u.name+' activated');render()}},
  togglecat(){const c=db.categories[+d.i];if(c.on)ask('Disable '+c.name+'?','Candidates will no longer be able to choose it. Existing requests are not affected.','Disable',()=>{c.on=false;render()},true);else{c.on=true;render()}}})[d.act]?.()});
const filt=e=>{const el=e.target.closest('[data-f]');if(!el)return;F[el.dataset.f]=el.value;if(['logs','reports'].includes(curPage))render();else $('#list').innerHTML=listHTML()};
document.addEventListener('input',e=>{if(e.target.type==='search')filt(e)});
document.addEventListener('change',e=>{if(e.target.type!=='search')filt(e);const s=e.target.closest('[data-role]'),a=e.target.closest('[data-asg]');
 if(s){const u=U(+s.dataset.role),v=s.value;ask('Change role?',u.name+' will become '+v+'.','Change role',()=>{u.role=v;toast(u.name+' is now '+v);render()},false,render)}
 if(a){const r=req(a.dataset.asg),v=a.value?+a.value:null;log(r,v?'Assigned to '+nm(v)+'.':'Unassigned.','status',session);r.assignee=v;if(v&&r.status==='Open'){r.status='Assigned';log(r,'Status changed to Assigned.','status',session)}toast('Assignment updated');render()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#app').classList.remove('open')});
render();
