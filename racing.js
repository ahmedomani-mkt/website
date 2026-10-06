/* Site effect switches (set from the admin panel's "المؤثرات" card). The last
   known values are cached in localStorage so the next page load already obeys them. */
(function(){
  var K='ao_fx',st={music:true,drift:true};
  try{var s=JSON.parse(localStorage.getItem(K)||'{}');if(s.music===false)st.music=false;if(s.drift===false)st.drift=false}catch(e){}
  window.RaceFX={
    music:function(){return st.music},drift:function(){return st.drift},
    set:function(t){
      if(!t)return;
      st.music=t.fx_music!=='off';st.drift=t.fx_drift!=='off';
      try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}
      if(window.RaceMusic)window.RaceMusic.setEnabled(st.music);
    }
  };
})();
/* Racing background music — a procedurally synthesised loop (Web Audio), so
   there is no audio file to license or host. It tries to start as soon as
   the page loads; browsers usually refuse sound before any interaction, so
   in that case it starts on the visitor's first tap/click/keypress instead.
   The floating button mutes/unmutes, and a mute is remembered so it stays
   off on later visits and other pages. */
(function(){
  'use strict';
  var KEY='ao_race_music';
  var BPM=140,SPB=60/BPM,S16=SPB/4;
  // A-minor drive: Am · Am · F · G, four bars = 64 sixteenth-note steps
  var ROOTS=[55,55,43.65,49];
  var ARP=[220,261.63,329.63,392,329.63,261.63,392,440];

  function makeEngine(ctx,out){
    var nb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),d=nb.getChannelData(0);
    for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;

    var delay=ctx.createDelay(1);delay.delayTime.value=SPB*.75;
    var fb=ctx.createGain();fb.gain.value=.32;
    var wet=ctx.createGain();wet.gain.value=.5;
    delay.connect(fb);fb.connect(delay);delay.connect(wet);wet.connect(out);

    function env(g,t,peak,dur){
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(peak,t+.004);
      g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    }
    function kick(t){
      var o=ctx.createOscillator(),g=ctx.createGain();
      o.frequency.setValueAtTime(155,t);o.frequency.exponentialRampToValueAtTime(42,t+.13);
      env(g,t,.95,.34);o.connect(g);g.connect(out);o.start(t);o.stop(t+.36);
    }
    function noise(t,type,freq,peak,dur){
      var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
      s.buffer=nb;f.type=type;f.frequency.value=freq;
      env(g,t,peak,dur);s.connect(f);f.connect(g);g.connect(out);s.start(t,Math.random()*.5);s.stop(t+dur+.02);
    }
    function bass(t,f){
      var o=ctx.createOscillator(),lp=ctx.createBiquadFilter(),g=ctx.createGain();
      o.type='sawtooth';o.frequency.value=f;
      lp.type='lowpass';lp.frequency.setValueAtTime(900,t);lp.frequency.exponentialRampToValueAtTime(220,t+S16);
      env(g,t,.3,S16*.95);o.connect(lp);lp.connect(g);g.connect(out);o.start(t);o.stop(t+S16);
    }
    function lead(t,f){
      var g=ctx.createGain(),lp=ctx.createBiquadFilter();
      lp.type='lowpass';lp.frequency.value=2600;
      env(g,t,.05,S16*1.6);
      [-6,6].forEach(function(det){
        var o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=det;
        o.connect(lp);o.start(t);o.stop(t+S16*1.7);
      });
      lp.connect(g);g.connect(out);g.connect(delay);
    }
    // engine rev: a rising saw sweep, once every four bars
    function rev(t){
      var o=ctx.createOscillator(),lp=ctx.createBiquadFilter(),g=ctx.createGain(),dur=SPB*2;
      o.type='sawtooth';o.frequency.setValueAtTime(58,t);o.frequency.exponentialRampToValueAtTime(340,t+dur);
      lp.type='lowpass';lp.frequency.setValueAtTime(400,t);lp.frequency.exponentialRampToValueAtTime(2200,t+dur);
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(.12,t+dur*.85);
      g.gain.exponentialRampToValueAtTime(0.0001,t+dur+.08);
      o.connect(lp);lp.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.1);
    }
    function play(step,t){
      var bar=Math.floor(step/16),s=step%16,root=ROOTS[bar];
      if(s%4===0)kick(t);
      if(s===4||s===12)noise(t,'bandpass',1900,.2,.17);
      if(s%2===1)noise(t,'highpass',7500,.07,.045);
      if(s===14)noise(t,'highpass',6500,.09,.16);
      if(s%2===0)bass(t,s%8===6?root*2:root);
      if(bar>0||s>=8)lead(t,ARP[(step+bar)%ARP.length]*(bar===2?.794:bar===3?.891:1));
      if(step===48)rev(t);
    }
    return{
      play:play,
      scheduleRange:function(fromStep,toStep,t0){ // used for offline rendering
        for(var st=fromStep;st<toStep;st++)play(st%64,t0+(st-fromStep)*S16);
      }
    };
  }

  var ctx,master,duck,engine,timer,nextT=0,step=0,on=false,ducked=false;

  function build(){
    var AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return false;
    ctx=new AC();
    master=ctx.createGain();master.gain.value=0;
    duck=ctx.createGain();duck.gain.value=1;
    var comp=ctx.createDynamicsCompressor();
    comp.threshold.value=-16;comp.ratio.value=5;comp.attack.value=.004;comp.release.value=.18;
    var tone=ctx.createBiquadFilter();tone.type='lowpass';tone.frequency.value=9000;
    engine=makeEngine(ctx,master);
    master.connect(duck);duck.connect(comp);comp.connect(tone);tone.connect(ctx.destination);
    return true;
  }
  function pump(){
    while(nextT<ctx.currentTime+.14){engine.play(step,nextT);nextT+=S16;step=(step+1)%64}
  }
  function start(){
    if(on||!enabled)return;
    if(!ctx&&!build())return;
    on=true;
    var go=function(){
      nextT=ctx.currentTime+.06;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value,ctx.currentTime);
      master.gain.linearRampToValueAtTime(.55,ctx.currentTime+1.2);
      clearInterval(timer);timer=setInterval(pump,25);
    };
    if(ctx.state==='suspended')ctx.resume().then(go);else go();
    save('on');render();
  }
  function stop(){
    if(!on)return;
    on=false;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value,ctx.currentTime);
    master.gain.linearRampToValueAtTime(0,ctx.currentTime+.5);
    setTimeout(function(){if(!on){clearInterval(timer);ctx.suspend()}},600);
    save('off');render();
  }
  function save(v){try{localStorage.setItem(KEY,v)}catch(e){}}
  function saved(){try{return localStorage.getItem(KEY)}catch(e){return null}}

  var btn,pending=false,enabled=!window.RaceFX||window.RaceFX.music();
  function render(){
    if(!btn)return;
    btn.setAttribute('aria-pressed',on?'true':'false');
    btn.setAttribute('aria-label',on?'كتم الموسيقى':'تشغيل الصوت');
    btn.querySelector('.rs-label').textContent=on?'كتم الموسيقى':'تشغيل الصوت';
    btn.classList.toggle('nudge',!on&&pending);
  }
  var GESTURES=['pointerdown','touchend','click','keydown'];
  function arm(){
    pending=true;render();
    var fire=function(e){
      if(e.target&&e.target.closest&&e.target.closest('.race-sound'))return; // the button handles itself
      GESTURES.forEach(function(g){document.removeEventListener(g,fire,true)});
      pending=false;start();
    };
    GESTURES.forEach(function(g){document.addEventListener(g,fire,true)});
  }
  function autoStart(){
    if(!build())return;
    if(ctx.state==='running')start();else arm();
  }
  function mount(){
    btn=document.createElement('button');
    btn.type='button';btn.className='race-sound';
    btn.innerHTML='<span class="rs-bars"><i></i><i></i><i></i><i></i></span><i class="bi bi-volume-mute-fill rs-mute"></i><span class="rs-label"></span>';
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      if(on){stop()}else{pending=false;start()}
    });
    document.body.appendChild(btn);
    render();

    if(!enabled)btn.style.display='none';
    // on by default; only a visitor's own mute keeps it off
    if(saved()!=='off'&&enabled)autoStart();

    document.addEventListener('visibilitychange',function(){
      if(!ctx||!on)return;
      if(document.hidden)ctx.suspend();else ctx.resume();
    });
    // duck the music while a video modal is playing its own sound
    var vm=document.getElementById('vidModal');
    if(vm&&window.MutationObserver){
      new MutationObserver(function(){
        var open=vm.classList.contains('open');
        if(!ctx||open===ducked)return;
        ducked=open;
        duck.gain.cancelScheduledValues(ctx.currentTime);
        duck.gain.linearRampToValueAtTime(open?0:1,ctx.currentTime+.4);
      }).observe(vm,{attributes:true,attributeFilter:['class']});
    }
  }

  window.RaceMusic={_makeEngine:makeEngine,start:start,stop:stop,
    // admin switch: hides the button and silences the loop without touching the visitor's own mute choice
    setEnabled:function(e){
      enabled=!!e;
      if(btn)btn.style.display=enabled?'':'none';
      if(!enabled&&on){
        on=false;master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setValueAtTime(master.gain.value,ctx.currentTime);
        master.gain.linearRampToValueAtTime(0,ctx.currentTime+.4);
        setTimeout(function(){if(!on){clearInterval(timer);ctx.suspend()}},500);render();
      }
    },
    isOn:function(){return on&&!!ctx&&ctx.state==='running'},
    ctx:function(){return ctx},
    // dip the music for `sec` seconds so a sound effect can stand out
    dip:function(sec){
      if(!ctx||!duck||ducked)return;
      var t=ctx.currentTime;
      duck.gain.cancelScheduledValues(t);duck.gain.setValueAtTime(duck.gain.value,t);
      duck.gain.linearRampToValueAtTime(.3,t+.3);
      duck.gain.linearRampToValueAtTime(1,t+sec);
    }};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

