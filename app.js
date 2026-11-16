(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
var damp=function(d,m){return m*(1-Math.exp(-d/m))};
var fmt=function(n){return n.toFixed(1).replace('.',',')};
var body=document.body;

/* =============== ABERTURA: PUXA A CORDA =============== */
var gate=$('#gate'),svg=$('#rigsvg'),handle=$('#handle'),wheel=$('#wheel'),plates=$('#plates'),ropeL=$('#ropeL'),ropeR=$('#ropeR');
var kgfEl=$('#kgf'),mbar=$('#mbar'),cap=$('#cap'),cta=$('#cta'),rig=$('#rig');
var MAXP=150,PEAK=37.5,WHEEL_R=35,NSEG=24;
var st={p:0,vp:0,hx:0,sway:0,vs:0,drag:false,locked:false,auto:null,lastHx:0,entered:false};
for(var i=0;i<NSEG;i++){mbar.appendChild(document.createElement('i'))}
var segs=$$('i',mbar);
function render(){
  var yp=258-st.p,yh=150+st.p,hx=st.hx;
  plates.setAttribute('transform','translate(0 '+yp+')');
  ropeL.setAttribute('d','M116 62 V'+yp);
  var cx=184+hx/2+st.sway*(1-Math.abs(st.p/MAXP-.5));
  ropeR.setAttribute('d','M184 62 Q'+cx.toFixed(2)+' '+((62+yh)/2).toFixed(1)+' '+(184+hx).toFixed(2)+' '+yh.toFixed(1));
  handle.setAttribute('transform','translate('+(184+hx).toFixed(2)+' '+yh.toFixed(1)+')');
  wheel.setAttribute('transform','translate(150 62) rotate('+(st.p/WHEEL_R*57.2958).toFixed(2)+')');
  var k=PEAK*Math.pow(clamp(st.p/MAXP,0,1),1.5);
  kgfEl.textContent=fmt(k);
  var on=Math.round(k/PEAK*NSEG);
  for(var j=0;j<NSEG;j++){segs[j].className=(j<on?'on':'')+((st.locked&&j===NSEG-1)?' pk':'')}
}
function lock(){
  if(st.locked)return;st.locked=true;st.drag=false;st.p=MAXP;st.hx=0;st.sway+=6;
  gate.classList.add('locked','pulled');
  cap.textContent='Agora vamos medir o seu de verdade';
  if(navigator.vibrate)try{navigator.vibrate([18,40,28])}catch(e){}
  render();
}
function autoPull(){
  if(st.locked||st.auto)return;
  gate.classList.add('pulled');
  if(reduce){st.p=MAXP;lock();return}
  var from=st.p,t0=performance.now(),D=1150;
  st.auto=true;
  (function step(now){
    var t=clamp((now-t0)/D,0,1),e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    st.p=from+(MAXP-from)*e;
    if(t<1)requestAnimationFrame(step);else{st.auto=null;lock()}
  })(t0);
}
var drag0=null;
handle.addEventListener('pointerdown',function(e){
  if(st.locked||st.auto)return;
  e.preventDefault();handle.setPointerCapture(e.pointerId);
  var sc=svg.getBoundingClientRect().width/300;
  drag0={y:e.clientY,x:e.clientX,p:st.p,sc:sc,moved:0};st.drag=true;gate.classList.add('pulled');
});
handle.addEventListener('pointermove',function(e){
  if(!drag0||!st.drag)return;
  var dy=(e.clientY-drag0.y)/drag0.sc,dx=(e.clientX-drag0.x)/drag0.sc;
  drag0.moved=Math.max(drag0.moved,Math.abs(e.clientY-drag0.y)+Math.abs(e.clientX-drag0.x));
  var raw=drag0.p+dy;
  var p=raw<0?-damp(-raw,10):(raw>MAXP?MAXP+damp(raw-MAXP,12):raw);
  st.p=Math.max(p,0);
  var nhx=clamp(dx,-16,16);st.vs+=(nhx-st.lastHx)*.9;st.lastHx=nhx;st.hx=nhx;
  if(raw>=MAXP-2){lock();try{handle.releasePointerCapture(e.pointerId)}catch(_){}}
});
function up(){
  if(!drag0)return;var d=drag0;drag0=null;st.drag=false;
  if(st.locked)return;
  if(d.moved<8){autoPull();return}
  st.vp=0;
}
handle.addEventListener('pointerup',up);handle.addEventListener('pointercancel',up);
handle.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();autoPull()}});
var last=performance.now();
function loop(now){
  if(st.entered)return;
  var dt=Math.min(.033,(now-last)/1000);last=now;
  if(!st.drag&&!st.locked&&!st.auto&&st.p>0){ /* peso volta: gravidade */
    st.vp+=900*dt;st.p-=st.vp*dt;
    if(st.p<=0){st.p=0;st.vp=0}
  }
  if(!st.drag){st.hx*=.82;if(Math.abs(st.hx)<.05)st.hx=0}
  st.vs+=(-st.sway*60-st.vs*5)*dt;st.sway+=st.vs*dt;
  render();
  requestAnimationFrame(loop);
}
render();requestAnimationFrame(loop);

