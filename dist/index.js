"use strict";var v=Object.create;var f=Object.defineProperty;var _=Object.getOwnPropertyDescriptor;var F=Object.getOwnPropertyNames;var R=Object.getPrototypeOf,O=Object.prototype.hasOwnProperty;var c=(s,e)=>f(s,"name",{value:e,configurable:!0});var k=(s,e)=>{for(var o in e)f(s,o,{get:e[o],enumerable:!0})},p=(s,e,o,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of F(e))!O.call(s,r)&&r!==o&&f(s,r,{get:()=>e[r],enumerable:!(t=_(e,r))||t.enumerable});return s};var m=(s,e,o)=>(o=s!=null?v(R(s)):{},p(e||!s||!s.__esModule?f(o,"default",{value:s,enumerable:!0}):o,s)),I=s=>p(f({},"__esModule",{value:!0}),s);var L={};k(L,{ScaffoldingHandler:()=>l,ScaffoldingModule:()=>a,findScaffoldFiles:()=>S,semver:()=>Q,tsMorph:()=>N,zod:()=>V});module.exports=I(L);var x=require("debug");var U=(0,x.debug)("scaffold:module"),a=class{static{c(this,"ScaffoldingModule")}name;requests;executors;version;priority;enabled;configSchema;constructor(e,o=[],t=[]){this.name=e,this.requests=o,this.executors=t,this.version="1.0.0",this.priority=50,this.enabled=!0}async exec(e,o){for await(let t of this.requests)if(!(!t.executors||t.executors.length<1))for(let r of t.executors)r.executor.exec&&(U(`execute ${this.name} -> ${r.executor.match.module} ${r.executor.description?` -> ${r.executor.description}`:""}`),await r.executor.exec({request:t,state:r.context.state},o));return{}}};var b=require("debug"),P=require("ts-morph");var y=require("cosmiconfig"),$=require("debug");var w=(0,$.debug)("scaffold:config");function j(s){let o=(0,y.cosmiconfigSync)("scaffold",{stopDir:s,searchPlaces:[".scaffold/scaffold.config.json",".scaffold/scaffold.config.yaml",".scaffold/scaffold.config.yml",".scaffold/scaffold.config.js",".scaffold/scaffold.config.ts",".scaffold/scaffold.config.cjs","scaffold.config.json","scaffold.config.yaml","scaffold.config.yml","scaffold.config.js","scaffold.config.ts","scaffold.config.cjs"],mergeSearchPlaces:!1}).search(s);return!o||o.isEmpty?(w("no config found"),{}):(w(`using ${o.filepath}`),o.config)}c(j,"loadConfig");var h=(0,b.debug)("scaffold:handler"),l=class{static{c(this,"ScaffoldingHandler")}cwd;tsMorphProject;modulesDict;executors;rawConfig;config;logger(e,o,t){console.log(`[${e}] ${t?`[${t}]`:""} ${o}`)}constructor(e=process.cwd()){this.cwd=e,this.modulesDict={},this.executors=[],this.rawConfig={},this.config={},this.tsMorphProject=new P.Project({tsConfigFilePath:`${e}/tsconfig.json`}),this.rawConfig=j(this.cwd)}register(e){if(!e.name)throw new Error("name is required");if(e.name in this.modulesDict)throw new Error(`ScaffoldingModule ${e.name} already exists`);this.modulesDict[e.name]=e}async init(){let e=Object.values(this.modulesDict);for(let o of e){let t=o.name in this.rawConfig?this.rawConfig[o.name]:void 0;if(o.configSchema){let{success:r,data:i,error:n}=await o.configSchema.safeParseAsync(t||{});if(!r)throw new Error(`Invalid config for ${o.name}: ${n}`);t=i}this.config[o.name]=t,o.init?await o.init({cwd:this.cwd,modules:this.modulesDict,config:t,store:{},arguments:{}},{tsMorphProject:this.tsMorphProject,logger:this.logger}):h(`init* ${o.name}`)}for(let o of e)this.executors.push(...o.executors.map(t=>({...t,match:{...t.match,module:o.name}})));for(let o of e)for(let t of o.requests.filter(r=>Object.keys(r.match).length>0)){t.module=o;let r=[];for await(let i of this.executors)if(!(!i.match||!Object.entries(t.match).every(([n,u])=>i.match[n]===u)))if(i.init){let{disabled:n,state:u}=await i.init({request:t},{tsMorphProject:this.tsMorphProject,logger:this.logger},{disabled:!1,state:{}});n||(h(`init ${o.name}	 -> ${i?.match.module} 	${i?.description?` -> ${i.description}`:""}`),r.push({context:{state:u},executor:i}))}else h(`init* ${o.name}	 -> ${i?.match.module} 	${i?.description?` -> ${i.description}`:""}`),r.push({context:{},executor:i});if(t.executors=r,t.executors.length===0&&!t.optional)throw new Error(`No executors found for ${o.name} ${t.description?` -> ${t.description}`:""}`)}}async exec(){let e=Object.values(this.modulesDict).filter(o=>o.enabled).sort((o,t)=>o.priority-t.priority);for await(let o of e)await o.exec({cwd:this.cwd,modules:this.modulesDict,config:this.config[o.name],store:{},arguments:{}},{tsMorphProject:this.tsMorphProject,logger:this.logger});await this.tsMorphProject.save()}reset(){for(let e in this.modulesDict)delete this.modulesDict[e]}};var M=require("debug"),E=require("fast-glob"),g=require("interpret"),D=require("path"),q=require("url"),C=require("rechoir");var T=(0,M.debug)("scaffold:finder");async function z(s){let e;try{e=require(s)}catch(o){let t;try{t=new Function("id","return import(id);")}catch{t=void 0}if(o.code==="ERR_REQUIRE_ESM"&&t){let r=(0,q.pathToFileURL)(s).href;return e=(await t(r)).default,e}throw o}return e&&typeof e=="object"&&"default"in e&&(e=e.default||{}),e||{}}c(z,"tryRequireThenImport");async function A(s){let e=(0,D.extname)(s);if(e===".json"||!Object.keys(g.jsVariants).includes(e))throw new Error(`Unsupported file type: ${e}`);return(0,C.prepare)(g.jsVariants,s),await z(s)}c(A,"loadModule");async function*S(s){for(let e of await(0,E.glob)(["**/.*.scaffold.*","**/.scaffold.*"],{cwd:s.cwd,dot:!0,ignore:["node_modules"]})){T(`found ${e}`);try{yield await A(`${s.cwd}/${e}`)}catch(o){console.error(o)}}}c(S,"findScaffoldFiles");var N=m(require("ts-morph")),Q=m(require("semver")),V=m(require("zod"));0&&(module.exports={ScaffoldingHandler,ScaffoldingModule,findScaffoldFiles,semver,tsMorph,zod});
