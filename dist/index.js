"use strict";var l=Object.defineProperty;var $=Object.getOwnPropertyDescriptor;var C=Object.getOwnPropertyNames;var P=Object.prototype.hasOwnProperty;var a=(i,s)=>l(i,"name",{value:s,configurable:!0});var R=(i,s)=>{for(var o in s)l(i,o,{get:s[o],enumerable:!0})},q=(i,s,o,t)=>{if(s&&typeof s=="object"||typeof s=="function")for(let e of C(s))!P.call(i,e)&&e!==o&&l(i,e,{get:()=>s[e],enumerable:!(t=$(s,e))||t.enumerable});return i};var F=i=>q(l({},"__esModule",{value:!0}),i);var z={};R(z,{ScaffoldingHandler:()=>h,createScaffolding:()=>b,findScaffoldFiles:()=>M});module.exports=F(z);var v=require("ts-morph");var x=require("cosmiconfig"),y=require("debug");var w=(0,y.debug)("scaffold:config");function E(i){let o=(0,x.cosmiconfigSync)("scaffold",{stopDir:i,searchPlaces:[".scaffold/scaffold.config.json",".scaffold/scaffold.config.yaml",".scaffold/scaffold.config.yml",".scaffold/scaffold.config.js",".scaffold/scaffold.config.ts",".scaffold/scaffold.config.cjs","scaffold.config.json","scaffold.config.yaml","scaffold.config.yml","scaffold.config.js","scaffold.config.ts","scaffold.config.cjs"],mergeSearchPlaces:!1}).search(i);return!o||o.isEmpty?(w("no config found"),{}):(w(`using ${o.filepath}`),o.config)}a(E,"loadConfig");var h=class{static{a(this,"ScaffoldingHandler")}cwd;onEvent;modulesDict;moduleStubDict;rawConfig;executors;tasks;tsMorphProject;status;constructor(s=process.cwd(),o=()=>{}){this.cwd=s,this.onEvent=o,this.modulesDict={},this.moduleStubDict={},this.rawConfig={},this.executors=[],this.tasks=[],this.status="uninitialized",this.type="handler",this.tsMorphProject=new v.Project({tsConfigFilePath:`${s}/tsconfig.json`}),this.rawConfig=E(this.cwd)}register(s){if(this.status!=="uninitialized")throw new Error(`Cannot register module after initialization: ${this.status}`);if(!s.name)throw new Error("name is required");if(s.name in this.moduleStubDict)throw new Error(`ScaffoldingModule ${s.name} already exists`);return s.type="module-stub",this.moduleStubDict[s.name]=s,this.onEvent(s,"register"),s}async init(){this.status="configuring",this.onEvent(this,"configuring");for(let t of Object.values(this.moduleStubDict)){let e=t.name in this.rawConfig?this.rawConfig[t.name]:void 0;if(t.configSchema){let{success:n,data:r,error:u}=await t.configSchema.safeParseAsync(e||{});if(!n)throw new Error(`Invalid config for ${t.name}: ${u}`);e=r}t.config=e,this.onEvent(t,"configure",e)}let s=a(t=>({type:"request",messages:[],status:"uninitialised",priority:0,optional:!1,tasks:[],...t}),"createRequest"),o=a(async t=>{if(!["loading-tasks"].includes(this.status))throw new Error("Cannot init request outside of task loading step");t.description||(t.description=t.match);let e=this.executors.filter(n=>n.match===t.match);if(e.length<1&&!t.optional){t.status="disabled";let n={type:"info",message:"No executors were matched for non-optional request"};return t.messages.push(n),this.onEvent(t,"message",n),this.onEvent(t,"init"),t}for(let n of e){let r={type:"task",messages:[],request:t,executor:n,priority:n.priority+t.priority/1e3,status:"uninitialised"},u=a((f,c)=>{let d={type:f,message:c};r.messages.push(d),this.onEvent(r,"message",d)},"addMessage"),m=a(async f=>{await f({project:this.tsMorphProject})},"withTsMorph");if(n.init&&await n.init(r,{addMessage:u,withTsMorph:m}),r.status==="uninitialised")r.status=n.exec?"queued":"completed";else if(r.status==="error")throw new Error(`Task ${r.executor.match} failed to init`);t.module.tasks.push(r),this.tasks.push(r),this.onEvent(r,"init")}return this.onEvent(t,"init"),t},"initRequest");this.status="loading-executors",this.onEvent(this,"loading-executors");for(let t of Object.values(this.moduleStubDict)){let e={...t,type:"module",status:"uninitialised",requests:[],executors:[],messages:[],tasks:[]};this.modulesDict[e.name]=e;let n=a(async f=>{let c=s({...f,module:f.module??e});return e.requests.push(c),this.onEvent(c,"register"),["loading-tasks"].includes(this.status)&&await o(c),c},"addRequest"),r=a(async f=>{if(!["loading-executors"].includes(this.status))throw new Error("Cannot add executor outside of module init");let c={type:"executor",module:e,priority:0,exception:"throw",...f};return e.executors.push(c),this.executors.push(c),this.onEvent(c,"register"),c},"addExecutor"),u=a(f=>{e.status=f,this.onEvent(e,"status")},"setStatus"),m=a((f,c)=>{let d={type:f,message:c};e.messages.push(d),this.onEvent(e,"message",d)},"addMessage");if(t.executors&&await Promise.all(t.executors.map(r)),t.requests&&await Promise.all(t.requests.map(n)),e.init&&await e.init({cwd:this.cwd,modules:this.moduleStubDict,config:e.config},{addRequest:n,addExecutor:r,setStatus:u,addMessage:m}),e.status==="uninitialised")e.status="queued";else if(e.status==="error")throw new Error(`Module ${e.name} failed to init`);this.onEvent(e,"init")}this.status="loading-tasks",this.onEvent(this,"loading-tasks");for(let t of Object.values(this.modulesDict))await o(s({description:"Before all tasks",match:`${t.name}:#before-all`,module:t,optional:!0}));for(let t of Object.values(this.modulesDict).map(e=>e.requests).flat().toSorted((e,n)=>e.priority-n.priority))await o(t);for(let t of Object.values(this.modulesDict))await o(s({description:"After all tasks",match:`${t.name}:#after-all`,module:t,optional:!0}));this.status="prepared",this.onEvent(this,"prepared")}async exec(){this.status="executing",this.onEvent(this,"executing");let s=this.tasks.filter(o=>o.status==="queued").toSorted((o,t)=>o.priority-t.priority);for(;s.length>0;){let o=s.shift();if(o?.status==="queued"){if(!o.executor.exec)throw new Error(`Queued task ${o.executor.match} does not have an exec method`);try{this.onEvent(o,"exec:before");let t=a((n,r)=>{let u={type:n,message:r};o.messages.push(u),this.onEvent(o,"message",u)},"addMessage"),e=a(async n=>{await n({project:this.tsMorphProject})},"withTsMorph");await o.executor.exec(o,{addMessage:t,withTsMorph:e}),o.status="completed"}catch(t){let e={type:"error",message:t.message};if(o.messages.push(e),this.onEvent(o,"message",e),o.status="error",o.executor.exception==="throw")throw t;this.onEvent(o,"exec:error",t)}this.onEvent(o,"exec:after")}}await this.tsMorphProject.save(),this.status="done",this.onEvent(this,"done")}type};function b(i){return i}a(b,"createScaffolding");var j=require("fast-glob"),p=require("interpret"),S=require("path"),k=require("url"),D=require("rechoir");async function O(i){let s;try{s=require(i)}catch(o){let t;try{t=new Function("id","return import(id);")}catch{t=void 0}if(o.code==="ERR_REQUIRE_ESM"&&t){let e=(0,k.pathToFileURL)(i).href;return s=(await t(e)).default,s}throw o}return s&&typeof s=="object"&&"default"in s&&(s=s.default||{}),s||{}}a(O,"tryRequireThenImport");async function T(i){let s=(0,S.extname)(i);if(s===".json"||!Object.keys(p.jsVariants).includes(s))throw new Error(`Unsupported file type: ${s}`);return(0,D.prepare)(p.jsVariants,i),await O(i)}a(T,"loadModule");async function*M(i){for(let s of await(0,j.glob)(["**/.*.scaffold.*","**/.scaffold.*"],{cwd:i.cwd,dot:!0,ignore:["node_modules"]}))try{yield await T(`${i.cwd}/${s}`)}catch(o){console.error(o)}}a(M,"findScaffoldFiles");0&&(module.exports={ScaffoldingHandler,createScaffolding,findScaffoldFiles});