function enter(target){
  if(st.entered)return;st.entered=true;
  gate.classList.add('out');body.classList.add('in');
  window.scrollTo(0,0);
  setTimeout(function(){gate.style.display='none'},950);
  if(target&&target!=='#inicio'){setTimeout(function(){var el=$(target);if(el)el.scrollIntoView()},60)}
  startFx();
}
$('#skip').addEventListener('click',function(){enter()});
cta.addEventListener('click',function(e){e.preventDefault();enter()});
if(/[?&]direto/.test(location.search))enter();

/* =============== EFEITOS DA PÁGINA =============== */
var fxOn=false;
function startFx(){
  if(fxOn)return;fxOn=true;
  initReveal();initDock();initRadar();initArc();initSteps();initCases();initSvcs();initTilt();initReviews();initChat();initHours();
}
if(!/[?&]direto/.test(location.search)){ /* prepara sem animar o que depende de layout visível */
  initHoursEarly();
}
function initHoursEarly(){}

/* reveal */
function initReveal(){
  var els=$$('.h2,.lead,.radar-card,.arc-pick,.ficha,.step,.case,.svc,.tilt,.strip,.score,.rev-view,.chat,.hours,.links li,.note,.marq');
  els.forEach(function(el,i){el.classList.add('rv');});
  var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('v');io.unobserve(en.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  els.forEach(function(el){io.observe(el)});
}

/* dock */
function initDock(){
  var dock=$('#dock'),links=$$('a',dock),secs=$$('main > section');
  var t=false;
  function upd(){
    t=false;var y=innerHeight*.42,cur=secs[0];
    secs.forEach(function(s){var r=s.getBoundingClientRect();if(r.top<=y&&r.bottom>y)cur=s});
    var key=cur.getAttribute('data-nav');
    links.forEach(function(a){a.classList.toggle('on',a.getAttribute('data-t')===key)});
    var r=dock.getBoundingClientRect(),yy=r.top+r.height/2,onl=false;
    secs.forEach(function(s){var b=s.getBoundingClientRect();if(b.top<=yy&&b.bottom>yy&&s.classList.contains('light'))onl=true});
    dock.classList.toggle('onlight',onl);
  }
  addEventListener('scroll',function(){if(!t){t=true;requestAnimationFrame(upd)}},{passive:true});upd();
}

/* radar */
function initRadar(){
  var NS='http://www.w3.org/2000/svg',cx=130,cy=126,R=84;
  var names=['Quadríceps','Isquiotibiais','Glúteo','Panturrilha','Adutores'];
  var right=[.98,.92,1,.9,.95],f=[1,.94,1.04,.97,1.02];
  var grid=$('#rgrid'),lab=$('#rlabels');
  function pt(i,v){var a=-Math.PI/2+i*2*Math.PI/5;return [cx+Math.cos(a)*R*v,cy+Math.sin(a)*R*v]}
  [.25,.5,.75,1].forEach(function(l){
    var p=document.createElementNS(NS,'polygon');p.setAttribute('points',names.map(function(_,i){return pt(i,l).join(',')}).join(' '));
    p.setAttribute('fill','none');p.setAttribute('stroke','rgba(255,255,255,.16)');p.setAttribute('stroke-width','1');grid.appendChild(p);
  });
  names.forEach(function(n,i){
    var e=pt(i,1),l=document.createElementNS(NS,'line');l.setAttribute('x1',cx);l.setAttribute('y1',cy);l.setAttribute('x2',e[0]);l.setAttribute('y2',e[1]);l.setAttribute('stroke','rgba(255,255,255,.16)');grid.appendChild(l);
    var q=pt(i,1.2),t=document.createElementNS(NS,'text');t.setAttribute('x',q[0]);t.setAttribute('y',q[1]+4);t.setAttribute('text-anchor',i===0?'middle':(q[0]<cx-4?'end':(q[0]>cx+4?'start':'middle')));t.textContent=n;lab.appendChild(t);
  });
  var polyR=$('#polyR'),polyL=$('#polyL'),polyLg=$('#polyLg'),inp=$('#lr'),lrv=$('#lrv'),symv=$('#symv'),arcv=$('#arcv');
  polyR.setAttribute('points',right.map(function(v,i){return pt(i,v).join(',')}).join(' '));
  var cur=100,tgt=92,raf=0;
  function draw(s){
    var pts=right.map(function(v,i){return pt(i,clamp(v*f[i]*s/100,0,1.12)).join(',')}).join(' ');
    polyL.setAttribute('points',pts);polyLg.setAttribute('points',pts);
    var ratio=0;right.forEach(function(v,i){ratio+=clamp(v*f[i]*s/100,0,1.12)/v});ratio=ratio/5*100;
    var sym=Math.round(100-Math.abs(100-ratio));
    symv.textContent=sym;arcv.setAttribute('stroke-dasharray',sym+' 100');
  }
  function tick(){cur+=(tgt-cur)*.16;draw(cur);if(Math.abs(tgt-cur)>.05)raf=requestAnimationFrame(tick);else{cur=tgt;draw(cur);raf=0}}
  function set(v,smooth){tgt=v;lrv.textContent=Math.round(v)+'%';inp.style.setProperty('--p',((v-40)/70*100)+'%');if(smooth||!raf){cancelAnimationFrame(raf);raf=requestAnimationFrame(tick)}}
  inp.addEventListener('input',function(){set(+inp.value,true)});
  draw(100);set(92,true);
  var did=false,io=new IntersectionObserver(function(es){if(es[0].isIntersecting&&!did){did=true;if(!reduce){cur=100;inp.value=60;set(60,true);setTimeout(function(){inp.value=92;set(92,true)},900)}}},{threshold:.4});
  io.observe($('.radar-card'));
}

/* triagem em arco: onde dói */
function initArc(){
  var box=$('#arcpick'),frame=$('.arc-frame',box),items=[],N=0;
  var R=260,STEP=30,TOPY=62,rot=0,vel=0,dragging=false,sx=0,sr=0,lx=0,lt=0,raf=0,sel=-1,step=0,ans=[],done=false;
  var info={
    'Joelho':'A avaliação compara a força dos dois lados com dinamômetro, mede a mobilidade e olha o histórico de lesões. O Dr. Carlos é especialista em reabilitação de joelho, inclusive recuperação de LCA.',
    'Ombro':'Avaliação de força, mobilidade e histórico de lesões, para tratar e para planejar o retorno ao esporte. Reabilitação de ombro é uma das especialidades do Dr. Carlos.',
    'Coluna':'Antes de qualquer conduta, uma avaliação completa. A clínica trabalha também com RPG, terapia manual, osteopatia e quiropraxia, de forma individualizada.',
    'Tornozelo':'A avaliação reúne teste de força com dinamômetro, comparação entre os lados, mobilidade e histórico de lesões, para o plano partir de número.',
    'Quadril':'A avaliação reúne teste de força com dinamômetro, comparação entre os lados, mobilidade e histórico de lesões, para o plano partir de número.',
    'Pós-cirúrgico':'Reabilitação pós-operatória com acompanhamento individualizado, do joelho ao ombro e à coluna, até o retorno às atividades.'
  };
  var steps=[
    {q:'Onde dói?',o:['Joelho','Ombro','Coluna','Tornozelo','Quadril','Pós-cirúrgico']},
    {q:'Há quanto tempo?',o:['Poucos dias','Semanas','Meses','Mais de um ano']},
    {q:'Quando aparece?',o:['Treinando','Parado','Dia a dia','Pós-cirurgia']}
  ];
  var elQ=$('#tri-q'),elBars=$$('#tri-steps i'),elNext=$('#tri-next'),elBack=$('#tri-back'),f=$('#ficha');
  function build(){
    $$('.arc-it',box).forEach(function(e){e.remove()});items=[];
    steps[step].o.forEach(function(t,i){var b=document.createElement('button');b.type='button';b.className='arc-it';b.setAttribute('role','option');b.setAttribute('data-i',i);b.textContent=t;box.appendChild(b);items.push(b);b.addEventListener('click',function(e){if(e.detail===0)goTo(i)})});
    N=items.length;rot=0;sel=-1;layout();
  }
  function W(){return box.clientWidth}
  function layout(){
    var cx=W()/2,cy=TOPY+R;
    items.forEach(function(el,i){
      var ph=(i-rot)*STEP,a=ph*Math.PI/180,x=cx+R*Math.sin(a),y=cy-R*Math.cos(a);
      var s=clamp(1-Math.abs(ph)/150,.5,1),o=clamp(1-Math.abs(ph)/78,0,1);
      el.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) translate(-50%,-50%) rotate('+ph.toFixed(1)+'deg) scale('+s.toFixed(3)+')';
      el.style.opacity=o.toFixed(2);el.style.pointerEvents=o<.25?'none':'auto';
    });
    var ns=clamp(Math.round(rot),0,N-1);
    if(ns!==sel){sel=ns;items.forEach(function(el,i){el.classList.toggle('sel',i===sel);el.setAttribute('aria-selected',i===sel)});if(!done)preview()}
    placeFrame();
  }
  function placeFrame(){
    var it=items[sel];if(!it)return;
    var w=it.offsetWidth*(1-Math.abs((sel-rot))*.0)+28,cx=W()/2;
    frame.style.width=w+'px';frame.style.left=(cx-w/2)+'px';frame.style.top=(TOPY-34)+'px';frame.style.height='68px';
  }
  function swap(){f.classList.remove('swap');void f.offsetWidth;f.classList.add('swap')}
  function sum(list){var u=$('#f-sum');u.innerHTML='';list.forEach(function(r){var li=document.createElement('li');li.innerHTML='<span></span><b></b>';li.firstChild.textContent=r[0];li.lastChild.textContent=r[1];u.appendChild(li)});u.hidden=!list.length}
  function preview(){
    var cur=steps[step].o[sel];
    $('#f-k').textContent='Passo '+(step+1)+' de 3';$('#f-t').textContent=cur;
    $('#f-p').textContent=step===0?info[cur]:'Confirme para seguir. Isso ajuda o fisioterapeuta a entender o seu caso.';
    $('#f-wa').hidden=true;
    sum(ans.map(function(a,i){return [steps[i].q,a]}));swap();
  }
  function head(){
    elQ.textContent=(step+1)+' de 3: '+steps[step].q;
    elBars.forEach(function(b,i){b.className=i<step?'ok':(i===step?'now':'')});
    elBack.hidden=step===0&&!done;
  }
  function finish(){
    done=true;elNext.hidden=true;box.hidden=true;$('#tri-done').hidden=false;
    elBars.forEach(function(b){b.className='ok'});elQ.textContent='3 de 3 respondidas';
    var reg=ans[0];
    $('#f-k').textContent='Resultado da triagem';$('#f-t').textContent=reg;
    $('#f-p').textContent=(info[reg]||'')+' Com o que você respondeu, a mensagem já vai pronta para a clínica.';
    sum([['Onde',ans[0]],['Há quanto tempo',ans[1]],['Quando aparece',ans[2]]]);
    var msg='Oi! Vim do biolink da CF Fisioterapia e fiz a triagem.\n\n*Região:* '+ans[0]+'\n*Há quanto tempo:* '+ans[1]+'\n*Quando aparece:* '+ans[2]+'\n\nQuero agendar uma avaliação.';
    var url='https://wa.me/'+CF.wa+'?text='+encodeURIComponent(msg);
    $('#tri-send').href=url;$('#f-wa').hidden=true;
    f.classList.add('done');swap();head();elQ.textContent='3 de 3 respondidas';elBars.forEach(function(b){b.className='ok'});elBack.hidden=false;
  }
  function next(){
    ans[step]=steps[step].o[sel];
    if(step<2){step++;head();build();preview()}else finish();
  }
  function reset(){step=0;ans=[];done=false;box.hidden=false;$('#tri-done').hidden=true;box.classList.remove('off');elNext.hidden=false;f.classList.remove('done');head();build()}
  elNext.addEventListener('click',next);elBack.addEventListener('click',reset);
  function animate(){
    if(!dragging){
      var target=clamp(Math.round(rot+vel*.18),0,N-1);vel*=.9;
      rot+=(target-rot)*.14+(Math.abs(vel)>.01?vel*.016:0);
    }
    layout();
    if(dragging||Math.abs(Math.round(clamp(rot,0,N-1))-rot)>.002||Math.abs(vel)>.01)raf=requestAnimationFrame(animate);else{raf=0;rot=clamp(Math.round(rot),0,N-1);layout()}
  }
  function kick(){if(!raf)raf=requestAnimationFrame(animate)}
  var moved=0,ptgt=null;
  function goTo(i){vel=0;(function go(){var d=i-rot;if(Math.abs(d)>.01){rot+=d*.2;layout();requestAnimationFrame(go)}else{rot=i;layout()}})()}
  box.addEventListener('pointerdown',function(e){if(done)return;ptgt=e.target.closest('.arc-it');dragging=true;moved=0;sx=e.clientX;sr=rot;lx=e.clientX;lt=performance.now();vel=0;try{box.setPointerCapture(e.pointerId)}catch(_){}kick()});
  box.addEventListener('pointermove',function(e){
    if(!dragging)return;
    var px=R*STEP*Math.PI/180;moved=Math.max(moved,Math.abs(e.clientX-sx));
    var r=sr-(e.clientX-sx)/px;rot=r<0?-damp(-r,.4):(r>N-1?N-1+damp(r-(N-1),.4):r);
    var now=performance.now(),dt=Math.max(1,now-lt);vel=vel*.6+(-(e.clientX-lx)/px/dt*1000)*.4;lx=e.clientX;lt=now;
  });
  function end(){if(!dragging)return;dragging=false;if(moved<6&&ptgt){goTo(+ptgt.getAttribute('data-i'))}ptgt=null;kick()}
  box.addEventListener('pointerup',end);box.addEventListener('pointercancel',end);
  box.addEventListener('keydown',function(e){
    if(done)return;
    if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();rot=clamp(Math.round(rot)+1,0,N-1);kick()}
    if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();rot=clamp(Math.round(rot)-1,0,N-1);kick()}
    if(e.key==='Enter'){e.preventDefault();next()}
  });
  addEventListener('resize',layout);
  head();build();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){layout()});
  var inv=false,io=new IntersectionObserver(function(es){if(es[0].isIntersecting&&!inv){inv=true;if(reduce)return;rot=1.2;kick()}},{threshold:.6});io.observe(box);
}

