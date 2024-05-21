"use strict";var h=Object.defineProperty;var P=Object.getOwnPropertyDescriptor;var $=Object.getOwnPropertyNames;var R=Object.prototype.hasOwnProperty;var a=(i,e)=>h(i,"name",{value:e,configurable:!0});var q=(i,e)=>{for(var o in e)h(i,o,{get:e[o],enumerable:!0})},O=(i,e,o,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of $(e))!R.call(i,s)&&s!==o&&h(i,s,{get:()=>e[s],enumerable:!(t=P(e,s))||t.enumerable});return i};var F=i=>O(h({},"__esModule",{value:!0}),i);var I={};q(I,{ScaffoldingHandler:()=>m,createScaffolding:()=>b,findScaffoldFiles:()=>C});module.exports=F(I);var j=require("ts-morph");var x=require("cosmiconfig"),E=require("debug");var y=(0,E.debug)("scaffold:config");function v(i){let o=(0,x.cosmiconfigSync)("scaffold",{stopDir:i,searchPlaces:[".scaffold/scaffold.config.json",".scaffold/scaffold.config.yaml",".scaffold/scaffold.config.yml",".scaffold/scaffold.config.js",".scaffold/scaffold.config.ts",".scaffold/scaffold.config.cjs","scaffold.config.json","scaffold.config.yaml","scaffold.config.yml","scaffold.config.js","scaffold.config.ts","scaffold.config.cjs"],mergeSearchPlaces:!1}).search(i);return!o||o.isEmpty?(y("no config found"),{}):(y(`using ${o.filepath}`),o.config)}a(v,"loadConfig");var m=class{static{a(this,"ScaffoldingHandler")}cwd;onEvent;modulesDict;moduleStubDict;rawConfig;executors;tasks;tsMorphProject;status;constructor(e=process.cwd(),o=()=>{}){this.cwd=e,this.onEvent=o,this.modulesDict={},this.moduleStubDict={},this.rawConfig={},this.executors=[],this.tasks=[],this.status="uninitialized",this.type="handler",this.tsMorphProject=new j.Project({tsConfigFilePath:`${e}/tsconfig.json`}),this.rawConfig=v(this.cwd)}register(e){if(this.status!=="uninitialized")throw new Error(`Cannot register module after initialization: ${this.status}`);if(!e.name)throw new Error("name is required");if(e.name in this.moduleStubDict)throw new Error(`ScaffoldingModule ${e.name} already exists`);return e.type="module-stub",this.moduleStubDict[e.name]=e,this.onEvent(e,"register"),e}async init(){this.status="configuring",this.onEvent(this,"configuring");for(let t of Object.values(this.moduleStubDict)){let s=t.name in this.rawConfig?this.rawConfig[t.name]:void 0;if(t.configSchema){let{success:c,data:r,error:f}=await t.configSchema.safeParseAsync(s||{});if(!c)throw new Error(`Invalid config for ${t.name}: ${f}`);s=r,this.onEvent(t,"configure",s)}t.config=s}let e=a(t=>({type:"request",messages:[],status:"uninitialised",priority:0,optional:!1,tasks:[],...t}),"createRequest"),o=a(async t=>{if(!["loading-tasks"].includes(this.status))throw new Error("Cannot init request outside of task loading step");t.description||(t.description=t.match);let s=this.executors.filter(c=>c.match===t.match);if(s.length<1&&!t.optional)return t.status="error",this.onEvent(t,"init:error"),t;for(let c of s){let r={type:"task",messages:[],request:t,executor:c,priority:c.priority+t.priority/1e3,status:"uninitialised"},f=a((u,n,g)=>{let d={type:u,message:n,error:g};return r.messages.push(d),this.onEvent(r,"message",d),d},"addMessage"),l=a(async u=>{await u({project:this.tsMorphProject})},"withTsMorph");if(c.init)try{await c.init(r,{addMessage:f,withTsMorph:l})}catch(u){let n={type:"error",message:u.message};r.messages.push(n),this.onEvent(r,"message",n),r.status="error"}r.status==="uninitialised"&&(r.status=c.exec?"queued":"completed"),t.module.tasks.push(r),this.tasks.push(r),r.status==="error"?this.onEvent(r,"init:error"):this.onEvent(r,"init")}return this.onEvent(t,"init"),t},"initRequest");this.status="loading-executors",this.onEvent(this,"loading-executors");for(let t of Object.values(this.moduleStubDict)){let s={...t,type:"module",status:"uninitialised",requests:[],executors:[],messages:[],tasks:[]};this.modulesDict[s.name]=s;let c=a(async u=>{let n=e({...u,module:u.module??s});return s.requests.push(n),this.onEvent(n,"register"),["loading-tasks"].includes(this.status)&&await o(n),n},"addRequest"),r=a(async u=>{if(!["loading-executors"].includes(this.status))throw new Error("Cannot add executor outside of module init");let n={type:"executor",module:s,priority:0,exception:"throw",...u};return s.executors.push(n),this.executors.push(n),this.onEvent(n,"register"),n},"addExecutor"),f=a(u=>{s.status=u,this.onEvent(s,"status")},"setStatus"),l=a((u,n,g)=>{let d={type:u,message:n,error:g};return s.messages.push(d),this.onEvent(s,"message",d),d},"addMessage");if(t.executors&&await Promise.all(t.executors.map(r)),t.requests&&await Promise.all(t.requests.map(c)),s.init)try{await s.init({cwd:this.cwd,modules:this.moduleStubDict,config:s.config},{addRequest:c,addExecutor:r,setStatus:f,addMessage:l})}catch(u){s.status="error";let n={type:"error",message:u.message};s.messages.push(n),this.onEvent(s,"message",n)}if(s.status==="uninitialised")s.status="queued";else if(s.status==="error"){this.onEvent(s,"error");return}else this.onEvent(s,"init")}this.status="loading-tasks",this.onEvent(this,"loading-tasks");for(let t of Object.values(this.modulesDict))await o(e({description:"Before all tasks",match:`${t.name}:#before-all`,module:t,optional:!0}));for(let t of Object.values(this.modulesDict).map(s=>s.requests).flat().toSorted((s,c)=>s.priority-c.priority))await o(t);for(let t of Object.values(this.modulesDict))await o(e({description:"After all tasks",match:`${t.name}:#after-all`,module:t,optional:!0}));this.tasks.some(t=>t.status==="error")||Object.values(this.modulesDict).some(t=>t.status==="error"||t.requests.some(s=>s.status==="error"))?this.status="error":(this.status="prepared",this.onEvent(this,"prepared"))}async exec(){this.status="executing",this.onEvent(this,"executing");let e=this.tasks.filter(o=>o.status==="queued").toSorted((o,t)=>o.priority-t.priority);for(;e.length>0;){let o=e.shift();if(o?.status==="queued"){if(!o.executor.exec)throw new Error(`Queued task ${o.executor.match} does not have an exec method`);try{let t=a((c,r,f)=>{let l={type:c,message:r,error:f};return o.messages.push(l),this.onEvent(o,"message",l),l},"addMessage"),s=a(async c=>{await c({project:this.tsMorphProject})},"withTsMorph");await o.executor.exec(o,{addMessage:t,withTsMorph:s}),o.status="completed"}catch(t){let s={type:"error",message:t.message};if(o.messages.push(s),this.onEvent(o,"message",s),o.status="error",o.executor.exception==="throw")throw t;this.onEvent(o,"exec:error",t)}}}await this.tsMorphProject.save(),this.status="done",this.onEvent(this,"done")}type};function b(i){return i}a(b,"createScaffolding");var S=require("fast-glob"),w=require("interpret"),k=require("path"),D=require("url"),M=require("rechoir");async function T(i){let e;try{e=require(i)}catch(o){let t;try{t=new Function("id","return import(id);")}catch{t=void 0}if(o.code==="ERR_REQUIRE_ESM"&&t){let s=(0,D.pathToFileURL)(i).href;return e=(await t(s)).default,e}throw o}return e&&typeof e=="object"&&"default"in e&&(e=e.default||{}),e||{}}a(T,"tryRequireThenImport");async function z(i){let e=(0,k.extname)(i);if(e===".json"||!Object.keys(w.jsVariants).includes(e))throw new Error(`Unsupported file type: ${e}`);return(0,M.prepare)(w.jsVariants,i),await T(i)}a(z,"loadModule");async function*C(i){for(let e of await(0,S.glob)(["**/.*.scaffold.*","**/.scaffold.*"],{cwd:i.cwd,dot:!0,ignore:["node_modules"]}))try{yield await z(`${i.cwd}/${e}`)}catch(o){console.error(o)}}a(C,"findScaffoldFiles");0&&(module.exports={ScaffoldingHandler,createScaffolding,findScaffoldFiles});
