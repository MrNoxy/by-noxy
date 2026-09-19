'use strict';
// Skins: topology-based tiles built from separate JSON skin files (see skins/, early-skins/).
const SHAPES=[];
function add(id,name,rows){const cells=[];rows.forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1')cells.push([x,y]);}));SHAPES.push({id,name,cells,w:rows[0].length,h:rows.length});}
function rotations(prefix,name,rows){let a=rows.map(r=>[...r]);for(let n=0;n<4;n++){add(`${prefix}-${n*90}`,`${name} · ${n*90}°`,a.map(r=>r.join('')));a=a[0].map((_,i)=>a.map(r=>r[i]).reverse());}}
add('single','Single',['1']);for(let n=2;n<=5;n++){add(`bar-${n}-h`,`${n} in a row`,['1'.repeat(n)]);add(`bar-${n}-v`,`${n} upright`,Array(n).fill('1'));}
add('square-2','Little square',['11','11']);add('square-3','Big square',['111','111','111']);add('rectangle-h','Wide rectangle',['111','111']);add('rectangle-v','Tall rectangle',['11','11','11']);rotations('corner-3','Little corner',['10','11']);rotations('l-4','L piece',['10','10','11']);rotations('j-4','J piece',['01','01','11']);rotations('t-4','T piece',['111','010']);add('s-h','S horizontal',['011','110']);add('s-v','S vertical',['10','11','01']);add('z-h','Z horizontal',['110','011']);add('z-v','Z vertical',['01','11','10']);rotations('corner-5','Big corner',['100','100','111']);
const byId=Object.fromEntries(SHAPES.map(s=>[s.id,s]));
// A skin is built from a small catalog of pieces: a standalone "solo" character,
// a head/middle/tail set that composes into a "worm" of any straight length, and
// four whole "fat" characters for the true 2×2/3×3/wide/tall block shapes.
// Nothing is decided once and locked in — every render regroups whichever board
// cells are still alive (per placement) and re-derives the right art for the
// shape they form *right now*, so a piece that gets partly cleared always still
// looks like one or more complete little bodies, never a broken fragment.
const RECT_FAT=new Set(['square-2','square-3','rectangle-h','rectangle-v']);
const FAT_ROLE={'square-2':'fat-2','square-3':'fat-3','rectangle-h':'fat-wide','rectangle-v':'fat-tall'};
// Greedily splits a set of cells into the longest straight runs it can find, then
// whatever's left, and so on. A cell only starts a run where it has no unclaimed
// neighbor "before" it in that direction, so each run is only measured once.
function decomposeIntoRuns(cells){
 const set=new Set(cells.map(([x,y])=>x+','+y)),claimed=new Set();
 const has=(x,y)=>set.has(x+','+y)&&!claimed.has(x+','+y);
 const measure=(x,y,dx,dy)=>{let len=0;while(has(x,y)){len++;x+=dx;y+=dy;}return len;};
 const ordered=cells.slice().sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
 const runs=[];
 while(true){
  let best=null;
  for(const[x,y] of ordered){
   if(claimed.has(x+','+y))continue;
   if(!has(x-1,y)){const len=measure(x,y,1,0);if(!best||len>best.len)best={x,y,len,orientation:'h'};}
   if(!has(x,y-1)){const len=measure(x,y,0,1);if(!best||len>best.len)best={x,y,len,orientation:'v'};}
  }
  if(!best)break;
  let{x,y}=best;for(let i=0;i<best.len;i++){claimed.add(x+','+y);if(best.orientation==='h')x++;else y++;}
  runs.push(best);
 }
 return runs;
}
function activeSkinIds(){return SKIN_LIST.filter(s=>s.active).map(s=>s.id);}
function chooseSkin(){const preferred=prefs.skin&&prefs.skin!=='random'?prefs.skin:null;if(preferred&&SKIN_BY_ID[preferred]&&SKIN_BY_ID[preferred].active)return preferred;const pool=activeSkinIds();return pool.length?pool[Math.floor(Math.random()*pool.length)]:null;}
function artFor(skinId,role){const skin=skinId&&SKIN_BY_ID[skinId];return skin&&skin.images[role];}
function drawWormRun(c,skin,color,run,ox,oy,u){
 const{x,y,len,orientation}=run;
 for(let i=0;i<len;i++){
  const cx=ox+(orientation==='h'?x+i:x)*u,cy=oy+(orientation==='v'?y+i:y)*u;
  const role=len===1?'solo':i===0?'worm-head':i===len-1?'worm-tail':'worm-middle';
  const img=artFor(skin,role);
  if(img){c.save();c.translate(cx+u/2,cy+u/2);c.rotate(orientation==='v'?Math.PI/2:0);c.drawImage(img,-u/2,-u/2,u,u);c.restore();}
  else tile(c,cx,cy,u,PALETTE[color%PALETTE.length]||PALETTE[0]);
 }
}
function drawFatBlob(c,skin,color,shape,cells,ox,oy,u){
 const minX=Math.min(...cells.map(p=>p[0])),minY=Math.min(...cells.map(p=>p[1]));
 const img=artFor(skin,FAT_ROLE[shape.id]);
 if(img)c.drawImage(img,ox+minX*u,oy+minY*u,shape.w*u,shape.h*u);
 else for(const[x,y] of cells)tile(c,ox+x*u,oy+y*u,u,PALETTE[color%PALETTE.length]||PALETTE[0]);
}
// Renders whichever cells of one placement are still alive, wherever they are —
// used for the board (alive cells may be a fragment of the original shape) and
// for tray/drag previews (alive cells are always the whole, freshly-dealt shape).
function renderPlacement(c,shapeId,skin,color,cells,ox,oy,u){
 const shape=byId[shapeId];
 if(RECT_FAT.has(shapeId)&&cells.length===shape.cells.length){drawFatBlob(c,skin,color,shape,cells,ox,oy,u);return;}
 for(const run of decomposeIntoRuns(cells))drawWormRun(c,skin,color,run,ox,oy,u);
}
const PALETTE=['#d8a3b6','#9bbbac','#b2a8ce','#ddb583','#96b8c7','#bdaca0'];
const $=id=>document.getElementById(id), board=$('board'), ctx=board.getContext('2d'), floating=$('floating'),fctx=floating.getContext('2d');
const EMPTY=()=>Array(64).fill(null);let state={board:EMPTY(),tray:[],score:0,best:0,combo:0,misses:0,boostCharge:0,boostMoves:0,deals:0,rescueTrays:0,revives:0,over:false},prefs={sound:true,haptics:true,motion:true,volume:0.55};let SKIN_LIST=[],SKIN_BY_ID={},selected=-1,hover=null,drag=null,locked=false,keyboard={x:0,y:0},audioCtx,nextPid=1;
function seedPid(){nextPid=1+state.board.reduce((m,c)=>c&&Number.isInteger(c.pid)?Math.max(m,c.pid):m,0);}
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
prefs={...prefs,...read('purrfect-prefs',{})};
function save(){write('purrfect-save',state);}
function fits(shape,x,y,grid=state.board){return shape.cells.every(([dx,dy])=>x+dx>=0&&x+dx<8&&y+dy>=0&&y+dy<8&&!grid[(y+dy)*8+x+dx]);}
function canPlace(s){for(let y=0;y<=8-s.h;y++)for(let x=0;x<=8-s.w;x++)if(fits(s,x,y))return true;return false;}
function cleared(grid){const rows=[],cols=[];for(let n=0;n<8;n++){if(Array.from({length:8},(_,i)=>grid[n*8+i]).every(Boolean))rows.push(n);if(Array.from({length:8},(_,i)=>grid[i*8+n]).every(Boolean))cols.push(n);}const cells=new Set();rows.forEach(y=>{for(let x=0;x<8;x++)cells.add(y*8+x);});cols.forEach(x=>{for(let y=0;y<8;y++)cells.add(y*8+x);});return {rows,cols,cells};}
// Bounded three-move beam search. Every assisted tray carries a legal solution.
const DEAL_RULES={openingTrays:5,reviveTrays:3,beamWidth:6};
const POPCOUNT=Array.from({length:256},(_,n)=>{let count=0;for(;n;n&=n-1)count++;return count;});
const PLACEMENTS=SHAPES.flatMap(s=>{const result=[];for(let y=0;y<=8-s.h;y++)for(let x=0;x<=8-s.w;x++){const rows=Array(8).fill(0);for(const[dx,dy]of s.cells)rows[y+dy]|=1<<(x+dx);result.push({id:s.id,x,y,rows,size:s.cells.length});}return result;});
function boardRows(grid=state.board){return Array.from({length:8},(_,y)=>{let r=0;for(let x=0;x<8;x++)if(grid[y*8+x])r|=1<<x;return r;});}
function simulatePlacement(rows,p){for(let y=0;y<8;y++)if(rows[y]&p.rows[y])return null;const next=rows.map((r,y)=>r|p.rows[y]);let cols=255,lines=0;for(const r of next)cols&=r;for(let y=0;y<8;y++){if(next[y]===255){next[y]=0;lines++;}else next[y]&=~cols;}return {rows:next,lines:lines+POPCOUNT[cols]};}
function boardQuality(rows){let occupied=0,holes=0,pockets=0,contacts=0;for(let y=0;y<8;y++){const r=rows[y],empty=(~r)&255;occupied+=POPCOUNT[r];const neighborEmpty=((empty<<1)|(empty>>>1)|((~(rows[y-1]??255))&255)|((~(rows[y+1]??255))&255));holes+=POPCOUNT[empty&~neighborEmpty];contacts+=POPCOUNT[r&(r>>>1)]+(y?POPCOUNT[r&rows[y-1]]:0);if(y<7){const both=(~(r|rows[y+1]))&255;pockets+=POPCOUNT[both&(both>>>1)];}}return pockets*.8-holes*7-occupied*.65+contacts*.18;}
function planTray(grid=state.board,rng=Math.random){
 const initial=boardRows(grid);let beam=[{rows:initial,score:boardQuality(initial),steps:[],lines:0}];
 for(let depth=0;depth<3;depth++){
  const best=[],seen=new Set();
  for(const node of beam){
   const quality=boardQuality(node.rows);
   for(const p of PLACEMENTS){
    const next=simulatePlacement(node.rows,p);if(!next)continue;
    const repeats=node.steps.filter(s=>s.id===p.id).length;
    const score=node.score+next.lines*160+boardQuality(next.rows)-quality+p.size*.8-repeats*2+rng()*3;
    if(best.length===DEAL_RULES.beamWidth&&score<=best[best.length-1].score)continue;
    const steps=[...node.steps,{id:p.id,x:p.x,y:p.y}],key=next.rows.join(',')+'|'+steps.map(s=>s.id).sort().join(',');
    if(seen.has(key))continue;seen.add(key);
    best.push({rows:next.rows,score,steps,lines:node.lines+next.lines});
    best.sort((a,b)=>b.score-a.score);if(best.length>DEAL_RULES.beamWidth)best.pop();
   }
  }
  if(!best.length)return null;beam=best;
 }
 return beam[0];
}
function assistanceChance(score,dealt){if(dealt<DEAL_RULES.openingTrays)return 1;return score<800?.92:score<2000?.82:score<5000?.65:.5;}
function deal(){const dealt=state.deals||0,rescue=(state.rescueTrays||0)>0;const assisted=rescue||Math.random()<assistanceChance(state.score,dealt);let steps,plan=null;if(assisted){plan=planTray();if(plan)steps=plan.steps;}if(!steps){const available=SHAPES.filter(canPlace);steps=Array.from({length:3},(_,i)=>{const pool=i===0||Math.random()<.7?available:SHAPES;return {id:(pool.length?pool:SHAPES)[Math.floor(Math.random()*(pool.length||SHAPES.length))].id};});}const pieces=steps.map((p,i)=>({id:p.id,color:Math.floor(Math.random()*PALETTE.length),skin:chooseSkin(),planOrder:i}));for(let i=pieces.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pieces[i],pieces[j]]=[pieces[j],pieces[i]];}state.tray=pieces;state.deals=dealt+1;state.assistedTray=!!plan;state.dealKind=rescue?'revive':plan?'assisted':'challenge';state.dealPlan=plan?plan.steps.map((p,i)=>({...p,slot:pieces.findIndex(piece=>piece.planOrder===i)})):[];if(rescue&&plan)state.rescueTrays=Math.max(0,state.rescueTrays-1);}