/* do lance ao campo */
function initSteps(){
  var wrap=$('#steps'),steps=$$('.step',wrap),base=$('#stbase'),line=$('#stline'),L=0,ys=[];
  function build(){
    ys=steps.map(function(s){return s.offsetTop+16});
    var d='M22 '+ys[0];
    for(var i=1;i<ys.length;i++){var a=ys[i-1],b=ys[i],h=b-a;d+=' C '+(i%2?2:42)+' '+(a+h/3)+' '+(i%2?42:2)+' '+(a+2*h/3)+' 22 '+b}
    base.setAttribute('d',d);line.setAttribute('d',d);L=line.getTotalLength();line.style.strokeDasharray=L;upd();
  }
  var t=false;
  function upd(){
    t=false;var r=wrap.getBoundingClientRect(),drawn=innerHeight*.62-r.top,y0=ys[0],yN=ys[ys.length-1];
    var f=clamp((drawn-y0)/(yN-y0),0,1);line.style.strokeDashoffset=L*(1-f);
    steps.forEach(function(s,i){s.classList.toggle('lit',drawn>=ys[i])});
  }
  addEventListener('scroll',function(){if(!t){t=true;requestAnimationFrame(upd)}},{passive:true});addEventListener('resize',build);
  build();setTimeout(build,600);
}

