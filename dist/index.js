"use strict";var a=Object.defineProperty;var C=Object.getOwnPropertyDescriptor;var v=Object.getOwnPropertyNames;var _=Object.prototype.hasOwnProperty;var c=(s,e)=>a(s,"name",{value:e,configurable:!0});var F=(s,e)=>{for(var o in e)a(s,o,{get:e[o],enumerable:!0})},O=(s,e,o,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of v(e))!_.call(s,i)&&i!==o&&a(s,i,{get:()=>e[i],enumerable:!(t=C(e,i))||t.enumerable});return s};var R=s=>O(a({},"__esModule",{value:!0}),s);var U={};F(U,{ScaffoldingHandler:()=>u,ScaffoldingModule:()=>d,findScaffoldFiles:()=>S});module.exports=R(U);var p=require("debug");var g=(0,p.debug)("scaffold:module"),d=class{static{c(this,"ScaffoldingModule")}name;requests;executors;version;priority;enabled;configSchema;config;constructor(e,o=[],t=[]){this.name=e,this.requests=o,this.executors=t,this.version="1.0.0",this.priority=50,this.enabled=!0}async exec(e,o){for await(let t of this.requests){if(!t.executors||t.executors.length<1){g(`no executors on ${this.name} for request ${t.description||JSON.stringify(t.match)}`);continue}for(let i of t.executors)!i.executor.exec||i.disabled||(g(`execute ${this.name} -> ${i.executor.match.module} ${i.executor.description?` -> ${i.executor.description}`:""}`),await i.executor.exec({request:t,state:i.context.state},o))}return{}}};var b=require("debug"),j=require("ts-morph");var w=require("cosmiconfig"),$=require("debug");var x=(0,$.debug)("scaffold:config");function y(s){let o=(0,w.cosmiconfigSync)("scaffold",{stopDir:s,searchPlaces:[".scaffold/scaffold.config.json",".scaffold/scaffold.config.yaml",".scaffold/scaffold.config.yml",".scaffold/scaffold.config.js",".scaffold/scaffold.config.ts",".scaffold/scaffold.config.cjs","scaffold.config.json","scaffold.config.yaml","scaffold.config.yml","scaffold.config.js","scaffold.config.ts","scaffold.config.cjs"],mergeSearchPlaces:!1}).search(s);return!o||o.isEmpty?(x("no config found"),{}):(x(`using ${o.filepath}`),o.config)}c(y,"loadConfig");var f=(0,b.debug)("scaffold:handler"),u=class{static{c(this,"ScaffoldingHandler")}cwd;tsMorphProject;modulesDict;executors;rawConfig;config;logger(e,o,t){console.log(`[${e}] ${t?`[${t}]`:""} ${o}`)}constructor(e=process.cwd()){this.cwd=e,this.modulesDict={},this.executors=[],this.rawConfig={},this.config={},this.tsMorphProject=new j.Project({tsConfigFilePath:`${e}/tsconfig.json`}),this.rawConfig=y(this.cwd)}register(e){if(!e.name)throw new Error("name is required");if(e.name in this.modulesDict)throw new Error(`ScaffoldingModule ${e.name} already exists`);this.modulesDict[e.name]=e}async init(){let e=Object.values(this.modulesDict);for(let o of e){let t=o.name in this.rawConfig?this.rawConfig[o.name]:void 0;if(o.configSchema){let{success:i,data:r,error:n}=await o.configSchema.safeParseAsync(t||{});if(!i)throw new Error(`Invalid config for ${o.name}: ${n}`);t=r}this.config[o.name]=t,o.config=t}for(let o of e)o.init?(f(`init ${o.name}`),await o.init({cwd:this.cwd,modules:this.modulesDict,config:this.config[o.name]||{},store:{},arguments:{}},{tsMorphProject:this.tsMorphProject,logger:this.logger})):f(`init* ${o.name}`);for(let o of e)this.executors.push(...o.executors.map(t=>({...t,match:{...t.match,module:o.name}})));for(let o of e)for(let t of o.requests.filter(i=>Object.keys(i.match).length>0)){t.module=o;let i=[];for await(let r of this.executors)if(!(!r.match||!Object.entries(t.match).every(([n,m])=>r.match[n]===m)))if(r.init){let{disabled:n,state:m}=await r.init({request:t},{tsMorphProject:this.tsMorphProject,logger:this.logger},{disabled:!1,state:{}});f(n?`disabled ${o.name}	 -> ${r?.match.module} 	${r?.description?` -> ${r.description}`:""}`:`init ${o.name}	 -> ${r?.match.module} 	${r?.description?` -> ${r.description}`:""}`),i.push({disabled:!!n,context:{state:m},executor:r})}else f(`init* ${o.name}	 -> ${r?.match.module} 	${r?.description?` -> ${r.description}`:""}`),i.push({disabled:!1,context:{},executor:r});if(t.executors=i,t.executors.length===0&&!t.optional)throw new Error(`No executors found for ${o.name} ${t.description?` -> ${t.description}`:""}`)}}async exec(){let e=Object.values(this.modulesDict).filter(o=>o.enabled).sort((o,t)=>o.priority-t.priority);for await(let o of e)await o.exec({cwd:this.cwd,modules:this.modulesDict,config:this.config[o.name],store:{},arguments:{}},{tsMorphProject:this.tsMorphProject,logger:this.logger});await this.tsMorphProject.save()}reset(){for(let e in this.modulesDict)delete this.modulesDict[e]}};var P=require("debug"),E=require("fast-glob"),h=require("interpret"),M=require("path"),q=require("url"),D=require("rechoir");var K=(0,P.debug)("scaffold:finder");async function k(s){let e;try{e=require(s)}catch(o){let t;try{t=new Function("id","return import(id);")}catch{t=void 0}if(o.code==="ERR_REQUIRE_ESM"&&t){let i=(0,q.pathToFileURL)(s).href;return e=(await t(i)).default,e}throw o}return e&&typeof e=="object"&&"default"in e&&(e=e.default||{}),e||{}}c(k,"tryRequireThenImport");async function I(s){let e=(0,M.extname)(s);if(e===".json"||!Object.keys(h.jsVariants).includes(e))throw new Error(`Unsupported file type: ${e}`);return(0,D.prepare)(h.jsVariants,s),await k(s)}c(I,"loadModule");async function*S(s){for(let e of await(0,E.glob)(["**/.*.scaffold.*","**/.scaffold.*"],{cwd:s.cwd,dot:!0,ignore:["node_modules"]}))try{yield await I(`${s.cwd}/${e}`)}catch(o){console.error(o)}}c(S,"findScaffoldFiles");0&&(module.exports={ScaffoldingHandler,ScaffoldingModule,findScaffoldFiles});
