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
    if(on)return;
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

  var btn,pending=false;
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

    // on by default; only a visitor's own mute keeps it off
    if(saved()!=='off')autoStart();

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
   visitor prefers reduced motion. The car image is assets/drift-car.png. */
(function(){
  'use strict';
  var GAP=15000,DUR=3600,SRC='assets/drift-car.png';
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce)return;
  var last=Date.now(),busy=false,layer,car,cv,cx,img,sprite;

  function build(){
    layer=document.createElement('div');
    layer.setAttribute('aria-hidden','true');
    layer.style.cssText='position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:700;display:none';
    cv=document.createElement('canvas');
    cv.style.cssText='position:absolute;inset:0;width:100%;height:100%';
    car=document.createElement('img');
    car.alt='';car.decoding='async';car.src=SRC;
    car.style.cssText='position:absolute;left:0;top:0;height:auto;will-change:transform;transform-origin:56% 78%;filter:drop-shadow(0 18px 22px rgba(0,0,0,.6))';
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
    if(!car.complete||!car.naturalWidth)return;               // image not ready yet: try again on the next scroll
    busy=true;last=Date.now();
    var vw=window.innerWidth,vh=window.innerHeight;
    var w=Math.max(230,Math.min(vw*(vw<700?.7:.42),560)),h=w*car.naturalHeight/car.naturalWidth;
    var dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=vw*dpr;cv.height=vh*dpr;cx.setTransform(dpr,0,0,dpr,0,0);
    car.style.width=w+'px';
    var baseY=vh-h-Math.max(24,vh*.1);
    layer.style.display='block';
    var k=Math.min(1,w/520),snd=sfx(),parts=[],t0=performance.now(),prev=t0;
    function frame(now){
      var p=Math.min(1,(now-t0)/DUR),dt=Math.min(.05,(now-prev)/1000);prev=now;
      var e=p+.09*Math.sin(2*Math.PI*p);                     // fast in, hanging mid-slide, fast out
      var x=-w*1.05+(vw+w*1.6)*e;
      var ang=-7*Math.sin(Math.PI*p)+3*Math.sin(3*Math.PI*p); // drift angle with a counter-steer flick
      var y=baseY+Math.sin(p*Math.PI*6)*2;
      car.style.transform='translate3d('+x+'px,'+y+'px,0) rotate('+ang+'deg) skewX('+(-6*Math.sin(Math.PI*p))+'deg)';
      // smoke leaves the rear wheel while the car is sliding
      var sl=p>.1&&p<.9;
      if(sl){
        var rx=x+w*.31,ry=y+h*.84;
        for(var i=0;i<3;i++)parts.push({x:rx+Math.random()*20,y:ry+Math.random()*12,vx:-40-Math.random()*90,vy:-14-Math.random()*36,s:34+Math.random()*30,life:0,max:1.3+Math.random()*1.1});
      }
      cx.clearRect(0,0,vw,vh);
      for(var k=parts.length-1;k>=0;k--){
        var q=parts[k];q.life+=dt;
        if(q.life>=q.max){parts.splice(k,1);continue}
        var a=q.life/q.max;
        q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy-=6*dt;
        var s=(q.s+a*170)*k;
        cx.globalAlpha=(1-a)*(1-a)*(vw<700?.4:.5);
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