function checkOver(){state.over=!state.tray.some(p=>p&&canPlace(byId[p.id]));save();if(state.over)setTimeout(()=>{if(state.over&&!revivePending)showGameOver();},350);}
function newGame(){runEpoch++;reviveAbort?.abort();revivePending=false;state={board:EMPTY(),tray:[],score:0,best:state.best,combo:0,misses:0,boostCharge:0,boostMoves:0,deals:0,rescueTrays:0,revives:0,over:false};nextPid=1;selected=-1;hover=null;deal();save();render();}
function round(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function tile(c,x,y,size,color){round(c,x+1.7,y+1.7,size-3.4,size-3.4,size*.18,color);c.fillStyle='#ffffff35';c.fillRect(x+size*.24,y+size*.15,size*.5,Math.max(1,size*.055));}
function drawPiece(c,p,unit,ox=0,oy=0,alpha=1){c.save();c.globalAlpha=alpha;renderPlacement(c,p.id,p.skin,p.color,byId[p.id].cells,ox,oy,unit);c.restore();}
function sizeCanvas(c,w,h){const d=Math.min(window.devicePixelRatio||1,3);c.width=Math.round(w*d);c.height=Math.round(h*d);c.style.width=w+'px';c.style.height=h+'px';c.getContext('2d').setTransform(d,0,0,d,0,0);}
function draw(){const w=$('board-wrap').clientWidth-20;if(w<=0)return;sizeCanvas(board,w,w);const unit=w/8;ctx.clearRect(0,0,w,w);for(let i=0;i<64;i++){const x=i%8,y=Math.floor(i/8);round(ctx,x*unit+1.5,y*unit+1.5,unit-3,unit-3,unit*.16,(x+y)%2?'#f1e5dd':'#f6ebe4');}
 const groups=new Map();
 for(let i=0;i<64;i++){const cell=state.board[i];if(!cell)continue;const x=i%8,y=Math.floor(i/8);if(!groups.has(cell.pid))groups.set(cell.pid,{id:cell.id,skin:cell.skin,color:cell.color,cells:[]});groups.get(cell.pid).cells.push([x,y]);}
 for(const g of groups.values())renderPlacement(ctx,g.id,g.skin,g.color,g.cells,0,0,unit);
if(hover&&selected>=0&&state.tray[selected]){const p=state.tray[selected],s=byId[p.id],valid=fits(s,hover.x,hover.y);ctx.save();ctx.globalAlpha=.55;for(const [dx,dy] of s.cells){const x=hover.x+dx,y=hover.y+dy;if(x>=0&&y>=0&&x<8&&y<8)round(ctx,x*unit+2,y*unit+2,unit-4,unit-4,6,valid?'#83ae99':'#cc7689');}ctx.restore();if(valid){const test=state.board.slice();s.cells.forEach(([dx,dy])=>test[(hover.y+dy)*8+hover.x+dx]={});const clear=cleared(test);ctx.fillStyle='#fff9ce88';clear.cells.forEach(i=>ctx.fillRect((i%8)*unit,Math.floor(i/8)*unit,unit,unit));}}}
function render(){draw();updateBoost();updateReviveUI();$('score').textContent=state.score.toLocaleString();$('best').textContent=state.best.toLocaleString();$('combo').textContent=state.combo>1?`×${state.combo} COMBO`:'';$('tray').replaceChildren();state.tray.forEach((p,i)=>{const b=document.createElement('button');b.className='piece'+(!p?' used':'')+(selected===i?' selected':'');b.disabled=!p||state.over;b.setAttribute('aria-label',p?byId[p.id].name:'Piece placed');b.setAttribute('aria-pressed',String(selected===i));if(p){const s=byId[p.id],c=document.createElement('canvas'),u=Math.min(23,($('tray').clientWidth/3-20)/s.w,75/s.h);sizeCanvas(c,s.w*u,s.h*u);drawPiece(c.getContext('2d'),p,u);b.append(c);b.addEventListener('pointerdown',e=>startDrag(e,i));b.addEventListener('click',e=>{if(e.detail===0){selected=i;hover={...keyboard};render();board.focus();}});} $('tray').append(b);});}
function status(t){$('status').textContent=t;}
function sound(kind='place',level=1){if(!prefs.sound)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const patterns={pick:[520],place:[280,420],invalid:[160,120],clear:[523,659,784],combo:[659,784,988,1175],boost:[523,784,1047,1319,1568],all:[523,659,784,1047,1319,1568],deal:[440,660],over:[440,349,262]};const notes=patterns[kind]||patterns.place;notes.forEach((f,i)=>{const t=audioCtx.currentTime+i*.065,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=kind==='pick'?'sine':'triangle';o.frequency.setValueAtTime(f*(kind==='combo'?1+Math.min(level,8)*.025:1),t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09*prefs.volume,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+.18);});}catch{}}
function motionOn(){return prefs.motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches;}
function updateBoost(){if(!$('boost'))return;const moves=state.boostMoves||0,charge=state.boostCharge||0;$('boost').classList.toggle('active',moves>0);$('boost-label').textContent=moves?`♥ DOUBLE POINTS · ${moves} moves`:`PURR POWER · ${charge}/5 lines`;$('boost-fill').style.width=(moves?100:charge*20)+'%';$('boost').setAttribute('aria-label',moves?`Double points for ${moves} moves`:`${charge} of 5 lines toward double points`);}
function fxElement(cls,text,x,y){const el=document.createElement('span');el.className='fx '+cls;el.textContent=text;el.style.left=x+'%';el.style.top=y+'%';$('effects').append(el);el.addEventListener('animationend',()=>el.remove(),{once:true});setTimeout(()=>el.remove(),1600);return el;}
function celebrate(cells,placed,points,lines,label){if(!motionOn())return;for(const i of (lines?[...cells]:placed)){const e=fxElement(lines?'cell-clear':'cell-land','',(i%8)*12.5,Math.floor(i/8)*12.5);e.style.setProperty('--delay',Math.min(i%8,4)*16+'ms');}if(lines){fxElement('score-float',label||`+${points}`,50,42);for(let n=0;n<Math.min(28,8+lines*6);n++){const e=fxElement('spark','',50,45);e.style.setProperty('--dx',((Math.random()-.5)*260)+'px');e.style.setProperty('--dy',((Math.random()-.7)*260)+'px');e.style.background=PALETTE[n%PALETTE.length];}if(lines>1)$('board-wrap').animate([{transform:'scale(1)'},{transform:'scale(1.025)'},{transform:'scale(1)'}],{duration:280});}$('score').animate([{transform:'scale(1)'},{transform:'scale(1.12)',color:'#b76885'},{transform:'scale(1)'}],{duration:260});}
function scoreMove(cellCount,lines,combo,multiplier,allClear){return (cellCount+10*lines*lines*combo+(allClear?200:0))*multiplier;}