/* cases */
function initCases(){
  var list=$$('.case'),fl=$('#cfloat'),im=$('img',fl),fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  var tx=0,ty=0,cx=0,cy=0,run=false;
  function loop(){cx+=(tx-cx)*.16;cy+=(ty-cy)*.16;fl.style.transform='translate('+(cx+24)+'px,'+(cy-120)+'px) rotate('+clamp((tx-cx)*.06,-6,6)+'deg)';if(run)requestAnimationFrame(loop)}
  list.forEach(function(c){
    var row=$('.case-row',c);
    if(fine){
      c.addEventListener('pointerenter',function(e){im.src=c.getAttribute('data-img');tx=cx=e.clientX;ty=cy=e.clientY;fl.classList.add('show');if(!run){run=true;loop()}});
      c.addEventListener('pointermove',function(e){tx=e.clientX;ty=e.clientY});
      c.addEventListener('pointerleave',function(){fl.classList.remove('show');run=false});
    }
    row.addEventListener('click',function(){var o=!c.classList.contains('open');list.forEach(function(x){x.classList.remove('open');$('.case-row',x).setAttribute('aria-expanded','false')});if(o){c.classList.add('open');row.setAttribute('aria-expanded','true')}});
  });
}

/* serviços + brilho que segue o dedo */
function initSvcs(){
  var cards=$$('.svc'),pointer=null,idle=0;
  cards.forEach(function(c,i){
    var h=$('.svc-head',c);
    h.addEventListener('click',function(){
      var open=!c.classList.contains('open');
      cards.forEach(function(x){x.classList.remove('open');$('.svc-head',x).setAttribute('aria-expanded','false')});
      if(open){c.classList.add('open');h.setAttribute('aria-expanded','true')}
    });
  });
  function glow(x,y){
    cards.forEach(function(c){
      var r=c.getBoundingClientRect(),inx=x>r.left-64&&x<r.right+64,iny=y>r.top-64&&y<r.bottom+64;
      if(inx&&iny){
        var ccx=r.left+r.width/2,ccy=r.top+r.height/2;
        c.style.setProperty('--ga',(Math.atan2(y-ccy,x-ccx)*180/Math.PI+90)+'deg');
        c.style.setProperty('--gx',(x-r.left)+'px');c.style.setProperty('--gy',(y-r.top)+'px');c.style.setProperty('--go','1');
      }else c.style.setProperty('--go',c.classList.contains('open')?'.55':'0');
    });
  }
  addEventListener('pointermove',function(e){pointer={x:e.clientX,y:e.clientY};idle=0;glow(e.clientX,e.clientY)},{passive:true});
  addEventListener('pointerdown',function(e){pointer={x:e.clientX,y:e.clientY};idle=0;glow(e.clientX,e.clientY)},{passive:true});
  addEventListener('pointerup',function(){setTimeout(function(){pointer=null;cards.forEach(function(c){c.style.setProperty('--go',c.classList.contains('open')?'.55':'0')})},700)});
  var a=0;
  (function spin(){a=(a+1.2)%360;cards.forEach(function(c){if(!pointer&&c.classList.contains('open')){c.style.setProperty('--ga',a+'deg');c.style.setProperty('--go','.55')}});requestAnimationFrame(spin)})();
}

