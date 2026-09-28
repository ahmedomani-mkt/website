/* Racing background music — a procedurally synthesised loop (Web Audio), so
   there is no audio file to license or host. Browsers never allow sound to
   start by itself, so it begins when the visitor taps the button (or on
   their first tap anywhere, if they had it switched on last time). */
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

  var btn;
  function render(){
    if(!btn)return;
    btn.setAttribute('aria-pressed',on?'true':'false');
    btn.setAttribute('aria-label',on?'إيقاف موسيقى السباقات':'تشغيل موسيقى السباقات');
    btn.querySelector('.rs-label').textContent=on?'موسيقى السباقات':'شغّل الموسيقى';
  }
  function mount(){
    btn=document.createElement('button');
    btn.type='button';btn.className='race-sound';
    btn.innerHTML='<span class="rs-bars"><i></i><i></i><i></i><i></i></span><span class="rs-label"></span>';
    btn.addEventListener('click',function(e){e.stopPropagation();on?stop():start()});
    document.body.appendChild(btn);
    render();

    if(saved()==='on'){
      // they had it on last time: start on their first tap/keypress anywhere
      var arm=function(){document.removeEventListener('pointerdown',arm,true);document.removeEventListener('keydown',arm,true);start()};
      document.addEventListener('pointerdown',arm,true);document.addEventListener('keydown',arm,true);
    }else if(saved()===null){
      btn.classList.add('nudge');
    }
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

  window.RaceMusic={_makeEngine:makeEngine,start:start,stop:stop};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