function place(index,x,y){if(locked||state.over||!Number.isInteger(index)||!state.tray[index])return false;const p=state.tray[index],s=byId[p.id];if(!Number.isInteger(x)||!Number.isInteger(y)||!fits(s,x,y)){status('A little more room needed. Try another spot.');sound('invalid');return false;}const placed=[];const pid=nextPid++;s.cells.forEach(([sx,sy])=>{const i=(y+sy)*8+x+sx;placed.push(i);state.board[i]={id:p.id,color:p.color,skin:p.skin||null,pid};});state.tray[index]=null;selected=-1;hover=null;const clear=cleared(state.board),lines=clear.rows.length+clear.cols.length;const multiplier=(state.boostMoves||0)>0?2:1;if(multiplier===2)state.boostMoves--;if(lines){state.combo++;state.misses=0;}else{state.misses++;if(state.misses>=3)state.combo=0;}clear.cells.forEach(i=>state.board[i]=null);const allClear=lines>0&&state.board.every(c=>!c);const points=scoreMove(s.cells.length,lines,state.combo,multiplier,allClear);state.score+=points;let activated=false;if(lines&&multiplier===1){state.boostCharge=(state.boostCharge||0)+lines;if(state.boostCharge>=5){state.boostCharge=0;state.boostMoves=3;activated=true;}}const record=state.score>state.best&&state.best>0&&!state.recordCelebrated;if(record)state.recordCelebrated=true;state.best=Math.max(state.best,state.score);let message=allClear?`Clean sweep! +${points}`:activated?'Purr power! Your next 3 moves score double.':lines?`${lines>1?lines+' lines! ':''}${state.combo>1?'Combo ×'+state.combo+' · ':''}+${points}${multiplier===2?' · doubled!':''}`:multiplier===2?`Double points! +${points}`:'One little piece at a time.';if(record&&!lines)message=`New personal best! +${points}`;status(message);sound(allClear?'all':activated?'boost':lines?(state.combo>1?'combo':'clear'):'place',state.combo);if(prefs.haptics&&navigator.vibrate)navigator.vibrate(lines?[18,35,18]:8);const refill=state.tray.every(p=>!p);if(refill)deal();save();render();celebrate(clear.cells,placed,points,lines,allClear?`CLEAN SWEEP +${points}`:activated?'PURR POWER ×2':null);if(refill&&motionOn())for(const b of $('tray').children)b.animate([{transform:'translateY(10px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:240});checkOver();return true;}

function startDrag(e,i){if(locked||state.over||e.button>0)return;e.preventDefault();selected=i;hover=null;drag={i,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false,touch:e.pointerType!=='mouse'};sound('pick');render();}
function dragMove(e){if(!drag||drag.pointer!==e.pointerId)return;e.preventDefault();if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6)drag.moved=true;if(!drag.moved)return;const p=state.tray[drag.i];if(!p)return;const s=byId[p.id],r=board.getBoundingClientRect(),u=r.width/8;const left=e.clientX-s.w*u/2,top=e.clientY-s.h*u-(drag.touch?32:-s.h*u/2);sizeCanvas(floating,s.w*u,s.h*u);floating.hidden=false;floating.style.left=left+'px';floating.style.top=top+'px';drawPiece(fctx,p,u,0,0,.88);hover={x:Math.round((left-r.left)/u),y:Math.round((top-r.top)/u)};draw();}
function endDrag(e){if(!drag||drag.pointer!==e.pointerId)return;const d=drag;drag=null;floating.hidden=true;if(d.moved&&hover)place(d.i,hover.x,hover.y);hover=null;render();}
window.addEventListener('pointermove',dragMove,{passive:false});window.addEventListener('pointerup',endDrag);window.addEventListener('pointercancel',()=>{drag=null;floating.hidden=true;hover=null;draw();});window.addEventListener('blur',()=>{drag=null;floating.hidden=true;hover=null;draw();});
board.addEventListener('pointerdown',e=>{e.preventDefault();if(selected<0)return;const r=board.getBoundingClientRect(),u=r.width/8;place(selected,Math.floor((e.clientX-r.left)/u),Math.floor((e.clientY-r.top)/u));});board.addEventListener('pointermove',e=>{if(drag||selected<0||e.pointerType!=='mouse')return;const r=board.getBoundingClientRect(),u=r.width/8;hover={x:Math.floor((e.clientX-r.left)/u),y:Math.floor((e.clientY-r.top)/u)};draw();});board.addEventListener('pointerleave',()=>{if(!drag){hover=null;draw();}});board.addEventListener('keydown',e=>{if(selected<0)return;if(e.key.startsWith('Arrow')){e.preventDefault();keyboard.x=Math.max(0,Math.min(7,keyboard.x+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0)));keyboard.y=Math.max(0,Math.min(7,keyboard.y+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0)));hover={...keyboard};draw();}else if(e.key==='Enter'||e.key===' '){e.preventDefault();place(selected,keyboard.x,keyboard.y);}else if(e.key==='Escape'){selected=-1;hover=null;render();}});
for(const event of ['gesturestart','gesturechange','gestureend'])document.addEventListener(event,e=>e.preventDefault(),{passive:false});document.addEventListener('contextmenu',e=>{if(!e.target.closest('dialog'))e.preventDefault();});
function openModal(title,html){drag=null;floating.hidden=true;hover=null;$('modal-title').textContent=title;$('modal-body').innerHTML=html;if(!$('modal').open)$('modal').showModal();}
$('close').onclick=()=>$('modal').close();$('help').onclick=()=>openModal('A little how-to','<p>Fill a whole row or column to clear it. Keep making room for your next three pieces.</p><ol><li>Drag a piece onto the board. On phones, it floats above your finger.</li><li>Or tap a piece, then tap where its top-left corner should go.</li><li>Use all three pieces to get a fresh set. Pieces cannot rotate.</li></ol><p>Clear several lines together for extra points. Your combo grows with each clear and resets after three placements without a clear.</p><p class="note">Clear 5 lines to earn double points for the next 3 placements. Empty the board for a 200-point bonus, also doubled during Purr Power. The opening trays are fitted to your board. Later trays gradually become more challenging. If you run out of room, an optional free revive keeps your score and rerolls your pieces. No timer. No rush. Your game and best score save on this device when browser storage is available.</p>');
function skinOptions(){const active=SKIN_LIST.filter(s=>s.active);const current=prefs.skin&&SKIN_BY_ID[prefs.skin]?prefs.skin:'random';let opts=`<option value="random" ${current==='random'?'selected':''}>Random mix ✨</option>`;opts+=active.map(s=>`<option value="${s.id}" ${current===s.id?'selected':''}>${s.name}${s.holiday?' 🎉':''}</option>`).join('');return opts;}
function skinNote(){const active=SKIN_LIST.filter(s=>s.active),upcoming=SKIN_LIST.filter(s=>!s.active&&s.holiday);let note=active.length?`${active.length} skin${active.length===1?'':'s'} loaded and ready.`:'No skins found yet — the board uses plain little tiles. Add one with the Skin Studio.';if(upcoming.length)note+=` ${upcoming.length} holiday skin${upcoming.length===1?'':'s'} waiting for its dates.`;return note;}
$('settings').onclick=()=>{openModal('Make yourself comfy','<label class="setting">Game sounds<input id="sound-check" type="checkbox"></label><label class="setting">Gentle haptics<input id="haptic-check" type="checkbox"></label><label class="setting">Celebration animations<input id="motion-check" type="checkbox"></label><label class="setting">Volume<input id="volume-control" type="range" min="0" max="1" step="0.05"></label><label class="variant-row">Pusheen skin<select id="skin-select">'+skinOptions()+'</select></label><p class="note" id="skin-note">'+skinNote()+'</p><p class="note">Draw your own in the separate <a href="studio.html" target="_blank" rel="noopener">Skin Studio</a>, then drop the exported file into this project\u2019s <code>skins</code> or <code>early-skins</code> folder.</p><p class="note">Haptics work on supported devices. Sound starts after you interact with the game.</p><button class="primary" id="restart">Start a new game</button>');$('motion-check').checked=prefs.motion;$('motion-check').onchange=e=>{prefs.motion=e.target.checked;write('purrfect-prefs',prefs);};$('volume-control').value=prefs.volume;$('volume-control').oninput=e=>{prefs.volume=Number(e.target.value);write('purrfect-prefs',prefs);};$('sound-check').checked=prefs.sound;$('haptic-check').checked=prefs.haptics;$('sound-check').onchange=e=>{prefs.sound=e.target.checked;write('purrfect-prefs',prefs);sound('pick');};$('haptic-check').onchange=e=>{prefs.haptics=e.target.checked;write('purrfect-prefs',prefs);};$('skin-select').onchange=e=>{prefs.skin=e.target.value;write('purrfect-skin-pref',prefs.skin);render();};$('restart').onclick=()=>{openModal('Start fresh?','<p>This clears your current board. Your best score and skins stay.</p><button class="primary" id="confirm-new">Yes, a fresh little puzzle</button>');$('confirm-new').onclick=()=>{$('modal').close();newGame();};};};
// Owner configuration. Keep free for now: no ad calls, SDKs, tracking or waits.
// Future preference: show a self-made promotional video for other projects.
const REVIVE_ADS={mode:'free',promoVideoUrl:'',title:'A little project break',providerTimeoutMs:120000};
let revivePending=false,runEpoch=0,reviveAbort=null;
function updateReviveUI(){if(!$('revive-shortcut'))return;$('revive-shortcut').hidden=!state.over;$('status').hidden=state.over;}
function reviveButtonLabel(){return REVIVE_ADS.mode==='free'?'Revive · free ♥':REVIVE_ADS.mode==='custom-video'?'Watch a project video & revive':'Watch a video & revive';}
function safeVideoURL(value){try{const u=new URL(value,window.location.href);return u.protocol==='https:'||u.protocol==='http:'||u.protocol==='data:'?u.href:null;}catch{return null;}}
function customVideoReward(signal){return new Promise((resolve,reject)=>{const src=safeVideoURL(REVIVE_ADS.promoVideoUrl);if(!src){reject(Error('No promo video is configured.'));return;}openModal(REVIVE_ADS.title,'<p class="note">An optional video from the creator. Finish it to continue your puzzle.</p><video id="revive-video" controls playsinline preload="metadata"></video><p id="video-note" class="note">Press play when you’re ready. Closing this video keeps your game over screen.</p><button class="secondary" id="cancel-video">Not now</button>');const video=$('revive-video'),modal=$('modal');let done=false,last=0,watched=0;function finish(result,error){if(done)return;done=true;video.pause();video.removeAttribute('src');video.load();modal.removeEventListener('close',onClose);signal.removeEventListener('abort',onAbort);error?reject(error):resolve(result);}const onClose=()=>finish(false),onAbort=()=>finish(false);modal.addEventListener('close',onClose);signal.addEventListener('abort',onAbort,{once:true});$('cancel-video').onclick=()=>finish(false);video.addEventListener('timeupdate',()=>{const delta=video.currentTime-last;if(!video.seeking&&!video.paused&&delta>0&&delta<1.5)watched+=delta;last=video.currentTime;});video.addEventListener('seeking',()=>{last=video.currentTime;});video.addEventListener('error',()=>finish(false,Error('The promo video could not load.')),{once:true});video.addEventListener('ended',()=>{if(Number.isFinite(video.duration)&&watched>=Math.max(0,video.duration-1.5))finish(true);else{$('video-note').textContent='Play the whole video to unlock the revive, or choose Not now.';watched=0;last=0;video.currentTime=0;}});video.src=src;});}
async function requestReviveReward(signal){if(REVIVE_ADS.mode==='free')return true;if(REVIVE_ADS.mode==='custom-video')return customVideoReward(signal);if(REVIVE_ADS.mode==='provider'){const provider=window.PurrfectRewardedAd;if(typeof provider!=='function')throw Error('No video provider is connected.');return new Promise((resolve,reject)=>{let done=false;const finish=(value,error)=>{if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',abort);error?reject(error):resolve(value);};const abort=()=>finish(false),timer=setTimeout(()=>finish(false,Error('The video provider timed out.')),REVIVE_ADS.providerTimeoutMs);signal.addEventListener('abort',abort,{once:true});Promise.resolve().then(()=>provider({placement:'revive',signal})).then(result=>finish(result?.completed===true),error=>finish(false,error));});}throw Error('Unknown revive mode.');}
function applyRevive(){if(!state.over)return false;const oldTray=state.tray;const oldDeals=state.deals;state.rescueTrays=DEAL_RULES.reviveTrays;deal();if(!state.assistedTray){state.tray=oldTray;state.deals=oldDeals;state.rescueTrays=0;return false;}state.revives=(state.revives||0)+1;state.over=false;selected=-1;hover=null;save();render();status('Welcome back ♥ Three carefully fitted trays, starting now.');sound('boost');return true;}
async function startRevive(){if(revivePending||!state.over)return;revivePending=true;const epoch=runEpoch;reviveAbort=new AbortController();const btn=$('revive');if(btn){btn.disabled=true;btn.textContent=REVIVE_ADS.mode==='free'?'Finding your perfect pieces…':'Opening video…';}try{const earned=await requestReviveReward(reviveAbort.signal);if(epoch!==runEpoch||!state.over)return;if(!earned){showGameOver(false,'No revive used. Your score and board are unchanged.');return;}if(!applyRevive()){showGameOver(false,'Could not find a legal reroll for this board. You can start fresh.');return;}$('modal').close();}catch{if(epoch===runEpoch&&state.over)showGameOver(false,'The video is unavailable. Your game is saved; try again or start fresh.');}finally{revivePending=false;reviveAbort=null;}}
function showGameOver(playSound=true,note=''){if(playSound)sound('over');openModal('A lovely little run','<p style="text-align:center">Out of room? Give this puzzle another chance.</p><div class="big-score">'+state.score.toLocaleString()+'</div><p style="text-align:center">Personal best · '+state.best.toLocaleString()+'</p><button class="primary" id="revive">'+reviveButtonLabel()+'</button><p class="note" style="text-align:center">Keep your board and score. Get new pieces, with three board-matched trays starting now.</p><button class="secondary restart-choice" id="again">Start a new game</button><p id="revive-note" class="note"></p>');$('revive-note').textContent=note;$('revive').onclick=startRevive;$('again').onclick=()=>{$('modal').close();newGame();};}
$('revive-shortcut').onclick=()=>showGameOver(false);

const SKIN_MANIFESTS=[{dir:'skins',holiday:false},{dir:'early-skins',holiday:true}];
function parseSkinDate(s){if(!s)return null;const m=/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s.trim());if(!m)return null;return new Date(Number(m[3]),Number(m[2])-1,Number(m[1]),0,0,0,0);}
function withinWindow(skin,now){const start=parseSkinDate(skin.startDate),end=parseSkinDate(skin.endDate);if(start&&now<start)return false;if(end){const endInclusive=new Date(end.getFullYear(),end.getMonth(),end.getDate(),23,59,59,999);if(now>endInclusive)return false;}return true;}
async function loadImg(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('bad image'));img.src=src;});}
const V3_ROLE_MAP={head:'worm-head',tail:'worm-tail',straight:'worm-middle',single:'solo','fat-2':'fat-2','fat-3':'fat-3','fat-wide':'fat-wide','fat-tall':'fat-tall'};
async function loadSkinFile(dir,file){const res=await fetch(`${dir}/${file}`,{cache:'no-store'});if(!res.ok)throw Error('missing '+file);const data=await res.json();if((data.format!=='purrfect-skin-v4'&&data.format!=='purrfect-skin-v3')||!data.id||!data.parts)throw Error('bad skin file '+file);const isV3=data.format==='purrfect-skin-v3';const images={};for(const[key,entry] of Object.entries(data.parts)){const role=isV3?V3_ROLE_MAP[key]:key;if(role&&entry&&entry.image){try{images[role]=await loadImg(entry.image);}catch{}}}return {id:data.id,name:data.name||data.id,holiday:!!data.holiday,startDate:data.startDate||null,endDate:data.endDate||null,images};}
async function initSkins(){const now=new Date();const found=[];for(const {dir} of SKIN_MANIFESTS){try{const res=await fetch(`${dir}/manifest.json`,{cache:'no-store'});if(!res.ok)continue;const manifest=await res.json();const files=Array.isArray(manifest.files)?manifest.files:[];for(const file of files){try{found.push(await loadSkinFile(dir,file));}catch{}}}catch{}}
 for(const skin of found){skin.active=withinWindow(skin,now);SKIN_BY_ID[skin.id]=skin;}
 SKIN_LIST=found;
 const saved=read('purrfect-skin-pref',null);if(saved)prefs.skin=saved;
 // Pieces dealt or placed before this fetch resolved locked in skin:null — give them a skin now.
 for(const p of state.tray)if(p&&!p.skin)p.skin=chooseSkin();
 for(const c of state.board)if(c&&!c.skin)c.skin=chooseSkin();
 render();}

const saved=read('purrfect-save',null);if(saved&&Array.isArray(saved.board)&&saved.board.length===64&&saved.board.every(c=>!c||byId[c.id])&&Array.isArray(saved.tray)&&saved.tray.length===3&&saved.tray.every(p=>!p||byId[p.id])&&Number.isFinite(saved.score)&&Number.isFinite(saved.best)){state={...state,...saved};seedPid();if(state.tray.every(p=>!p))deal();render();if(state.over)status('Out of room? Revive or start fresh.');}else newGame();
new ResizeObserver(()=>render()).observe($('board-wrap'));initSkins();
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'read_puzzle',description:'Read current board, available pieces and score.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({board:state.board.map(c=>!!c),pieces:state.tray.map(p=>p?byId[p.id]:null),score:state.score,over:state.over})})).catch(()=>{});Promise.resolve(document.modelContext.registerTool({name:'place_piece',description:'Place an available piece at a zero-based top-left board coordinate.',inputSchema:{type:'object',properties:{index:{type:'integer',minimum:0,maximum:2},x:{type:'integer',minimum:0,maximum:7},y:{type:'integer',minimum:0,maximum:7}},required:['index','x','y'],additionalProperties:false},annotations:{readOnlyHint:false},execute:({index,x,y})=>({placed:place(index,x,y),score:state.score,over:state.over})})).catch(()=>{});}catch{}}
