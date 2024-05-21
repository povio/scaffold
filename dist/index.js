"use strict";var m=Object.defineProperty;var C=Object.getOwnPropertyDescriptor;var P=Object.getOwnPropertyNames;var $=Object.prototype.hasOwnProperty;var a=(i,s)=>m(i,"name",{value:s,configurable:!0});var R=(i,s)=>{for(var o in s)m(i,o,{get:s[o],enumerable:!0})},F=(i,s,o,t)=>{if(s&&typeof s=="object"||typeof s=="function")for(let e of P(s))!$.call(i,e)&&e!==o&&m(i,e,{get:()=>s[e],enumerable:!(t=C(s,e))||t.enumerable});return i};var O=i=>F(m({},"__esModule",{value:!0}),i);var I={};R(I,{ScaffoldingHandler:()=>g,createScaffolding:()=>b,findScaffoldFiles:()=>q});module.exports=O(I);var j=require("ts-morph");var x=require("cosmiconfig"),E=require("debug");var y=(0,E.debug)("scaffold:config");function v(i){let o=(0,x.cosmiconfigSync)("scaffold",{stopDir:i,searchPlaces:[".scaffold/scaffold.config.json",".scaffold/scaffold.config.yaml",".scaffold/scaffold.config.yml",".scaffold/scaffold.config.js",".scaffold/scaffold.config.ts",".scaffold/scaffold.config.cjs","scaffold.config.json","scaffold.config.yaml","scaffold.config.yml","scaffold.config.js","scaffold.config.ts","scaffold.config.cjs"],mergeSearchPlaces:!1}).search(i);return!o||o.isEmpty?(y("no config found"),{}):(y(`using ${o.filepath}`),o.config)}a(v,"loadConfig");var g=class{static{a(this,"ScaffoldingHandler")}cwd;onEvent;modulesDict;moduleStubDict;rawConfig;executors;tasks;requests;tsMorphProject;status;constructor(s=process.cwd(),o=()=>{}){this.cwd=s,this.onEvent=o,this.modulesDict={},this.moduleStubDict={},this.rawConfig={},this.executors=[],this.tasks=[],this.requests=[],this.status="uninitialized",this.type="handler",this.tsMorphProject=new j.Project({tsConfigFilePath:`${s}/tsconfig.json`}),this.rawConfig=v(this.cwd)}register(s){if(this.status!=="uninitialized")throw new Error(`Cannot register module after initialization: ${this.status}`);if(!s.name)throw new Error("name is required");if(s.name in this.moduleStubDict)throw new Error(`ScaffoldingModule ${s.name} already exists`);return s.type="module-stub",this.moduleStubDict[s.name]=s,this.onEvent(s,"register"),s}async init(){this.status="configuring",this.onEvent(this,"configuring");for(let t of Object.values(this.moduleStubDict)){let e=t.name in this.rawConfig?this.rawConfig[t.name]:void 0;if(t.configSchema){let{success:c,data:r,error:h}=await t.configSchema.safeParseAsync(e||{});if(!c)throw new Error(`Invalid config for ${t.name}: ${h}`);e=r,this.onEvent(t,"configure",e)}t.config=e}let s=a(t=>({type:"request",messages:[],status:"uninitialised",priority:0,optional:!1,tasks:[],...t}),"createRequest"),o=a(async t=>{if(!["loading-tasks"].includes(this.status))throw new Error("Cannot init request outside of task loading step");t.description||(t.description=t.match);let e=this.executors.filter(c=>c.match===t.match);if(e.length<1&&!t.optional)return t.status="error",this.onEvent(t,"init:error"),t;for(let c of e){let r={type:"task",messages:[],request:t,executor:c,priority:c.priority+t.priority/1e3,status:"uninitialised"},h=a((u,n,d)=>{let f={type:u,message:n,error:d};return r.messages.push(f),this.onEvent(r,"message",f),f},"addMessage"),l=a(async u=>{await u({project:this.tsMorphProject})},"withTsMorph");if(c.init)try{await c.init(r,{addMessage:h,withTsMorph:l})}catch(u){let n={type:"error",message:u.message};r.messages.push(n),this.onEvent(r,"message",n),r.status="error"}r.status==="uninitialised"&&(r.status=c.exec?"queued":"completed"),t.module.tasks.push(r),this.tasks.push(r),r.status==="error"?this.onEvent(r,"init:error"):this.onEvent(r,"init")}return this.onEvent(t,"init"),t},"initRequest");this.status="loading-executors",this.onEvent(this,"loading-executors");for(let t of Object.values(this.moduleStubDict)){let e={...t,type:"module",status:"uninitialised",requests:[],executors:[],messages:[],tasks:[]};this.modulesDict[e.name]=e;let c=a(async u=>{let n=s({...u,module:u.module??e});return e.requests.push(n),this.requests.push(n),this.requests.sort((d,f)=>d.priority-f.priority),this.onEvent(n,"register"),["loading-tasks"].includes(this.status)&&await o(n),n},"addRequest"),r=a(async u=>{if(!["loading-executors"].includes(this.status))throw new Error("Cannot add executor outside of module init");let n={type:"executor",module:e,priority:0,exception:"throw",...u};return e.executors.push(n),this.executors.push(n),this.onEvent(n,"register"),n},"addExecutor"),h=a(u=>{e.status=u,this.onEvent(e,"status")},"setStatus"),l=a((u,n,d)=>{let f={type:u,message:n,error:d};return e.messages.push(f),this.onEvent(e,"message",f),f},"addMessage");if(t.executors&&await Promise.all(t.executors.map(r)),t.requests&&await Promise.all(t.requests.map(c)),e.init)try{await e.init({cwd:this.cwd,modules:this.moduleStubDict,config:e.config},{addRequest:c,addExecutor:r,setStatus:h,addMessage:l})}catch(u){e.status="error";let n={type:"error",message:u.message};e.messages.push(n),this.onEvent(e,"message",n)}if(e.status==="uninitialised")e.status="queued";else if(e.status==="error"){this.onEvent(e,"error");return}else this.onEvent(e,"init")}this.status="loading-tasks",this.onEvent(this,"loading-tasks");for(let t of Object.values(this.modulesDict))await o(s({description:"Before all tasks",match:`${t.name}:#before-all`,module:t,optional:!0}));for(;this.requests.length>0;)await o(this.requests.shift());for(let t of Object.values(this.modulesDict))await o(s({description:"After all tasks",match:`${t.name}:#after-all`,module:t,optional:!0}));this.tasks.some(t=>t.status==="error")||Object.values(this.modulesDict).some(t=>t.status==="error"||t.requests.some(e=>e.status==="error"))?this.status="error":(this.status="prepared",this.onEvent(this,"prepared"))}async exec(){this.status="executing",this.onEvent(this,"executing");let s=this.tasks.filter(o=>o.status==="queued").toSorted((o,t)=>o.priority-t.priority);for(;s.length>0;){let o=s.shift();if(o?.status==="queued"){if(!o.executor.exec)throw new Error(`Queued task ${o.executor.match} does not have an exec method`);try{let t=a((c,r,h)=>{let l={type:c,message:r,error:h};return o.messages.push(l),this.onEvent(o,"message",l),l},"addMessage"),e=a(async c=>{await c({project:this.tsMorphProject})},"withTsMorph");await o.executor.exec(o,{addMessage:t,withTsMorph:e}),o.status="completed"}catch(t){let e={type:"error",message:t.message};if(o.messages.push(e),this.onEvent(o,"message",e),o.status="error",o.executor.exception==="throw")throw t;this.onEvent(o,"exec:error",t)}}}await this.tsMorphProject.save(),this.status="done",this.onEvent(this,"done")}type};function b(i){return i}a(b,"createScaffolding");var S=require("fast-glob"),w=require("interpret"),k=require("path"),D=require("url"),M=require("rechoir");async function T(i){let s;try{s=require(i)}catch(o){let t;try{t=new Function("id","return import(id);")}catch{t=void 0}if(o.code==="ERR_REQUIRE_ESM"&&t){let e=(0,D.pathToFileURL)(i).href;return s=(await t(e)).default,s}throw o}return s&&typeof s=="object"&&"default"in s&&(s=s.default||{}),s||{}}a(T,"tryRequireThenImport");async function z(i){let s=(0,k.extname)(i);if(s===".json"||!Object.keys(w.jsVariants).includes(s))throw new Error(`Unsupported file type: ${s}`);return(0,M.prepare)(w.jsVariants,i),await T(i)}a(z,"loadModule");async function*q(i){for(let s of await(0,S.glob)(["**/.*.scaffold.*","**/.scaffold.*"],{cwd:i.cwd,dot:!0,ignore:["node_modules"]}))try{yield await z(`${i.cwd}/${s}`)}catch(o){console.error(o)}}a(q,"findScaffoldFiles");0&&(module.exports={ScaffoldingHandler,createScaffolding,findScaffoldFiles});
