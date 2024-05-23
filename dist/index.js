"use strict";var m=Object.defineProperty;var P=Object.getOwnPropertyDescriptor;var $=Object.getOwnPropertyNames;var R=Object.prototype.hasOwnProperty;var n=(i,s)=>m(i,"name",{value:s,configurable:!0});var F=(i,s)=>{for(var o in s)m(i,o,{get:s[o],enumerable:!0})},O=(i,s,o,t)=>{if(s&&typeof s=="object"||typeof s=="function")for(let e of $(s))!R.call(i,e)&&e!==o&&m(i,e,{get:()=>s[e],enumerable:!(t=P(s,e))||t.enumerable});return i};var T=i=>O(m({},"__esModule",{value:!0}),i);var U={};F(U,{ScaffoldingHandler:()=>g,createScaffolding:()=>S,findScaffoldFiles:()=>C});module.exports=T(U);var b=require("ts-morph");var E=require("cosmiconfig"),v=require("debug");var x=(0,v.debug)("scaffold:config");function j(i){let o=(0,E.cosmiconfigSync)("scaffold",{stopDir:i,searchPlaces:[".scaffold/scaffold.config.json",".scaffold/scaffold.config.yaml",".scaffold/scaffold.config.yml",".scaffold/scaffold.config.js",".scaffold/scaffold.config.ts",".scaffold/scaffold.config.cjs","scaffold.config.json","scaffold.config.yaml","scaffold.config.yml","scaffold.config.js","scaffold.config.ts","scaffold.config.cjs"],mergeSearchPlaces:!1}).search(i);return!o||o.isEmpty?(x("no config found"),{}):(x(`using ${o.filepath}`),o.config)}n(j,"loadConfig");var g=class{static{n(this,"ScaffoldingHandler")}cwd;onEvent;modulesDict;moduleStubDict;rawConfig;executors;tasks;requests;tsMorphProject;status;constructor(s=process.cwd(),o=()=>{}){this.cwd=s,this.onEvent=o,this.modulesDict={},this.moduleStubDict={},this.rawConfig={},this.executors=[],this.tasks=[],this.requests=[],this.status="uninitialized",this.type="handler",this.tsMorphProject=new b.Project({tsConfigFilePath:`${s}/tsconfig.json`}),this.rawConfig=j(this.cwd)}register(s){if(this.status!=="uninitialized")throw new Error(`Cannot register module after initialization: ${this.status}`);if(!s.name)throw new Error("name is required");if(s.name in this.moduleStubDict)throw new Error(`ScaffoldingModule ${s.name} already exists`);return s.type="module-stub",this.moduleStubDict[s.name]=s,this.onEvent(s,"register"),s}async init(){this.status="configuring",this.onEvent(this,"configuring");for(let t of Object.values(this.moduleStubDict)){let e=t.name in this.rawConfig?this.rawConfig[t.name]:void 0;if(t.configSchema){let{success:c,data:r,error:f}=await t.configSchema.safeParseAsync(e||{});if(!c)throw new Error(`Invalid config for ${t.name}: ${f}`);e=r,this.onEvent(t,"configure",e)}t.config=e}let s=n(t=>({type:"request",messages:[],status:"uninitialised",priority:0,optional:!1,tasks:[],...t}),"createRequest"),o=n(async t=>{if(!["loading-tasks"].includes(this.status))throw new Error("Cannot init request outside of task loading step");t.description||(t.description=t.match);let e=this.executors.filter(c=>c.match===t.match);if(e.length<1&&!t.optional)return t.status="error",this.onEvent(t,"init:error"),t;for(let c of e){let r={type:"task",messages:[],request:t,executor:c,priority:c.priority+t.priority/1e3,status:"uninitialised"},f=n((a,d,h)=>{let p={type:a,message:d,error:h};return r.messages.push(p),this.onEvent(r,"message",p),p},"addMessage"),l=n(async a=>{await a({project:this.tsMorphProject})},"withTsMorph"),u=!1;if(c.init)try{await c.init(r,{addMessage:f,withTsMorph:l})}catch(a){r.status="error",this.onEvent(r,"init:error",a),u=!0}r.status==="uninitialised"&&(r.status=c.exec?"queued":"completed"),t.module.tasks.push(r),this.tasks.push(r),r.status==="error"?u||this.onEvent(r,"init:error"):this.onEvent(r,"init")}return this.onEvent(t,"init"),t},"initRequest");this.status="loading-executors",this.onEvent(this,"loading-executors");for(let t of Object.values(this.moduleStubDict)){let e={...t,type:"module",status:"uninitialised",requests:[],executors:[],messages:[],tasks:[]};this.modulesDict[e.name]=e;let c=n(async u=>{let a=s({...u,module:u.module??e});return e.requests.push(a),this.requests.push(a),this.requests.sort((d,h)=>d.priority-h.priority),this.onEvent(a,"register"),["loading-tasks"].includes(this.status)&&await o(a),a},"addRequest"),r=n(async u=>{if(!["loading-executors"].includes(this.status))throw new Error("Cannot add executor outside of module init");let a={type:"executor",module:e,priority:0,exception:"throw",...u};return e.executors.push(a),this.executors.push(a),this.onEvent(a,"register"),a},"addExecutor"),f=n(u=>{e.status=u,this.onEvent(e,"status")},"setStatus"),l=n((u,a,d)=>{let h={type:u,message:a,error:d};return e.messages.push(h),this.onEvent(e,"message",h),h},"addMessage");if(t.executors&&await Promise.all(t.executors.map(r)),t.requests&&await Promise.all(t.requests.map(c)),e.init)try{await e.init({cwd:this.cwd,modules:this.moduleStubDict,config:e.config},{addRequest:c,addExecutor:r,setStatus:f,addMessage:l})}catch{this.onEvent(e,"error");return}if(e.status==="uninitialised")e.status="queued";else if(e.status==="error"){this.onEvent(e,"error");return}else this.onEvent(e,"init")}this.status="loading-tasks",this.onEvent(this,"loading-tasks");for(let t of Object.values(this.modulesDict))await o(s({description:"Before all tasks",match:`${t.name}:#before-all`,module:t,optional:!0}));for(;this.requests.length>0;)await o(this.requests.shift());for(let t of Object.values(this.modulesDict))await o(s({description:"After all tasks",match:`${t.name}:#after-all`,module:t,optional:!0}));this.tasks.some(t=>t.status==="error")||Object.values(this.modulesDict).some(t=>t.status==="error"||t.requests.some(e=>e.status==="error"))?this.status="error":(this.status="prepared",this.onEvent(this,"prepared"))}async exec(){this.status="executing",this.onEvent(this,"executing");let s=this.tasks.filter(o=>o.status==="queued").toSorted((o,t)=>o.priority-t.priority);for(;s.length>0;){let o=s.shift();if(o?.status==="queued"){if(!o.executor.exec)throw new Error(`Queued task ${o.executor.match} does not have an exec method`);try{let t=n((c,r,f)=>{let l={type:c,message:r,error:f};return o.messages.push(l),this.onEvent(o,"message",l),l},"addMessage"),e=n(async c=>{await c({project:this.tsMorphProject})},"withTsMorph");await o.executor.exec(o,{addMessage:t,withTsMorph:e}),o.status="completed"}catch(t){if(o.status="error",this.onEvent(o,"exec:error",t),o.executor.exception==="throw")throw t}}}await this.tsMorphProject.save(),this.status="done",this.onEvent(this,"done")}type};function S(i){return i}n(S,"createScaffolding");var k=require("fast-glob"),y=require("interpret"),D=require("path"),M=require("url"),q=require("rechoir");async function z(i){let s;try{s=require(i)}catch(o){let t;try{t=new Function("id","return import(id);")}catch{t=void 0}if(o.code==="ERR_REQUIRE_ESM"&&t){let e=(0,M.pathToFileURL)(i).href;return s=(await t(e)).default,s}throw o}return s&&typeof s=="object"&&"default"in s&&(s=s.default||{}),s||{}}n(z,"tryRequireThenImport");async function I(i){let s=(0,D.extname)(i);if(s===".json"||!Object.keys(y.jsVariants).includes(s))throw new Error(`Unsupported file type: ${s}`);return(0,q.prepare)(y.jsVariants,i),await z(i)}n(I,"loadModule");async function*C(i){for(let s of await(0,k.glob)(["**/.*.scaffold.*","**/.scaffold.*"],{cwd:i.cwd,dot:!0,ignore:["node_modules"]}))try{yield await I(`${i.cwd}/${s}`)}catch(o){console.error(o)}}n(C,"findScaffoldFiles");0&&(module.exports={ScaffoldingHandler,createScaffolding,findScaffoldFiles});