/* Logos: recolour the dark artwork to white while keeping its red mark. Works on any
   logo the CMS sets (canvas read of a CORS image); if the browser refuses pixel
   access it falls back to a plain white CSS filter. Runs on every page. */
(function(){
  'use strict';
  function whitenLogo(im){
    function run(){
      var src=im.getAttribute('src')||'';
      if(!src||src.indexOf('data:')===0||im.dataset.whiteFor===src)return;
      var i2=new Image();i2.crossOrigin='anonymous';
      i2.onload=function(){
        try{
          var w=Math.min(900,i2.naturalWidth),h=Math.round(i2.naturalHeight*w/i2.naturalWidth);
          var c=document.createElement('canvas');c.width=w;c.height=h;
          var x=c.getContext('2d');x.drawImage(i2,0,0,w,h);
          var d=x.getImageData(0,0,w,h),a=d.data;
          for(var i=0;i<a.length;i+=4){
            if(a[i+3]<8)continue;
            var r=a[i],g=a[i+1],b=a[i+2];
            if(!(r>110&&r>g*1.5&&r>b*1.5)){a[i]=255;a[i+1]=255;a[i+2]=255}
          }
          x.putImageData(d,0,0);
          im.dataset.whiteFor=src;
          im.src=c.toDataURL('image/png');
        }catch(e){im.style.filter='brightness(0) invert(1)'}
      };
      i2.onerror=function(){im.style.filter='brightness(0) invert(1)'};
      i2.src=src;
    }
    run();
    if(window.MutationObserver)new MutationObserver(run).observe(im,{attributes:true,attributeFilter:['src']});
  }
  function init(){['navLogoImg','ftLogoImg'].forEach(function(id){var im=document.getElementById(id);if(im)whitenLogo(im)})}
  window.whitenLogo=whitenLogo;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* Drift pass — every ~15 s of scrolling a drift car slides across the screen
   trailing tyre smoke, with a synthesised engine + tyre-screech that pans with
   the car. The sound follows the music's mute button; motion is skipped when the
   visitor prefers reduced motion. The car is an inline SVG drawn in the site's colours. */
(function(){
  'use strict';
  var GAP=15000,DUR=3600;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce)return;

  // Nissan Skyline GT-R (R34) side profile, facing right — boxy notchback, flat roof,
  // tall GT wing, carbon vented hood, front-fender vent, gold multi-spoke wheels.
  var CAR_SVG='<svg viewBox="0 0 600 200" width="100%" style="display:block;overflow:visible" xmlns="http://www.w3.org/2000/svg">'
  +'<defs>'
  +'<linearGradient id="dcBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4a3a"/><stop offset=".55" stop-color="#d40000"/><stop offset="1" stop-color="#680000"/></linearGradient>'
  +'<linearGradient id="dcGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22394a"/><stop offset="1" stop-color="#04070b"/></linearGradient>'
  +'<linearGradient id="dcCarbon" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1b1b1b"/><stop offset="1" stop-color="#050505"/></linearGradient>'
  +'<radialGradient id="dcRim" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#f3d27a"/><stop offset="1" stop-color="#9a7420"/></radialGradient>'
  +'<radialGradient id="dcGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#04F06A" stop-opacity=".55"/><stop offset="1" stop-color="#04F06A" stop-opacity="0"/></radialGradient>'
  +'<clipPath id="dcArch"><rect x="0" y="0" width="600" height="176"/></clipPath>'
  +'</defs>'
  +'<ellipse cx="300" cy="188" rx="295" ry="15" fill="url(#dcGlow)"/>'
  +'<ellipse cx="300" cy="188" rx="262" ry="6" fill="#000" opacity=".55"/>'
  // GT wing: stands, blade, end-plate
  +'<path d="M72 112 L68 76 M104 108 L102 76" stroke="#0d0d0d" stroke-width="5" fill="none"/>'
  +'<path d="M26 62 L118 58 L118 68 L28 72 Z" fill="url(#dcCarbon)"/><path d="M26 62 L118 58" stroke="#04F06A" stroke-width="2"/>'
  +'<path d="M112 54 L124 54 L124 78 L112 78 Z" fill="#0d0d0d"/>'
  // body
  +'<path d="M52 174 L46 134 Q46 114 60 112 L120 106 Q146 104 162 92 L212 48 Q218 44 232 44 L322 44 Q334 44 342 52 L396 94 L470 102 Q522 108 546 126 L558 146 L558 168 Q558 174 546 176 Z" fill="url(#dcBody)"/>'
  +'<path d="M162 92 L212 48 Q218 44 232 44 L322 44 Q334 44 342 52 L396 94" fill="none" stroke="#ff9a8a" stroke-width="1.5" opacity=".65"/>'
  // carbon vented hood
  +'<path d="M396 94 L470 102 Q522 108 546 126 L500 126 Q470 112 396 104 Z" fill="url(#dcCarbon)"/>'
  +'<path d="M430 100 L456 103 M440 104 L464 107" stroke="#04F06A" stroke-width="1.6" opacity=".8"/>'
  // glass: side window + B-pillar
  +'<path d="M170 96 L216 54 L320 54 L384 94 Z" fill="url(#dcGlass)"/>'
  +'<path d="M270 54 L272 95" stroke="#8f0000" stroke-width="6"/>'
  +'<path d="M222 58 L246 58 L208 94 L186 94 Z" fill="#fff" opacity=".07"/>'
  // stripe, door cuts, handle, livery text
  +'<path d="M52 140 L548 134" stroke="#fff" stroke-width="6" fill="none"/><path d="M52 147 L548 141" stroke="#04F06A" stroke-width="2.4" fill="none"/>'
  +'<path d="M272 98 L270 166 M368 96 L370 166" stroke="#000" stroke-opacity=".38" stroke-width="1.6" fill="none"/>'
  +'<rect x="236" y="106" width="20" height="4" rx="2" fill="#000" opacity=".4"/>'
  +'<text x="284" y="162" direction="ltr" text-anchor="start" font-family="Archivo,Arial,sans-serif" font-weight="800" font-size="11" letter-spacing="2.4" fill="#fff" opacity=".92">AHMED OMANI</text>'
  // front-fender vent
  +'<path d="M404 116 L428 118 M402 123 L428 125 M400 130 L426 132" stroke="#000" stroke-width="3" stroke-linecap="round" opacity=".75"/>'
  // sill, tail-light, headlight, bumper intake, mirror
  +'<path d="M186 166 L414 166 L410 176 L190 176 Z" fill="#0b0b0b"/>'
  +'<rect x="45" y="122" width="9" height="14" rx="2" fill="#ff2a2a"/><rect x="45" y="122" width="9" height="14" rx="2" fill="#ff2a2a" opacity=".6" style="filter:blur(4px)"/>'
  +'<path d="M518 110 L548 124 L541 132 L510 118 Z" fill="#fff8d8"/><path d="M518 110 L548 124 L541 132 L510 118 Z" fill="#fff8d8" opacity=".7" style="filter:blur(5px)"/>'
  +'<path d="M512 146 L558 146 L558 164 L520 164 Z" fill="#0b0b0b"/><path d="M518 152 L556 152 M520 158 L556 158" stroke="#2a2a2a" stroke-width="2"/>'
  +'<path d="M374 92 L392 90 L390 99 L376 101 Z" fill="#8f0000"/>'
  // wheels
  +'<g clip-path="url(#dcArch)"><circle cx="150" cy="154" r="43" fill="#05070a"/><circle cx="450" cy="154" r="43" fill="#05070a"/></g>'
  +WHEEL(150,154,1)+WHEEL(450,154,.86)
  +'</svg>';
  function WHEEL(cx,cy,sx){
    var sp='';for(var i=0;i<10;i++)sp+='<line x1="0" y1="0" x2="0" y2="-24" stroke="#5c4310" stroke-width="3.2" stroke-linecap="round" transform="rotate('+(i*36)+')"/>';
    return '<g transform="translate('+cx+' '+cy+') scale('+sx+' 1)"><circle r="36" fill="#0b0b0b" stroke="#2b2b2b" stroke-width="3"/><circle r="26" fill="url(#dcRim)"/>'
      +'<g class="dc-spin">'+sp+'<circle r="7" fill="#1a1a1a"/><circle r="2.6" fill="#ff2a2a"/></g><circle r="26" fill="none" stroke="#fff3c4" stroke-opacity=".7" stroke-width="1.5"/></g>';
  }
  var last=Date.now(),busy=false,layer,car,cv,cx,sprite;

  function build(){
    if(!document.getElementById('dcStyle')){var st=document.createElement('style');st.id='dcStyle';st.textContent='.dc-spin{transform-box:fill-box;transform-origin:center;animation:dcspin .18s linear infinite}@keyframes dcspin{to{transform:rotate(360deg)}}';document.head.appendChild(st)}
    layer=document.createElement('div');
    layer.setAttribute('aria-hidden','true');
    layer.style.cssText='position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:700;display:none';
    cv=document.createElement('canvas');
    cv.style.cssText='position:absolute;inset:0;width:100%;height:100%';
    car=document.createElement('div');
    car.innerHTML=CAR_SVG;
    car.style.cssText='position:absolute;left:0;top:0;will-change:transform;transform-origin:56% 78%';
    layer.appendChild(cv);layer.appendChild(car);document.body.appendChild(layer);
    cx=cv.getContext('2d');
    // one soft white puff, reused for every smoke particle
    sprite=document.createElement('canvas');sprite.width=sprite.height=96;
    var g=sprite.getContext('2d'),gr=g.createRadialGradient(48,48,0,48,48,48);
    gr.addColorStop(0,'rgba(235,235,240,.9)');gr.addColorStop(.45,'rgba(200,200,210,.4)');gr.addColorStop(1,'rgba(180,180,190,0)');
    g.fillStyle=gr;g.fillRect(0,0,96,96);
  }

  /* ── sound ── */
  function sfx(){
    var RM=window.RaceMusic;
    if(!RM||!RM.isOn())return null;
    var ctx=RM.ctx(),t=ctx.currentTime;
    var out=ctx.createGain();out.gain.value=0;
    var pan=ctx.createStereoPanner?ctx.createStereoPanner():null;
    if(pan){out.connect(pan);pan.connect(ctx.destination)}else out.connect(ctx.destination);
    // engine: two detuned saws + a sub square through a moving low-pass
    var lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=4;
    var o1=ctx.createOscillator(),o2=ctx.createOscillator(),o3=ctx.createOscillator();
    o1.type='sawtooth';o2.type='sawtooth';o3.type='square';o2.detune.value=14;
    var eg=ctx.createGain();eg.gain.value=.5;
    [o1,o2,o3].forEach(function(o){o.connect(lp);o.start(t)});
    lp.connect(eg);eg.connect(out);
    // tyre screech: noise through a wobbling band-pass
    var nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=nb.getChannelData(0);
    for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    var ns=ctx.createBufferSource();ns.buffer=nb;ns.loop=true;
    var bp=ctx.createBiquadFilter();bp.type='bandpass';bp.Q.value=7;bp.frequency.value=2400;
    var sg=ctx.createGain();sg.gain.value=0;
    ns.connect(bp);bp.connect(sg);sg.connect(out);ns.start(t);
    var ns2=ctx.createBufferSource();ns2.buffer=nb;ns2.loop=true;
    var hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=5200;
    var hg=ctx.createGain();hg.gain.value=0;
    ns2.connect(hp);hp.connect(hg);hg.connect(out);ns2.start(t,.7);
    RM.dip(DUR/1000+1);
    return{
      set:function(p){
        var n=ctx.currentTime,gear=Math.min(2,Math.floor(p*3)),gp=p*3-gear;
        var dop=1.12-.24*p;                                  // approaching = higher, leaving = lower
        var f=(62+gear*16+gp*(150+gear*30))*dop;
        [o1,o2].forEach(function(o){o.frequency.setTargetAtTime(f,n,.03)});
        o3.frequency.setTargetAtTime(f/2,n,.03);
        lp.frequency.setTargetAtTime(500+f*5,n,.05);
        var near=Math.sin(Math.PI*p);
        out.gain.setTargetAtTime(.22+.55*near,n,.05);
        if(pan)pan.pan.setTargetAtTime(-.9+1.8*p,n,.05);
        var sl=p>.14&&p<.86?Math.min(1,Math.sin(Math.PI*(p-.14)/.72)*1.6):0;   // slide phase
        sg.gain.setTargetAtTime(sl*.22,n,.06);hg.gain.setTargetAtTime(sl*.1,n,.06);
        bp.frequency.setTargetAtTime(2200+500*Math.sin(p*38)+400*sl,n,.04);
      },
      end:function(){
        var n=ctx.currentTime;out.gain.cancelScheduledValues(n);out.gain.setTargetAtTime(0,n,.08);
        setTimeout(function(){[o1,o2,o3,ns,ns2].forEach(function(s){try{s.stop()}catch(e){}});out.disconnect()},500);
      }
    };
  }

  /* ── one pass ── */
  function play(){
    if(busy)return;
    if(!layer)build();
        busy=true;last=Date.now();
    var vw=window.innerWidth,vh=window.innerHeight;
    var w=Math.max(230,Math.min(vw*(vw<700?.7:.42),560)),h=w*200/600;
    var dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=vw*dpr;cv.height=vh*dpr;cx.setTransform(dpr,0,0,dpr,0,0);
    car.style.width=w+'px';car.style.height=h+'px';
    var baseY=vh-h-Math.max(24,vh*.1);
    layer.style.display='block';
    var sk=Math.min(1,w/520),snd=sfx(),parts=[],t0=performance.now(),prev=t0;
    function frame(now){
      var p=Math.min(1,(now-t0)/DUR),dt=Math.min(.05,(now-prev)/1000);prev=now;
      var e=p+.09*Math.sin(2*Math.PI*p);                     // fast in, hanging mid-slide, fast out
      var x=-w*1.05+(vw+w*1.6)*e;
      var ang=-2.5*Math.sin(Math.PI*p)+2*Math.sin(3*Math.PI*p); // drift angle with a counter-steer flick
      var y=baseY+Math.sin(p*Math.PI*6)*2;
      car.style.transform='translate3d('+x+'px,'+y+'px,0) rotate('+ang+'deg) skewX('+(-6*Math.sin(Math.PI*p))+'deg)';
      // smoke leaves the rear wheel while the car is sliding
      var sl=p>.1&&p<.9;
      if(sl){
        var rx=x+w*.25,ry=y+h*.93;
        for(var i=0;i<3;i++)parts.push({x:rx+Math.random()*14,y:ry-Math.random()*14,vx:-30-Math.random()*70,vy:-6-Math.random()*22,s:22+Math.random()*22,life:0,max:.7+Math.random()*.6});
      }
      cx.clearRect(0,0,vw,vh);
      for(var k=parts.length-1;k>=0;k--){
        var q=parts[k];q.life+=dt;
        if(q.life>=q.max){parts.splice(k,1);continue}
        var a=q.life/q.max;
        q.x+=q.vx*dt;q.y+=q.vy*dt;
        var s=(q.s+a*95)*sk;
        cx.globalAlpha=(1-a)*(1-a)*(vw<700?.45:.55);
        cx.drawImage(sprite,q.x-s/2,q.y-s/2,s,s);
      }
      cx.globalAlpha=1;
      if(snd){if(p<1)snd.set(p);else{snd.end();snd=null}}
      if(p<1||parts.length)requestAnimationFrame(frame);
      else{layer.style.display='none';busy=false}
    }
    requestAnimationFrame(frame);
  }

  function maybe(){
    if(busy||document.hidden||Date.now()-last<GAP)return;
    if(window.RaceFX&&!window.RaceFX.drift())return;
    var vm=document.getElementById('vidModal');
    if(vm&&vm.classList.contains('open'))return;
    play();
  }
  window.addEventListener('scroll',maybe,{passive:true});
  window.addEventListener('wheel',maybe,{passive:true});
  window.addEventListener('touchmove',maybe,{passive:true});
  // warm the image so the first pass isn't skipped
  function warm(){if(!layer)build()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',warm);else warm();
  window.RaceDrift={play:function(){last=0;play()}};
})();

/* Catalog drop-down: hover opens it on desktop (CSS); a click/tap toggles it
   instead of jumping straight to the first catalog. */
(function(){
  function init(){
    var items=document.querySelectorAll('.nav-links .has-sub');
    if(!items.length)return;
    items.forEach(function(li){
      var a=li.querySelector(':scope>a');
      a.addEventListener('click',function(e){
        e.preventDefault();
        var open=!li.classList.contains('open');
        li.classList.toggle('open',open);a.setAttribute('aria-expanded',open?'true':'false');
      });
    });
    function closeAll(){items.forEach(function(li){li.classList.remove('open');li.querySelector(':scope>a').setAttribute('aria-expanded','false')})}
    document.addEventListener('click',function(e){if(!e.target.closest||!e.target.closest('.has-sub'))closeAll()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAll()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* Published CMS pages (e.g. "من نحن") join the header + phone menu on every page,
   not just the homepage. Waits for the page's own Supabase client, skips links
   that are already there. */
(function(){
  function add(list){
    if(!list||!list.length)return;
    var nl=document.getElementById('navLinks'),mn=document.querySelector('#mobileNav ul');
    list.forEach(function(p){
      var href='page.html?slug='+encodeURIComponent(p.slug);
      [[nl,false],[mn,true]].forEach(function(t){
        var ul=t[0];
        if(!ul||ul.querySelector('a[href="'+href+'"]'))return;
        var li=document.createElement('li'),a=document.createElement('a');
        a.href=href;a.textContent=p.title;
        if(t[1]&&window.closeMenu)a.addEventListener('click',function(){window.closeMenu()});
        if(location.pathname.indexOf('page.html')>-1&&location.search.indexOf('slug='+encodeURIComponent(p.slug))>-1)a.className='active';
        li.appendChild(a);ul.appendChild(li);
      });
    });
  }
  var tries=0;
  (function wait(){
    if(window.sb&&window.sb.from){
      window.sb.from('ao_pages').select('title,slug').eq('is_published',true).order('created_at')
        .then(function(r){add(r&&r.data)},function(){});
      return;
    }
    if(++tries<40)setTimeout(wait,300);
  })();
})();

/* Meta Pixel — WhatsApp contact tracking for the pages that have no cart
   (homepage + CMS pages). Every tap on a wa.me link fires the standard
   "Contact" event plus a custom "WhatsAppClick", so Facebook ads can count
   and optimise for WhatsApp conversations. The catalog/product pages already
   fire Lead / Contact themselves, so this is skipped there. The pixel id is
   cached so the pixel starts at first paint on later visits. */
(function(){
  var K='ao_px';
  if(typeof window.pxTrack==='function')return;           // catalog + product handle their own events
  function load(id){
    if(!id||!/^[A-Za-z0-9_-]{1,64}$/.test(id)||window.fbq)return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init',id);window.fbq('track','PageView');
  }
  window.AOPixel={load:function(id){try{localStorage.setItem(K,id)}catch(e){}load(id)}};
  try{if(localStorage.getItem('ao_no_track')!=='1'){var c=localStorage.getItem(K);if(c)load(c)}}catch(e){}
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href*="wa.me/"],a[href*="api.whatsapp.com"]');
    if(!a||typeof window.fbq!=='function')return;
    try{if(localStorage.getItem('ao_no_track')==='1')return}catch(x){}
    var where=(a.closest('nav,.mobile-nav')?'nav':a.closest('footer')?'footer':a.closest('.wa-btn')?'float':'section');
    window.fbq('track','Contact',{content_name:'whatsapp',content_category:where});
    window.fbq('trackCustom','WhatsAppClick',{placement:where,page:location.pathname});
  },true);
})();