/* cartão 3D do Dr. Carlos */
function initTilt(){
  var box=$('#tilt'),in_=$('.tilt-in',box),active=false,t0=performance.now(),visible=false;
  box.addEventListener('pointermove',function(e){
    var r=box.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
    active=true;in_.style.setProperty('--ry',((px-.5)*16)+'deg');in_.style.setProperty('--rx',((.5-py)*12)+'deg');
    in_.style.setProperty('--sx',(px*100)+'%');in_.style.setProperty('--sy',(py*100)+'%');in_.style.setProperty('--so','1');
  });
  function leave(){active=false;in_.style.setProperty('--so','0')}
  box.addEventListener('pointerleave',leave);box.addEventListener('pointerup',function(){setTimeout(leave,500)});box.addEventListener('pointercancel',leave);
  new IntersectionObserver(function(es){visible=es[0].isIntersecting}).observe(box);
  if(!reduce)(function idle(now){
    if(!active&&visible){var t=(now-t0)/1000;in_.style.setProperty('--ry',(Math.sin(t*.9)*4.5)+'deg');in_.style.setProperty('--rx',(Math.cos(t*.7)*3)+'deg');in_.style.setProperty('--sx',(50+Math.sin(t*.9)*30)+'%');in_.style.setProperty('--sy','30%');in_.style.setProperty('--so','.8')}
    requestAnimationFrame(idle)})(performance.now());
}

