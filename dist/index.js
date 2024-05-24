"use strict";var h=Object.defineProperty;var $=Object.getOwnPropertyDescriptor;var b=Object.getOwnPropertyNames;var z=Object.prototype.hasOwnProperty;var n=(r,t)=>h(r,"name",{value:t,configurable:!0});var C=(r,t)=>{for(var e in t)h(r,e,{get:t[e],enumerable:!0})},R=(r,t,e,s)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of b(t))!z.call(r,o)&&o!==e&&h(r,o,{get:()=>t[o],enumerable:!(s=$(t,o))||s.enumerable});return r};var P=r=>R(h({},"__esModule",{value:!0}),r);var S={};C(S,{Handler:()=>l,createScaffolding:()=>E,findScaffoldFiles:()=>j});module.exports=P(S);var _=require("ts-morph");var x=require("cosmiconfig"),w=require("debug");var p=(0,w.debug)("scaffold:config");function y(r){let e=(0,x.cosmiconfigSync)("scaffold",{stopDir:r,searchPlaces:[".scaffold/scaffold.config.json",".scaffold/scaffold.config.yaml",".scaffold/scaffold.config.yml",".scaffold/scaffold.config.js",".scaffold/scaffold.config.ts",".scaffold/scaffold.config.cjs","scaffold.config.json","scaffold.config.yaml","scaffold.config.yml","scaffold.config.js","scaffold.config.ts","scaffold.config.cjs"],mergeSearchPlaces:!1}).search(r);return!e||e.isEmpty?(p("no config found"),{}):(p(`using ${e.filepath}`),e.config)}n(y,"loadConfig");var i;(function(r){r.registered="registered",r.configured="configured",r.uninitialized="uninitialized",r.queued="queued",r.delegated="delegated",r.disabled="disabled",r.conforming="conforming",r.executed="executed",r.errored="errored"})(i||(i={}));var c=class{static{n(this,"Module")}handler;constructor(t,e){this.handler=e,this._status=i.uninitialized,this.name=t.name,this.version=t.version??"1.0.0",this.description=t.description,this.messages=[],this._init=t.init,this.tasks=[],this.configSchema=t.configSchema,this.config=t.config,this._requests=t.requests??[],this._executors=t.executors??[],this.requests=[],this.executors=[],this.exception=t.exception??"ignore",this.handler.onEvent(i.registered,this,t)}get id(){return this.name}name;version;description;_status;get status(){return this._status}set status(t){this._status!==t&&(this._status=t,this.handler.onEvent(t,this))}messages;addMessage(t,e,s){let o={type:t,message:e,error:s,status:this.status};return this.messages.push(o),this.handler.onEvent("message",this,o),o}_requests;_executors;requests;executors;tasks;configSchema;config;async initConfig(t){if(this.configSchema){let{success:e,data:s,error:o}=await this.configSchema.safeParseAsync(t||{});if(!e)throw new Error(`Invalid config for ${this.name}: ${o}`);this.config=s,this.handler.onEvent(i.configured,this,t)}}async runInit(t,e){if(this.status!=="uninitialized")throw new Error("Module has already been initialized");let s={...e,addMessage:(...o)=>this.addMessage(...o),setStatus:o=>{this.status=o}};try{this._executors&&await Promise.all(this._executors.map(s.addExecutor)),this._requests&&await Promise.all(this._requests.map(s.addRequest)),this._init&&await this._init(t,s),this.status===i.uninitialized&&(this.status=this.requests.length<1&&this.executors.length<1?i.disabled:i.queued)}catch(o){if(this.status=i.errored,this.addMessage("error","Error while initializing module",o),this.exception==="throw")throw o}}_init;exception},u=class{static{n(this,"Request")}handler;constructor(t,e,s){this.handler=s,this._status=i.uninitialized,this._description=t.description,this.match=t.match,this.value=t.value,this.optional=t.optional??!1,this.messages=[],this.tasks=[],t.priority?this.priority=t.priority:t.match.includes("#after-all")?this.priority=100:t.match.includes("#before-all")?this.priority=-100:this.priority=0,this.module=t.module??e,e.requests.push(this),this.id=s.makeId(`${this.module.id}:request`),this.handler.onEvent(i.registered,this,t)}id;module;_description;get description(){return this._description||this.match}set description(t){this._description=t}match;value;optional;priority;_status;get status(){return this._status}set status(t){this._status!==t&&(this._status=t,this.handler.onEvent(t,this))}addMessage(t,e,s){let o={type:t,message:e,error:s,status:this.status};return this.messages.push(o),this.handler.onEvent("message",this,o),o}messages;tasks},d=class{static{n(this,"Executor")}module;handler;constructor(t,e,s){this.module=e,this.handler=s,this.status=i.registered,this.module=e,this.description=t.description,this.match=t.match,this.priority=t.priority??0,this.exception=t.exception??"ignore",this._exec=t.exec,this._init=t.init,this.module.executors.push(this),this.id=s.makeId(`${this.module.id}:executor`),this.handler.onEvent(i.registered,this)}id;description;match;priority;get init(){return this._init}_init;exception;get exec(){return this._exec}status;_exec},f=class{static{n(this,"Task")}handler;executor;request;constructor(t,e,s,o){this.handler=e,this.executor=s,this.request=o,this._status=i.uninitialized,this.messages=[],this.priority=s.priority+o.priority/1e3,this.id=e.makeId(`${this.request.module.id}:task`),this.handler.onEvent(i.registered,this)}id;get description(){switch(!0){case!!this._description:return this._description;case!!this.request.description:return this.request.description;case!!this.executor.description:return this.executor.description;case!!this.executor.module.description:return`${this.executor.module.description}`;default:return`match:${this.executor.match}`}}set description(t){this._description=t}_description;async runInit(t){if(this.executor.init)try{await this.executor.init(this,{...t,addMessage:(...e)=>this.addMessage(...e)}),this.status===i.uninitialized&&(this.status=this.executor.exec?i.queued:i.conforming)}catch(e){if(this.status=i.errored,this.addMessage("error","Error while task init",e),this.executor.exception==="throw")throw e}else this.status=this.executor.exec?i.queued:i.conforming}async runExec(t){if(!this.executor.exec)throw new Error(`No exec function defined for ${this.executor.id}`);try{await this.executor.exec(this,{...t,addMessage:(...e)=>this.addMessage(...e)}),this.status===i.queued&&(this.status=i.executed)}catch(e){if(this.status=i.errored,this.addMessage("error","Error while task exec",e),this.executor.exception==="throw")throw e}}_status;get status(){return this._status}set status(t){t==="completed"&&(t=i.conforming),this._status!==t&&(this._status=t,this.handler.onEvent(t,this))}messages;addMessage(t,e,s){let o={type:t,message:e,error:s,status:this.status};return this.messages.push(o),this.handler.onEvent("message",this,o),o}priority;data};var l=class{static{n(this,"Handler")}cwd;onEvent;modulesDict;rawConfig;executors;requestQueue;tasks;tsMorphProject;step;_status;description;constructor(t=process.cwd(),e=()=>{}){this.cwd=t,this.onEvent=e,this.modulesDict={},this.rawConfig={},this.executors=[],this.requestQueue=[],this.tasks=[],this.step="initializing",this._status=i.uninitialized,this.description="Scaffolding Handler",this.ids={},this.tsMorphProject=new _.Project({tsConfigFilePath:`${t}/tsconfig.json`}),this.rawConfig=y(this.cwd),this.status=i.registered}register(t){if(!t.name||t.name in this.modulesDict)throw new Error(`Can not register module "${t.name??"[missing name]"}"`);return this.modulesDict[t.name]=new c(t,this),t}async registerRequest(t,e){let s=new u(t,e,this);return this.requestQueue.push(s),this.requestQueue.sort((o,g)=>o.priority-g.priority),s}async registerExecutor(t,e){if(!["loading-executors"].includes(this.step))throw new Error("Cannot add executor outside of module init");let s=new d(t,e,this);return this.executors.push(s),s}async initTasks(t){if(!["loading-tasks"].includes(this.step))throw new Error("Cannot init request outside of task loading step");t.description||(t.description=t.match);let e=this.executors.filter(s=>s.match===t.match);if(e.length<1)return t.optional?t.status=i.disabled:(t.status=i.errored,t.addMessage("error",`No executors found for request ${t.match}`)),t;for(let s of e){let o=new f({},this,s,t);await o.runInit({withTsMorph:async g=>{await g({project:this.tsMorphProject})}}),o.status===i.queued&&this.tasks.push(o),t.tasks.push(o)}return t.status=t.tasks.some(s=>[i.queued,i.delegated].includes(s.status))?i.queued:i.disabled,t}set status(t){this._status!==t&&(this._status=t,this.onEvent(t,this))}get status(){return this._status}async init(){this.step="loading-configs";for(let t of Object.values(this.modulesDict))await t.initConfig(t.name in this.rawConfig?this.rawConfig[t.name]:{});this.step="loading-executors";for(let t of Object.values(this.modulesDict))await t.runInit({cwd:this.cwd,modules:this.modulesDict,config:t.config},{addRequest:e=>this.registerRequest(e,t),addExecutor:e=>this.registerExecutor(e,t)});for(let t of this.executors.filter(e=>e.match.endsWith(":#before-all")||e.match.endsWith(":#after-all")))await this.registerRequest({description:t.description||`run ${t.match.endsWith(":#before-all")?"before":"after"} for ${t.module.name}`,match:t.match},t.module);for(this.step="loading-tasks";this.requestQueue.length>0;)await this.initTasks(this.requestQueue.shift());if(this.requestQueue.length>0)throw new Error("Request queue was not emptied");if(Object.values(this.modulesDict).some(t=>t.status===i.uninitialized))throw new Error("Modules were not initialized");if(Object.values(this.modulesDict).some(t=>t.requests.some(e=>e.status===i.uninitialized)))throw new Error("Requests were not initialized");this.step=this.tasks.length>0?"queued":"conforming",this.status=this.tasks.length>0?i.queued:i.conforming}async exec(){this.step="executing";let t=this.tasks.toSorted((e,s)=>e.priority-s.priority);for(;t.length>0;){let e=t.shift();if(e?.status!=="queued")throw new Error("Task is not queued");await e.runExec({withTsMorph:async s=>{await s({project:this.tsMorphProject})}})}await this.tsMorphProject.save(),this.step="executed",this.status=i.executed}ids;makeId(t){return this.ids[t]||(this.ids[t]=0),`${t}#${this.ids[t]++}`}get id(){return"handler"}};function E(r){return r}n(E,"createScaffolding");var q=require("fast-glob"),m=require("interpret"),k=require("path"),v=require("url"),M=require("rechoir");async function I(r){let t;try{t=require(r)}catch(e){let s;try{s=new Function("id","return import(id);")}catch{s=void 0}if(e.code==="ERR_REQUIRE_ESM"&&s){let o=(0,v.pathToFileURL)(r).href;return t=(await s(o)).default,t}throw e}return t&&typeof t=="object"&&"default"in t&&(t=t.default||{}),t||{}}n(I,"tryRequireThenImport");async function D(r){let t=(0,k.extname)(r);if(t===".json"||!Object.keys(m.jsVariants).includes(t))throw new Error(`Unsupported file type: ${t}`);return(0,M.prepare)(m.jsVariants,r),await I(r)}n(D,"loadModule");async function*j(r){for(let t of await(0,q.glob)(["**/.*.scaffold.*","**/.scaffold.*"],{cwd:r.cwd,dot:!0,ignore:["node_modules"]}))try{yield await D(`${r.cwd}/${t}`)}catch(e){console.error(e)}}n(j,"findScaffoldFiles");0&&(module.exports={Handler,createScaffolding,findScaffoldFiles});
