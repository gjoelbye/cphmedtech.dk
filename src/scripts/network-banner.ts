// Interactive animated network banner for CPH MedTech
// Renders the logo constellation with breathing, pulses, ripples, and data packets.
// Edit this file to change animation behavior, colors, timing, or geometry.
//
// Usage: import and call initNetworkBanner('canvas-id') with the ID of a <canvas> element.

export function initNetworkBanner(canvasId: string) {
    'use strict';
    try { // global error handler

    /* ============================================================
       CONSTANTS & GEOMETRY
       ============================================================ */
    const IW = 3000, IH = 600;
    const LS = 0.68; // logo scale
    const LC = { x: 1500, y: 135 };
    const LNR = 18.17 * LS; // logo node radius in internal coords
    const LOGO_N = 15;
    const TAU = Math.PI * 2;

    const DOTS = [
      [454.33,132.67],[598.83,202.17],[612.5,323.83],[800.5,276.83],
      [372.83,337.5],[156.5,372.5],[325.83,514.17],[234.5,613.17],
      [181.17,836.5],[500.83,794.17],[714.5,806.83],[347.5,841.17],
      [567.83,707.17],[736.83,594.83],[869.83,413.83]
    ];
    const LEDGES = [
      [0,1],[0,4],[0,5],[1,2],[1,4],[1,6],[1,13],[2,4],
      [3,4],[3,12],[3,13],[3,14],[4,5],[4,7],[5,7],[5,8],
      [6,7],[7,8],[7,12],[8,11],[8,14],[9,10],[9,12],
      [10,11],[10,12],[10,14],[11,12],[13,14]
    ];
    const SPOKES = [
      {s:[500.83,794.17],l:203.36,a:-88.813},{s:[567.83,707.17],l:125.1,a:-106.439},
      {s:[714.5,806.83],l:279.76,a:-124.145},{s:[736.83,594.83],l:158.3,a:-157.762},
      {s:[800.5,276.83],l:278.95,a:142.702},{s:[869.83,413.83],l:282.97,a:166.563},
      {s:[598.83,202.17],l:221.97,a:107.149},{s:[612.5,323.83],l:115.65,a:120.891},
      {s:[372.83,337.5],l:120.73,a:50.603},{s:[454.33,132.67],l:281.32,a:81.889},
      {s:[325.83,514.17],l:91.14,a:-4.301},{s:[156.5,372.5],l:282.62,a:20.086},
      {s:[234.5,613.17],l:204.32,a:-22.467},{s:[181.17,836.5],l:377.52,a:-45.897},
      {s:[347.5,841.17],l:285.67,a:-64.944}
    ];
    const PATHS = [
      [8,7,4,1,13],[5,4,0,1,2],[8,14,13,3],[11,12,3,14],
      [5,7,12,10],[0,1,13,14],[8,7,12,10,9],[5,4,3,14]
    ];
    const SNM = [9,12,10,13,3,14,1,2,4,0,6,5,7,8,11]; // spoke-to-node map
    const N2S = new Map(); SNM.forEach((n,s) => N2S.set(n,s));

    function l2w(x,y) { return [(x-500)*LS+LC.x, (y-500)*LS+LC.y]; }
    function spokeEnd(sp) {
      const r=sp.a*Math.PI/180;
      return [sp.s[0]+Math.cos(r)*sp.l, sp.s[1]+Math.sin(r)*sp.l];
    }

    const logoAnchors = DOTS.map(d => l2w(d[0],d[1]));
    const baseSpokeEnds = SPOKES.map(spokeEnd);

    /* ============================================================
       MATH HELPERS (must be before all precomputation)
       ============================================================ */
    function lerp(a,b,t){return a+(b-a)*t;}
    function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
    function easeOut3(t){return 1-Math.pow(1-clamp(t,0,1),3);}
    function easeIO(t){return .5-.5*Math.cos(Math.PI*clamp(t,0,1));}
    function sPulse(d){return Math.exp(-d*d*8);}
    function lerpCol(t){
      const c=clamp(t,0,1);
      return `rgb(${lerp(40,160,c)|0},${lerp(79,210,c)|0},${lerp(119,255,c)|0})`;
    }

    /* ============================================================
       SEEDED RNG
       ============================================================ */
    function mulberry32(a) {
      return () => {
        a|=0; a=a+0x6D2B79F5|0;
        let t=Math.imul(a^a>>>15,1|a);
        t=t+Math.imul(t^t>>>7,61|t)^t;
        return ((t^t>>>14)>>>0)/4294967296;
      };
    }
    const rand = mulberry32(Date.now()^(Math.random()*0xFFFFFFFF));

    /* ============================================================
       BACKGROUND GENERATION
       ============================================================ */
    // Precomputed convex hull of logo nodes + 40 unit padding (1000×1000 logo space)
    const LOGO_HULL = [
      [449.7,93.0],[831.3,251.3],[908.1,402.2],
      [738.7,838.7],[330.0,877.2],[152.5,864.4],[120.0,356.2]
    ];
    function inLogo(x,y) {
      const lx=(x-LC.x)/LS+500, ly=(y-LC.y)/LS+500;
      for(let i=0;i<LOGO_HULL.length;i++){
        const[ax,ay]=LOGO_HULL[i],[bx,by]=LOGO_HULL[(i+1)%LOGO_HULL.length];
        if((bx-ax)*(ly-ay)-(by-ay)*(lx-ax)<0) return false;
      }
      return true;
    }
    // Extend nodes beyond visible area so network looks infinite at all edges
    const xMin = 300, xMax = 2700;

    const TARGET_BG = 600 + Math.floor(rand()*151); // 600-750
    const bgNodes = []; // {x, y, r, fw}
    let att=0;
    while(bgNodes.length<TARGET_BG && att<20000) {
      att++;
      const x=rand()*(xMax-xMin)+xMin, y=rand()*2100-1000;
      if(inLogo(x,y)) continue;
      let ok=true;
      for(const bn of bgNodes) { if(Math.hypot(x-bn.x,y-bn.y)<18){ok=false;break;} }
      if(!ok) continue;
      if(rand()<Math.abs(x-LC.x)/1500*0.15) continue;
      bgNodes.push({ x, y, r:1.5+rand()*2.5, fw:1 });
    }

    const TOTAL_N = LOGO_N + bgNodes.length;

    function nodePos(i) { return i<LOGO_N ? logoAnchors[i] : [bgNodes[i-LOGO_N].x, bgNodes[i-LOGO_N].y]; }
    function nodeFW(i) { return i<LOGO_N ? 1 : bgNodes[i-LOGO_N].fw; }

    /* ============================================================
       EDGE GENERATION
       ============================================================ */
    function eKey(a,b) { return a<b?a*TOTAL_N+b:b*TOTAL_N+a; }
    const edgeSet = new Set();
    LEDGES.forEach(([a,b]) => edgeSet.add(eKey(a,b)));

    const bgEdges = []; // {a, b, sw, fw}
    // BG-to-BG
    for(let i=0;i<bgNodes.length;i++) {
      const ai=i+LOGO_N, an=bgNodes[i], cands=[];
      for(let j=0;j<bgNodes.length;j++) {
        if(i===j) continue;
        const d=Math.hypot(an.x-bgNodes[j].x, an.y-bgNodes[j].y);
        if(d<120) cands.push({idx:j+LOGO_N, d});
      }
      cands.sort((a,b)=>a.d-b.d);
      const max=2+Math.floor(rand()*2);
      for(let k=0;k<Math.min(max,cands.length);k++) {
        const key=eKey(ai,cands[k].idx);
        if(!edgeSet.has(key)) {
          edgeSet.add(key);
          bgEdges.push({a:ai, b:cands[k].idx, sw:0.5+rand(), fw:1, bridge:false});
        }
      }
    }
    // Bridges (logo-to-BG)
    for(let i=0;i<LOGO_N;i++) {
      const[ax,ay]=logoAnchors[i]; const cands=[];
      for(let j=0;j<bgNodes.length;j++) {
        const d=Math.hypot(ax-bgNodes[j].x, ay-bgNodes[j].y);
        if(d<180) cands.push({idx:j+LOGO_N, d});
      }
      cands.sort((a,b)=>a.d-b.d);
      const max=1;
      for(let k=0;k<Math.min(max,cands.length);k++) {
        const key=eKey(i,cands[k].idx);
        if(!edgeSet.has(key)) {
          edgeSet.add(key);
          bgEdges.push({a:i, b:cands[k].idx, sw:0.8+rand()*0.7, fw:1, bridge:true});
        }
      }
    }

    // Ensure single connected component via BFS from logo node 0
    {
      const totalN=LOGO_N+bgNodes.length;
      const tmpAdj=Array.from({length:totalN},()=>[]);
      LEDGES.forEach(([a,b])=>{tmpAdj[a].push(b);tmpAdj[b].push(a);});
      bgEdges.forEach(e=>{tmpAdj[e.a].push(e.b);tmpAdj[e.b].push(e.a);});
      const reached=new Uint8Array(totalN);
      reached[0]=1;
      const q=[0];
      for(let i=0;i<q.length;i++){for(const n of tmpAdj[q[i]])if(!reached[n]){reached[n]=1;q.push(n);}}
      for(let i=LOGO_N;i<totalN;i++){
        if(reached[i]) continue;
        const an=bgNodes[i-LOGO_N];
        let bestJ=-1, bestD=Infinity;
        for(let j=0;j<totalN;j++){
          if(!reached[j]) continue;
          const[px,py]=j<LOGO_N?logoAnchors[j]:[bgNodes[j-LOGO_N].x,bgNodes[j-LOGO_N].y];
          const d=Math.hypot(an.x-px,an.y-py);
          if(d<bestD){bestD=d;bestJ=j;}
        }
        if(bestJ>=0){
          const key=eKey(i,bestJ);
          if(!edgeSet.has(key)){
            edgeSet.add(key);
            bgEdges.push({a:i,b:bestJ,sw:0.5+rand(),fw:1,bridge:bestJ<LOGO_N});
          }
          reached[i]=1;q.push(i);
          // BFS from newly connected node to reach its cluster
          for(let k=q.length-1;k<q.length;k++){for(const n of tmpAdj[q[k]])if(!reached[n]){reached[n]=1;q.push(n);}}
        }
      }
    }

    // Break chains: add one edge to any bg node with degree ≤ 2
    {
      const deg=new Uint8Array(LOGO_N+bgNodes.length);
      for(const e of bgEdges){deg[e.a]++;deg[e.b]++;}
      LEDGES.forEach(([a,b])=>{deg[a]++;deg[b]++;});
      for(let i=0;i<bgNodes.length;i++){
        if(deg[i+LOGO_N]>2) continue;
        const ai=i+LOGO_N, an=bgNodes[i], cands=[];
        for(let j=0;j<bgNodes.length;j++){
          if(i===j) continue;
          const key=eKey(ai,j+LOGO_N);
          if(edgeSet.has(key)) continue;
          const d=Math.hypot(an.x-bgNodes[j].x, an.y-bgNodes[j].y);
          if(d<160) cands.push({idx:j+LOGO_N, d});
        }
        if(cands.length===0) continue;
        cands.sort((a,b)=>a.d-b.d);
        const key=eKey(ai,cands[0].idx);
        edgeSet.add(key);
        bgEdges.push({a:ai, b:cands[0].idx, sw:0.5+rand(), fw:1, bridge:false});
      }
    }

    // All edges in one flat structure for BFS
    const ALL_EDGES = [...LEDGES.map(([a,b])=>([a,b])), ...bgEdges.map(e=>([e.a,e.b]))];
    const LEDGE_COUNT = LEDGES.length;

    /* ============================================================
       GRAPH & BFS
       ============================================================ */
    const adj = Array.from({length:TOTAL_N},()=>[]);
    ALL_EDGES.forEach(([a,b])=>{ adj[a].push(b); adj[b].push(a); });

    const logoAdj = Array.from({length:LOGO_N},()=>[]);
    LEDGES.forEach(([a,b])=>{ logoAdj[a].push(b); logoAdj[b].push(a); });

    function bfs(origin) {
      const d=new Int16Array(TOTAL_N); d.fill(-1); d[origin]=0;
      const q=[origin];
      for(let i=0;i<q.length;i++) {
        const c=q[i], nd=d[c]+1;
        for(const n of adj[c]) { if(d[n]<0){d[n]=nd;q.push(n);} }
      }
      return d;
    }

    // Precompute ripple rings for all possible pulse endpoints
    function buildRings(origin) {
      const dist=bfs(origin);
      const nR=new Map(), eR=new Map();
      let maxD=0;
      for(let i=0;i<TOTAL_N;i++) {
        if(dist[i]<0) continue;
        const ring=dist[i]; if(ring>maxD) maxD=ring;
        if(!nR.has(ring)) nR.set(ring,[]);
        nR.get(ring).push(i);
      }
      for(let i=0;i<ALL_EDGES.length;i++) {
        const[a,b]=ALL_EDGES[i];
        if(dist[a]<0||dist[b]<0) continue;
        const ring=Math.min(dist[a],dist[b]);
        if(!eR.has(ring)) eR.set(ring,[]);
        eR.get(ring).push(i);
      }
      return {nR, eR, maxD};
    }

    const preRipples = new Map();
    new Set(PATHS.map(p=>p[p.length-1])).forEach(o => preRipples.set(o, buildRings(o)));

    // Precompute broadcast rings (Euclidean from center)
    const nodeCDist = Array.from({length:TOTAL_N},(_,i)=>{const p=nodePos(i);return Math.hypot(p[0]-LC.x,p[1]-LC.y);});
    const maxCD = Math.max(...nodeCDist);
    const preBroadcast = (() => {
      const R=20, nR=new Map(), eR=new Map();
      for(let i=0;i<TOTAL_N;i++){
        const ring=Math.min(R-1,Math.floor(nodeCDist[i]/maxCD*R));
        if(!nR.has(ring))nR.set(ring,[]); nR.get(ring).push(i);
      }
      for(let i=0;i<ALL_EDGES.length;i++){
        const[a,b]=ALL_EDGES[i];
        const ring=Math.min(R-1,Math.floor((nodeCDist[a]+nodeCDist[b])/2/maxCD*R));
        if(!eR.has(ring))eR.set(ring,[]); eR.get(ring).push(i);
      }
      return {nR,eR,maxR:R-1};
    })();

    // Edge lengths for logo edges (for entrance dash)
    const ledgeLens = LEDGES.map(([a,b])=>Math.hypot(logoAnchors[a][0]-logoAnchors[b][0],logoAnchors[a][1]-logoAnchors[b][1]));
    const spokeLensW = SPOKES.map(s=>s.l*LS);

    /* ============================================================
       CANVAS SETUP
       ============================================================ */
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let dpr=1, scale=1, offX=0, offY=0, px=1;
    let bgCacheCanvas=null, bgCacheDirty=true;
    let fadeRects: {x:number,y:number,w:number,h:number}[] = [];

    function resize() {
      if(!canvas.parentElement) return;
      const pr=canvas.parentElement.getBoundingClientRect();
      const cr=canvas.getBoundingClientRect();
      dpr=window.devicePixelRatio||1;
      canvas.width=cr.width*dpr; canvas.height=cr.height*dpr;
      const sx=pr.width/IW, sy=pr.height/IH;
      scale=Math.max(sx,sy,0.65);
      offX=(cr.width-IW*scale)/2;
      offY=(cr.height-pr.height)+(pr.height-IH*scale)/2;
      px=1/scale;
      bgCacheDirty=true;
      // Measure text elements for localized fade
      fadeRects=[];
      const _cTop=cr.top;
      const _cLeft=cr.left;
      for(const sel of ['.hero-banner__headline','.hero-banner__info','.stats-bar__inner']){
        const el=document.querySelector(sel);
        if(!el) continue;
        const r=el.getBoundingClientRect();
        fadeRects.push({x:r.left-_cLeft, y:r.top-_cTop, w:r.width, h:r.height});
      }
    }
    window.addEventListener('resize',resize);
    resize();

    function buildBgCache() {
      const c=document.createElement('canvas');
      c.width=canvas.width; c.height=canvas.height;
      const bx=c.getContext('2d');
      if(!bx) return;
      bx.setTransform(scale*dpr,0,0,scale*dpr,offX*dpr,offY*dpr);
      bx.lineCap='round';
      // BG edges (non-bridge) — clipped at node circles
      for(const e of bgEdges) {
        if(e.bridge) continue;
        const[ax,ay]=nodePos(e.a),[bxx,by]=nodePos(e.b);
        const cl=clipEdge(ax,ay,bxx,by,nodeR(e.a),nodeR(e.b));
        if(!cl) continue;
        bx.beginPath(); bx.moveTo(cl[0],cl[1]); bx.lineTo(cl[2],cl[3]);
        bx.strokeStyle=`rgba(127,164,210,${(0.5*e.fw).toFixed(2)})`;
        bx.lineWidth=e.sw*px;
        bx.stroke();
      }
      // BG nodes
      for(const n of bgNodes) {
        bx.beginPath(); bx.arc(n.x,n.y,n.r*px,0,TAU);
        bx.fillStyle=`rgba(40,79,119,${(0.4*n.fw).toFixed(2)})`;
        bx.fill();
      }
      bgCacheCanvas=c; bgCacheDirty=false;
    }

    /* ============================================================
       ANIMATION STATE
       ============================================================ */
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Logo animated positions (in original 1000x1000 coords)
    const lp = DOTS.map(([x,y])=>({x,y}));
    const li = baseSpokeEnds.map(([x,y])=>({x,y}));
    const nph = DOTS.map((_,i)=>({a:i*.91+.3,b:i*1.37+1.1,c:i*.53+2.4,d:i*.77+.6}));

    // Reusable intensity buffers
    let eI = new Float64Array(ALL_EDGES.length);
    const nG = new Float64Array(TOTAL_N);

    // Pulses
    const pulses = [];
    let nextPulse=4, pulseCtr=0;
    // Ripples
    const ripples = [];
    // Heartbeats
    const hb = DOTS.map((_,i)=>({next:4+i*.4+rand()*2, st:-10}));
    // Data packets
    const packets = [];
    let nextPkt=4;
    // Spoke flash
    const sf = new Float64Array(SPOKES.length).fill(-10);
    // Broadcast
    let bc={active:false, st:-10, cd:0};
    // Entrance
    let entStart=-1, entDone=false;

    // Mouse state
    let mouse = { x: -9999, y: -9999, inside: false };
    // Drag state
    let dragIdx = -1;
    let downX = 0, downY = 0;
    let didDrag = false;
    // Snap state
    const SNAP_DIST = 120;
    let isSnapped = false;
    let snapAnims: {ox:number,oy:number,dx:number,dy:number,st:number}[] = [];
    // Grab offset so node stays under cursor without jumping
    let dragGrabX = 0, dragGrabY = 0;

    // Per-node damped attraction offsets (logo outer nodes + all bg nodes; spoke inner ends stay fixed)
    const attractOffX = new Float64Array(TOTAL_N);
    const attractOffY = new Float64Array(TOTAL_N);
    // Wide speed variation: 0.004–0.025 (follow), ~5× slower for return
    const attractSpeed = Array.from({length:TOTAL_N}, () => 0.008 + rand() * 0.032);
    const returnSpeed  = Array.from({length:TOTAL_N}, () => 0.0008 + rand() * 0.004);
    let hasActiveOffsets = false;

    function updateAttraction() {
      hasActiveOffsets = false;
      for (let i = 0; i < TOTAL_N; i++) {
        if (i === dragIdx) continue;
        let tx = 0, ty = 0;
        if (mouse.inside && !isSnapped) {
          const [x, y] = i < LOGO_N ? l2w(lp[i].x, lp[i].y) : [bgNodes[i-LOGO_N].x, bgNodes[i-LOGO_N].y];
          const dx = mouse.x - x, dy = mouse.y - y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 500) {
            const falloff = Math.pow(1 - dist / 500, 2);
            const strength = 25 * falloff;
            tx = (dx / dist) * strength;
            ty = (dy / dist) * strength;
          }
        }
        const spd = mouse.inside ? attractSpeed[i] : returnSpeed[i];
        attractOffX[i] += (tx - attractOffX[i]) * spd;
        attractOffY[i] += (ty - attractOffY[i]) * spd;
        if (Math.abs(attractOffX[i]) > 0.1 || Math.abs(attractOffY[i]) > 0.1) hasActiveOffsets = true;
      }
    }

    // Clip edge at node circle boundaries — returns shortened endpoints or null if too short
    function nodeR(i) { return i < LOGO_N ? LNR : bgNodes[i-LOGO_N].r*px; }
    function clipEdge(ax,ay,bx,by,ra,rb) {
      const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy);
      if(len<=ra+rb) return null;
      const ux=dx/len,uy=dy/len;
      return [ax+ux*ra,ay+uy*ra,bx-ux*rb,by-uy*rb];
    }
    function dragEdgeAlpha(a:number,b:number):number {
      if(dragIdx<0||(a!==dragIdx&&b!==dragIdx)) return 1;
      if(isSnapped) return 0;
      const d=Math.hypot(attractOffX[dragIdx],attractOffY[dragIdx]);
      return 1-clamp((d-SNAP_DIST*0.7)/(SNAP_DIST*0.3),0,1);
    }

    /* ============================================================
       BREATHING
       ============================================================ */
    const BR={sA:.012,sS:.75,sP:.4,dAx:3,dAy:2.5,dSx:.2,dSy:.17,dPx:.2,dPy:1,
      rI:4,rO:10,tI:3,tO:8,rSa:.7,rSb:1.15,tSa:.55,tSb:1,iW:3.5};

    function breathe(t) {
      const p=BR, gs=1+p.sA*Math.sin(t*p.sS+p.sP);
      const dx=Math.sin(t*p.dSx+p.dPx)*p.dAx, dy=Math.cos(t*p.dSy+p.dPy)*p.dAy;
      for(let i=0;i<LOGO_N;i++){
        const[bx,by]=DOTS[i];
        let x=500+(bx-500)*gs+dx, y=500+(by-500)*gs+dy;
        const ddx=x-500,ddy=y-500,dist=Math.hypot(ddx,ddy)||1;
        const nx=ddx/dist,ny=ddy/dist,tx=-ny,ty=nx;
        const ph=nph[i];
        const rA=lerp(p.rI,p.rO,clamp((dist-140)/320,0,1));
        const tA=lerp(p.tI,p.tO,clamp((dist-140)/320,0,1));
        const rOff=Math.sin(t*p.rSa+ph.a)*rA+Math.cos(t*p.rSb+ph.b)*rA*.3;
        const tOff=Math.cos(t*p.tSa+ph.c)*tA+Math.sin(t*p.tSb+ph.d)*tA*.35;
        let fx=x+nx*rOff+tx*tOff, fy=y+ny*rOff+ty*tOff;
        const ox=fx-bx,oy=fy-by,od=Math.hypot(ox,oy);
        if(od>20){const s=20/od;fx=bx+ox*s;fy=by+oy*s;}
        lp[i].x=fx;lp[i].y=fy;
      }
      for(let i=0;i<baseSpokeEnds.length;i++){
        const[bx,by]=baseSpokeEnds[i];
        const tx2=500+(bx-500)*gs+dx*.7, ty2=500+(by-500)*gs+dy*.7;
        const ph=nph[i];
        li[i].x=tx2+Math.sin(t*.45+ph.a*.7)*p.iW;
        li[i].y=ty2+Math.cos(t*.4+ph.c*.7)*p.iW;
      }
    }

    // Get world position for any node with smooth attraction offset applied
    function wp(i) {
      const [x, y] = i < LOGO_N ? l2w(lp[i].x, lp[i].y) : [bgNodes[i-LOGO_N].x, bgNodes[i-LOGO_N].y];
      return [x + attractOffX[i], y + attractOffY[i]];
    }

    /* ============================================================
       DATA PACKETS
       ============================================================ */
    function updatePackets(t) {
      if(!entDone) return;
      if(t>=nextPkt && packets.length<8) {
        const from=Math.floor(rand()*LOGO_N);
        const nb=logoAdj[from]; if(nb.length){
          packets.push({from,to:nb[Math.floor(rand()*nb.length)],st:t,dur:1.5+rand()*1.0});
        }
        nextPkt=t+.5+rand()*.5;
      }
      for(let i=packets.length-1;i>=0;i--){
        const pk=packets[i];
        if((t-pk.st)/pk.dur>=1){
          if(rand()<.12){packets.splice(i,1);}
          else{
            const nb=logoAdj[pk.to];
            pk.from=pk.to; pk.to=nb[Math.floor(rand()*nb.length)];
            pk.st=t; pk.dur=1.5+rand()*1.0;
          }
        }
      }
    }

    /* ============================================================
       MAIN UPDATE (compute state, no drawing)
       ============================================================ */
    function update(t) {
      if(entStart<0) entStart=t;
      const et=t-entStart;

      if(reducedMotion){entDone=true;return;}

      // Breathing (blend in during entrance)
      breathe(t);
      const bF=entDone?1:clamp((et-1)/1.5,0,1);
      if(bF<1) for(let i=0;i<LOGO_N;i++){
        lp[i].x=lerp(DOTS[i][0],lp[i].x,bF);
        lp[i].y=lerp(DOTS[i][1],lp[i].y,bF);
        li[i].x=lerp(baseSpokeEnds[i][0],li[i].x,bF);
        li[i].y=lerp(baseSpokeEnds[i][1],li[i].y,bF);
      }

      if(!entDone && et>3.2) { entDone=true; bgCacheDirty=true; }

      // Smooth mouse attraction (per-node damped drift)
      updateAttraction();

      // Intensities
      eI.fill(0); nG.fill(0);

      // Pulses
      if(entDone && t>=nextPulse) {
        if(pulses.length<2){
          pulses.push({pi:pulseCtr%PATHS.length, st:t, dur:3.2+(pulseCtr%3)*.3, rad:false});
          pulseCtr++;
        }
        nextPulse=t+6+rand()*3;
      }
      for(let i=pulses.length-1;i>=0;i--) if(t>pulses[i].st+pulses[i].dur+.5) pulses.splice(i,1);

      for(const pulse of pulses) {
        const path=PATHS[pulse.pi], segN=path.length-1;
        const pT=clamp((t-pulse.st)/pulse.dur,0,1), front=pT*segN;
        // Edge intensities (logo edges only)
        for(let s=0;s<segN;s++){
          // Find edge index in LEDGES
          const[p1,p2]=[path[s],path[s+1]];
          for(let ei=0;ei<LEDGE_COUNT;ei++){
            const[a,b]=LEDGES[ei];
            if((a===p1&&b===p2)||(a===p2&&b===p1)){
              eI[ei]=Math.max(eI[ei],sPulse(front-s)*.6);
              break;
            }
          }
        }
        for(let p=0;p<path.length;p++){
          const glow=sPulse((front+.15)-p)*.5;
          nG[path[p]]=Math.max(nG[path[p]],glow);
          if(glow>.2){const si=N2S.get(path[p]);if(si!==undefined)sf[si]=t;}
        }
        // Radiation
        if(pT>.85&&!pulse.rad){
          pulse.rad=true;
          const pre=preRipples.get(path[path.length-1]);
          if(pre) ripples.push({st:t, nR:pre.nR, eR:pre.eR, maxD:pre.maxD});
        }
      }

      // Ripples (ring-based, precomputed)
      for(let ri=ripples.length-1;ri>=0;ri--){
        const rp=ripples[ri], el=t-rp.st;
        if(el>rp.maxD*.08+1.5){ripples.splice(ri,1);continue;}
        const rLo=Math.max(0,(el-1.2)/.08|0), rHi=Math.min(rp.maxD,Math.ceil(el/.08));
        for(let ring=rLo;ring<=rHi;ring++){
          const loc=el-ring*.08;
          if(loc<=0||loc>=1.2) continue;
          const gN=Math.exp(-loc*3.5)*.5;
          const nodes=rp.nR.get(ring);
          if(nodes) for(const idx of nodes) nG[idx]=Math.max(nG[idx],gN*nodeFW(idx));
          const gE=Math.exp(-loc*4.5)*.4;
          const edges=rp.eR.get(ring);
          if(edges) for(const idx of edges){
            if(idx>=ALL_EDGES.length) continue;
            const[a,b]=ALL_EDGES[idx];
            eI[idx]=Math.max(eI[idx],gE*Math.min(nodeFW(a),nodeFW(b)));
          }
        }
      }

      // Broadcast
      if(bc.active){
        const el=t-bc.st;
        if(el>2.5) bc.active=false;
        else{
          if(el<.5)for(let i=0;i<SPOKES.length;i++)sf[i]=t;
          if(el>.25){
            const we=el-.25, br=preBroadcast;
            const rLo=Math.max(0,(we-1.5)/.04|0), rHi=Math.min(br.maxR,Math.ceil(we/.04));
            for(let ring=rLo;ring<=rHi;ring++){
              const delay=(ring/20)*.8, loc=we-delay;
              if(loc<=0) continue;
              if(loc<1.5){const nodes=br.nR.get(ring);if(nodes)for(const i of nodes)nG[i]=Math.max(nG[i],Math.exp(-loc*3)*nodeFW(i));}
              if(loc<1.2){const edges=br.eR.get(ring);if(edges)for(const i of edges){if(i>=ALL_EDGES.length)continue;const[a,b]=ALL_EDGES[i];eI[i]=Math.max(eI[i],Math.exp(-loc*3.5)*.9*Math.min(nodeFW(a),nodeFW(b)));}}
            }
          }
        }
      }

      // Heartbeats
      for(let i=0;i<LOGO_N;i++){
        if(entDone&&t>=hb[i].next){hb[i].st=t;hb[i].next=t+2.5+rand()*4;}
        const he=t-hb[i].st;
        if(he>=0&&he<.9)nG[i]=Math.max(nG[i],Math.sin(he/.9*Math.PI)*.6);
      }

      updatePackets(t);
    }

    /* ============================================================
       RENDER (Canvas draw calls only)
       ============================================================ */
    function render(t) {
      const et=t-entStart;
      ctx.setTransform(scale*dpr,0,0,scale*dpr,offX*dpr,offY*dpr);
      ctx.clearRect(-offX/scale,-offY/scale,canvas.width/scale/dpr+100,canvas.height/scale/dpr+100);
      ctx.lineCap='round';

      if(reducedMotion) { renderStatic(); return; }

      const entF=entDone?1:0; // entrance factor

      // === BACKGROUND ===
      if(entDone && !mouse.inside && !hasActiveOffsets) {
        // Use offscreen cache (no attraction active)
        if(bgCacheDirty) buildBgCache();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.drawImage(bgCacheCanvas,0,0);
        ctx.setTransform(scale*dpr,0,0,scale*dpr,offX*dpr,offY*dpr);
      } else if(entDone && (mouse.inside || hasActiveOffsets)) {
        // Draw bg WITH mouse attraction (all edges + nodes through wp/attract)
        for(const e of bgEdges) {
          if(e.bridge) continue;
          let da=dragEdgeAlpha(e.a,e.b);
          if(e.createdAt){
            const age=performance.now()/1000-e.createdAt;
            if(age<0.5) da*=age/0.5;
            else delete e.createdAt;
          }
          if(da<=0) continue;
          const[ax,ay]=wp(e.a),[bx,by]=wp(e.b);
          const cl=clipEdge(ax,ay,bx,by,nodeR(e.a),nodeR(e.b));
          if(!cl) continue;
          ctx.globalAlpha=e.fw*.5*da;
          ctx.beginPath();ctx.moveTo(cl[0],cl[1]);ctx.lineTo(cl[2],cl[3]);
          ctx.strokeStyle='rgb(127,164,210)';ctx.lineWidth=e.sw*px;ctx.stroke();
        }
        for(let i=0;i<bgNodes.length;i++) {
          const n=bgNodes[i];
          const[nx,ny]=wp(i+LOGO_N);
          ctx.globalAlpha=n.fw*.4;
          ctx.beginPath();ctx.arc(nx,ny,n.r*px,0,TAU);
          ctx.fillStyle='#284f77';ctx.fill();
        }
        ctx.globalAlpha=1;
      } else {
        // Entrance fade (no attraction yet)
        for(const e of bgEdges) {
          if(e.bridge) continue;
          const[ax,ay]=nodePos(e.a),[bx,by]=nodePos(e.b);
          const avgD=(nodeCDist[e.a]+nodeCDist[e.b])/2;
          const stag=1.2+(avgD/maxCD)*1.5;
          const prog=easeOut3((et-stag)/.8);
          if(prog<=0) continue;
          const cl=clipEdge(ax,ay,bx,by,nodeR(e.a),nodeR(e.b));
          if(!cl) continue;
          ctx.globalAlpha=prog*e.fw*.5;
          ctx.beginPath();ctx.moveTo(cl[0],cl[1]);ctx.lineTo(cl[2],cl[3]);
          ctx.strokeStyle='rgb(127,164,210)';ctx.lineWidth=e.sw*px;ctx.stroke();
        }
        for(const n of bgNodes) {
          const stag=1.5+(Math.hypot(n.x-LC.x,n.y-LC.y)/maxCD)*1.3;
          const prog=clamp((et-stag)/.5,0,1);
          if(prog<=0) continue;
          ctx.globalAlpha=prog*n.fw*.4;
          ctx.beginPath();ctx.arc(n.x,n.y,n.r*px,0,TAU);
          ctx.fillStyle='#284f77';ctx.fill();
        }
        ctx.globalAlpha=1;
      }

      // === BRIDGE EDGES (dynamic: one end moves) ===
      for(const e of bgEdges) {
        if(!e.bridge) continue;
        let da=dragEdgeAlpha(e.a,e.b);
        if(e.createdAt){
          const age=performance.now()/1000-e.createdAt;
          if(age<0.5) da*=age/0.5;
          else delete e.createdAt;
        }
        if(da<=0) continue;
        const[ax,ay]=wp(e.a),[bx,by]=wp(e.b);
        const prog=entDone?1:easeOut3((et-1.2-(nodeCDist[e.a]+nodeCDist[e.b])/2/maxCD*1.5)/.8);
        if(prog<=0) continue;
        const cl=clipEdge(ax,ay,bx,by,nodeR(e.a),nodeR(e.b));
        if(!cl) continue;
        ctx.globalAlpha=prog*e.fw*.5*da;
        ctx.beginPath();ctx.moveTo(cl[0],cl[1]);ctx.lineTo(cl[2],cl[3]);
        ctx.strokeStyle='rgb(127,164,210)';ctx.lineWidth=e.sw*px;ctx.stroke();
      }
      ctx.globalAlpha=1;

      // === LOGO EDGES ===
      ctx.strokeStyle='#7fa4d2'; ctx.lineWidth=2.67*px;
      for(let i=0;i<LEDGE_COUNT;i++) {
        const[a,b]=LEDGES[i];
        const[ax,ay]=wp(a),[bx,by]=wp(b);
        if(!entDone){
          const stag=(i/LEDGE_COUNT)*1.2;
          const prog=easeOut3((et-stag)/.8);
          if(prog<=0) continue;
          const len=ledgeLens[i];
          ctx.setLineDash([len*prog,len]);
        }
        ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
      }
      ctx.setLineDash([]);

      // === PULSE GLOW ON EDGES ===
      for(let i=0;i<ALL_EDGES.length;i++){
        if(eI[i]<=0) continue;
        const[a,b]=ALL_EDGES[i];
        const da=dragEdgeAlpha(a,b);
        if(da<=0) continue;
        const[ax,ay]=wp(a),[bx,by]=wp(b);
        const cl=clipEdge(ax,ay,bx,by,nodeR(a),nodeR(b));
        if(!cl) continue;
        const intensity=eI[i];
        const fw=Math.min(nodeFW(a),nodeFW(b));
        ctx.globalAlpha=intensity*.65*fw*da;
        ctx.strokeStyle=lerpCol(intensity*.5);
        ctx.lineWidth=(i<LEDGE_COUNT?8:5)*px;
        ctx.beginPath();ctx.moveTo(cl[0],cl[1]);ctx.lineTo(cl[2],cl[3]);ctx.stroke();
      }
      ctx.globalAlpha=1;

      // === SPOKES ===
      for(let i=0;i<SPOKES.length;i++) {
        const ni=SNM[i];
        const[sx,sy]=wp(ni);
        const[ex,ey]=l2w(li[i].x,li[i].y);
        const fe=t-sf[i];
        if(!entDone){
          const stag=1+(i/SPOKES.length)*.8;
          const prog=easeOut3((et-stag)/.7);
          if(prog<=0) continue;
          ctx.setLineDash([spokeLensW[i]*prog,spokeLensW[i]]);
        }
        if(fe<.6){
          const fg=Math.exp(-fe*5);
          ctx.strokeStyle=lerpCol(fg*.6);ctx.lineWidth=(4.69+fg*4)*px;
        } else {
          ctx.strokeStyle='#284f77';ctx.lineWidth=4.69*px;
        }
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
      }
      ctx.setLineDash([]);

      // === BG NODE GLOW (only affected nodes) ===
      for(let i=LOGO_N;i<TOTAL_N;i++){
        if(nG[i]<=0) continue;
        const n=bgNodes[i-LOGO_N];
        const[nx,ny]=wp(i);
        ctx.globalAlpha=nG[i]*.7*n.fw;
        ctx.fillStyle='rgba(140,190,240,0.4)';
        ctx.beginPath();ctx.arc(nx,ny,(n.r+nG[i]*3)*px,0,TAU);ctx.fill();
        ctx.globalAlpha=1;
        ctx.fillStyle=lerpCol(nG[i]*.4);
        ctx.beginPath();ctx.arc(nx,ny,(n.r+nG[i]*2)*px,0,TAU);ctx.fill();
      }

      // === LOGO NODE HALOS + NODES ===
      for(let i=0;i<LOGO_N;i++){
        const[x,y]=wp(i);
        const glow=nG[i];
        const nodeAlpha=entDone?1:clamp((et-.4-i*.04)/.5,0,1);
        if(nodeAlpha<=0) continue;
        // Halo
        if(glow>.01){
          ctx.globalAlpha=glow*.85*nodeAlpha;
          ctx.fillStyle='rgba(140,190,240,0.35)';
          ctx.beginPath();ctx.arc(x,y,LNR*2.2,0,TAU);ctx.fill();
        }
        // Node
        ctx.globalAlpha=nodeAlpha;
        ctx.fillStyle=glow>.2?lerpCol(glow*.5):'#284f77';
        ctx.beginPath();ctx.arc(x,y,LNR+glow*5*px,0,TAU);ctx.fill();
      }
      ctx.globalAlpha=1;

      // === PULSE DOTS ===
      for(let di=0;di<pulses.length&&di<3;di++){
        const pulse=pulses[di], path=PATHS[pulse.pi];
        const pT=clamp((t-pulse.st)/pulse.dur,0,1);
        const fIn=clamp(pT*5,0,1),fOut=clamp((1-pT)*5,0,1);
        const segN=path.length-1, c2=easeIO(pT)*segN;
        const idx=Math.min(Math.floor(c2),segN-1), lt=c2-idx;
        const[ax,ay]=wp(path[idx]),[bx,by]=wp(path[idx+1]);
        ctx.globalAlpha=fIn*fOut*.95;
        ctx.fillStyle=lerpCol(.5);
        ctx.beginPath();ctx.arc(lerp(ax,bx,lt),lerp(ay,by,lt),14*LS,0,TAU);ctx.fill();
      }
      ctx.globalAlpha=1;

      // === DATA PACKETS ===
      ctx.fillStyle='rgba(140,190,240,0.9)';
      for(const pk of packets){
        const prog=clamp((t-pk.st)/pk.dur,0,1);
        const[ax,ay]=wp(pk.from),[bx,by]=wp(pk.to);
        ctx.beginPath();ctx.arc(lerp(ax,bx,prog),lerp(ay,by,prog),6*px,0,TAU);ctx.fill();
      }

      // === ELASTIC SNAP ANIMATION ===
      for(let si=snapAnims.length-1;si>=0;si--){
        const sa=snapAnims[si];
        const el2=performance.now()/1000-sa.st;
        if(el2>0.5){snapAnims.splice(si,1);continue;}
        const t2=el2/0.5;
        const spring=Math.exp(-t2*4)*Math.sin(t2*Math.PI*3)*20*(1-t2);
        const ex=sa.ox+sa.dx*spring, ey=sa.oy+sa.dy*spring;
        ctx.globalAlpha=(1-t2)*0.5;
        ctx.strokeStyle='rgba(127,164,210,1)';
        ctx.lineWidth=2*px;
        ctx.beginPath();ctx.moveTo(sa.ox,sa.oy);ctx.lineTo(ex,ey);ctx.stroke();
        ctx.fillStyle='rgba(127,164,210,1)';
        ctx.beginPath();ctx.arc(ex,ey,2*px,0,TAU);ctx.fill();
      }
      ctx.globalAlpha=1;

      // === SUBTLE FADE BEHIND TEXT ELEMENTS ===
      ctx.setTransform(1,0,0,1,0,0);
      const PAD=24*dpr; // padding around each element
      for(const fr of fadeRects){
        const rx=(fr.x-24)*dpr, ry=(fr.y-16)*dpr;
        const rw=(fr.w+48)*dpr, rh=(fr.h+32)*dpr;
        // Soft radial-ish fade: draw concentric rects with decreasing alpha
        for(let ring=3;ring>=0;ring--){
          const expand=ring*PAD;
          ctx.globalAlpha=0.12-ring*0.025;
          ctx.fillStyle='#ffffff';
          ctx.beginPath();
          if(ctx.roundRect) ctx.roundRect(rx-expand,ry-expand,rw+expand*2,rh+expand*2,PAD);
          else ctx.rect(rx-expand,ry-expand,rw+expand*2,rh+expand*2);
          ctx.fill();
        }
      }
      ctx.globalAlpha=1;
    }

    function renderStatic() {
      ctx.lineCap='round';
      // BG edges
      for(const e of bgEdges){
        const[ax,ay]=nodePos(e.a),[bx,by]=nodePos(e.b);
        const cl=clipEdge(ax,ay,bx,by,nodeR(e.a),nodeR(e.b));
        if(!cl) continue;
        ctx.globalAlpha=e.fw*.5;
        ctx.strokeStyle='rgb(127,164,210)';ctx.lineWidth=e.sw*px;
        ctx.beginPath();ctx.moveTo(cl[0],cl[1]);ctx.lineTo(cl[2],cl[3]);ctx.stroke();
      }
      // BG nodes
      for(const n of bgNodes){
        ctx.globalAlpha=n.fw*.4;ctx.fillStyle='#284f77';
        ctx.beginPath();ctx.arc(n.x,n.y,n.r*px,0,TAU);ctx.fill();
      }
      ctx.globalAlpha=1;
      // Logo edges
      ctx.strokeStyle='#7fa4d2';ctx.lineWidth=2.67*px;
      for(const[a,b] of LEDGES){
        const[ax,ay]=logoAnchors[a],[bx,by]=logoAnchors[b];
        ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
      }
      // Spokes
      ctx.strokeStyle='#284f77';ctx.lineWidth=4.69*px;
      for(let i=0;i<SPOKES.length;i++){
        const ni=SNM[i];
        const[sx,sy]=l2w(DOTS[ni][0],DOTS[ni][1]);
        const[ex,ey]=l2w(baseSpokeEnds[i][0],baseSpokeEnds[i][1]);
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
      }
      // Logo nodes
      ctx.fillStyle='#284f77';
      for(const[x,y] of logoAnchors){
        ctx.beginPath();ctx.arc(x,y,LNR,0,TAU);ctx.fill();
      }
    }

    /* ============================================================
       DRAG SNAP & REWIRE
       ============================================================ */
    function finalizeDrop(idx:number) {
      const n=bgNodes[idx-LOGO_N];
      n.x+=attractOffX[idx];
      n.y+=attractOffY[idx];
      attractOffX[idx]=0;
      attractOffY[idx]=0;
      for(let j=0;j<bgNodes.length;j++){
        if(j+LOGO_N===idx) continue;
        const d=Math.hypot(n.x-bgNodes[j].x,n.y-bgNodes[j].y);
        if(d<30&&d>0){
          const push=(30-d)/d;
          attractOffX[j+LOGO_N]+=(bgNodes[j].x-n.x)*push;
          attractOffY[j+LOGO_N]+=(bgNodes[j].y-n.y)*push;
        }
      }
      nodeCDist[idx]=Math.hypot(n.x-LC.x,n.y-LC.y);
      const rIdx=idx;
      (window.requestIdleCallback||((f:Function)=>setTimeout(f,1)))(()=>rewireNode(rIdx));
    }

    function rewireNode(idx:number) {
      for(let i=bgEdges.length-1;i>=0;i--){
        if(bgEdges[i].a===idx||bgEdges[i].b===idx){
          edgeSet.delete(eKey(bgEdges[i].a,bgEdges[i].b));
          bgEdges.splice(i,1);
        }
      }
      const n=bgNodes[idx-LOGO_N];
      const cands:{idx:number,d:number}[]=[];
      for(let j=0;j<bgNodes.length;j++){
        if(j+LOGO_N===idx) continue;
        const d=Math.hypot(n.x-bgNodes[j].x,n.y-bgNodes[j].y);
        if(d<120) cands.push({idx:j+LOGO_N,d});
      }
      cands.sort((a,b)=>a.d-b.d);
      if(cands.length===0){
        let bestJ=-1, bestD=Infinity;
        for(let j=0;j<bgNodes.length;j++){
          if(j+LOGO_N===idx) continue;
          const d=Math.hypot(n.x-bgNodes[j].x,n.y-bgNodes[j].y);
          if(d<bestD){bestD=d;bestJ=j;}
        }
        if(bestJ>=0) cands.push({idx:bestJ+LOGO_N,d:bestD});
      }
      const max=2+Math.floor(Math.random()*2);
      for(let k=0;k<Math.min(max,cands.length);k++){
        const key=eKey(idx,cands[k].idx);
        if(!edgeSet.has(key)){
          edgeSet.add(key);
          bgEdges.push({a:idx,b:cands[k].idx,sw:0.5+Math.random(),fw:1,bridge:false,createdAt:performance.now()/1000});
        }
      }
      ALL_EDGES.length=0;
      LEDGES.forEach(([a,b])=>ALL_EDGES.push([a,b]));
      bgEdges.forEach(e=>ALL_EDGES.push([e.a,e.b]));
      eI=new Float64Array(ALL_EDGES.length);
      for(let i=0;i<adj.length;i++) adj[i]=[];
      ALL_EDGES.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a);});
      // Rebuild ripple rings for new topology
      preRipples.clear();
      new Set(PATHS.map(p=>p[p.length-1])).forEach(o=>preRipples.set(o,buildRings(o)));
      const R=20;
      preBroadcast.nR.clear();
      preBroadcast.eR.clear();
      for(let i=0;i<TOTAL_N;i++){
        const ring=Math.min(R-1,Math.floor(nodeCDist[i]/maxCD*R));
        if(!preBroadcast.nR.has(ring)) preBroadcast.nR.set(ring,[]);
        preBroadcast.nR.get(ring)!.push(i);
      }
      for(let i=0;i<ALL_EDGES.length;i++){
        const[a,b]=ALL_EDGES[i];
        const ring=Math.min(R-1,Math.floor((nodeCDist[a]+nodeCDist[b])/2/maxCD*R));
        if(!preBroadcast.eR.has(ring)) preBroadcast.eR.set(ring,[]);
        preBroadcast.eR.get(ring)!.push(i);
      }
      bgCacheDirty=true;
      // Clear active ripples/pulses that hold stale edge indices
      ripples.length=0;
      pulses.length=0;
    }

    /* ============================================================
       BOOT
       ============================================================ */
    function showError(err: unknown) {
      console.error('Network banner error:', err);
    }

    try {
      canvas.addEventListener('pointerdown', (e: PointerEvent) => {
        if(!entDone) return;
        const r=canvas.getBoundingClientRect();
        const mx=(e.clientX-r.left-offX)/scale;
        const my=(e.clientY-r.top-offY)/scale;
        downX=e.clientX; downY=e.clientY;
        didDrag=false;
        let best=-1, bestD=40;
        for(let i=0;i<bgNodes.length;i++){
          const vx=bgNodes[i].x+attractOffX[i+LOGO_N];
          const vy=bgNodes[i].y+attractOffY[i+LOGO_N];
          const d=Math.hypot(vx-mx,vy-my);
          if(d<bestD){bestD=d;best=i+LOGO_N;}
        }
        dragIdx=best;
        if(best>=0){
          const n=bgNodes[best-LOGO_N];
          dragGrabX=mx-(n.x+attractOffX[best]);
          dragGrabY=my-(n.y+attractOffY[best]);
        }
        mouse.x=mx; mouse.y=my; mouse.inside=true;
      });
      canvas.addEventListener('pointermove', (e: PointerEvent) => {
        const r=canvas.getBoundingClientRect();
        mouse.x=(e.clientX-r.left-offX)/scale;
        mouse.y=(e.clientY-r.top-offY)/scale;
        mouse.inside=true;
        if(dragIdx>=0){
          const n=bgNodes[dragIdx-LOGO_N];
          attractOffX[dragIdx]=mouse.x-dragGrabX-n.x;
          attractOffY[dragIdx]=mouse.y-dragGrabY-n.y;
          didDrag=true;
          const snapD=Math.hypot(attractOffX[dragIdx],attractOffY[dragIdx]);
          if(!isSnapped&&snapD>SNAP_DIST){
            isSnapped=true;
            const snapT=performance.now()/1000;
            snapAnims=[];
            const[dxP,dyP]=wp(dragIdx);
            for(const e of bgEdges){
              if(e.a!==dragIdx&&e.b!==dragIdx) continue;
              const other=e.a===dragIdx?e.b:e.a;
              const[ox,oy]=wp(other);
              const len=Math.hypot(dxP-ox,dyP-oy)||1;
              snapAnims.push({ox,oy,dx:(dxP-ox)/len,dy:(dyP-oy)/len,st:snapT});
            }
          }
        }
      });
      canvas.addEventListener('pointerup', (e: PointerEvent) => {
        const dist=Math.hypot(e.clientX-downX,e.clientY-downY);
        if(dist<5&&!didDrag){
          const now=performance.now()/1000;
          if(now>=bc.cd&&entDone){bc.st=now;bc.active=true;bc.cd=now+2.5;}
        } else if(isSnapped&&dragIdx>=0){
          finalizeDrop(dragIdx);
        }
        dragIdx=-1;
        isSnapped=false;
      });
      canvas.addEventListener('pointerleave', () => {
        if(isSnapped&&dragIdx>=0) finalizeDrop(dragIdx);
        mouse.inside=false;
        dragIdx=-1;
        isSnapped=false;
      });

      function frame(now) {
        try {
          const t=now/1000;
          update(t);
          render(t);
        } catch(e) { showError(e); }
        requestAnimationFrame(frame);
      }
      if(reducedMotion) { update(0); render(0); }
      else requestAnimationFrame(frame);
    } catch(e) { showError(e); }

    } catch(initErr) { // global error handler
      console.error('Network banner init error:', initErr);
    }
}