/* avaliações */
function initReviews(){
  var view=$('#revview'),track=$('#revtrack'),cards=$$('.rev',track),bar=$('#revbar'),sc=$('#score');
  var idx=0,x=0,dragging=false,sx=0,sxx=0,vx=0,lx=0,lt=0,paused=false,vis=false,t0=performance.now(),DUR=5200;
  function stepW(){return cards[0].offsetWidth+12}
  function maxX(){return Math.max(0,track.scrollWidth-view.clientWidth+44)}
  function go(i,anim){idx=(i+cards.length)%cards.length;x=Math.min(idx*stepW(),maxX());track.style.transition=anim===false?'none':'transform .6s cubic-bezier(.2,.8,.2,1)';track.style.transform='translateX('+(-x)+'px)';t0=performance.now()}
  view.addEventListener('pointerdown',function(e){dragging=true;paused=true;sx=e.clientX;sxx=x;lx=e.clientX;lt=performance.now();vx=0;track.style.transition='none';try{view.setPointerCapture(e.pointerId)}catch(_){}});
  view.addEventListener('pointermove',function(e){if(!dragging)return;var nx=sxx-(e.clientX-sx);x=nx<0?-damp(-nx,60):(nx>maxX()?maxX()+damp(nx-maxX(),60):nx);track.style.transform='translateX('+(-x)+'px)';var n=performance.now();vx=vx*.6+((e.clientX-lx)/Math.max(1,n-lt))*.4;lx=e.clientX;lt=n});
  function end(){if(!dragging)return;dragging=false;var i=Math.round((x-vx*220)/stepW());go(clamp(i,0,cards.length-1));setTimeout(function(){paused=false;t0=performance.now()},400)}
  view.addEventListener('pointerup',end);view.addEventListener('pointercancel',end);
  new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis){t0=performance.now()}},{threshold:.35}).observe(view);
  (function tick(now){
    if(vis&&!paused&&!reduce){var f=(now-t0)/DUR;bar.style.width=Math.min(100,f*100)+'%';if(f>=1)go(idx+1)}
    else if(!vis||reduce){bar.style.width='0%'}
    requestAnimationFrame(tick)})(performance.now());
  addEventListener('resize',function(){go(idx,false)});
  var did=false;new IntersectionObserver(function(es){if(es[0].isIntersecting&&!did){did=true;var s=performance.now();(function c(n){var t=clamp((n-s)/1500,0,1),e=1-Math.pow(1-t,3);sc.textContent=fmt(5*e);if(t<1)requestAnimationFrame(c)})(s)}},{threshold:.5}).observe(sc);
}

/* chat do FAQ */
function initChat(){
  var log=$('#chatlog'),chips=$$('.chip'),busy=false;
  function bottom(){log.scrollTop=log.scrollHeight}
  chips.forEach(function(c){c.addEventListener('click',function(){
    if(busy)return;busy=true;c.classList.add('done');var d=CF.faq[+c.getAttribute('data-q')];
    var me=document.createElement('div');me.className='msg me';me.innerHTML='<p></p>';me.firstChild.textContent=d.q;log.appendChild(me);bottom();
    var ty=document.createElement('div');ty.className='msg bot';ty.innerHTML='<img src="assets/logo-claro.webp" alt=""><div class="typing"><i></i><i></i><i></i></div>';
    setTimeout(function(){log.appendChild(ty);bottom();},300);
    setTimeout(function(){
      ty.innerHTML='<img src="assets/logo-claro.webp" alt=""><p></p>';var p=ty.querySelector('p'),i=0;
      if(reduce){p.textContent=d.a;busy=false;bottom();return}
      (function type(){i=Math.min(d.a.length,i+2);p.textContent=d.a.slice(0,i);bottom();if(i<d.a.length)setTimeout(type,18);else busy=false})();
    },1250);
  })});
}

/* horário de hoje */
function initHours(){
  var d=new Date(),wd;
  try{wd={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'America/Fortaleza'}).format(d)]}catch(e){wd=d.getDay()}
  var el=$('#hours [data-d="'+wd+'"]');if(el)el.classList.add('today');
}
})();
