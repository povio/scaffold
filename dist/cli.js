#!/usr/bin/env node
"use strict";var u=Object.create;var n=Object.defineProperty;var $=Object.getOwnPropertyDescriptor;var b=Object.getOwnPropertyNames;var y=Object.getPrototypeOf,k=Object.prototype.hasOwnProperty;var l=(s,e)=>n(s,"name",{value:e,configurable:!0});var w=(s,e,t,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of b(e))!k.call(s,i)&&i!==t&&n(s,i,{get:()=>e[i],enumerable:!(r=$(e,i))||r.enumerable});return s};var x=(s,e,t)=>(t=s!=null?u(y(s)):{},w(e||!s||!s.__esModule?n(t,"default",{value:s,enumerable:!0}):t,s));var g=x(require("yargs")),h=require("yargs/helpers");var d="1.1.1";var a=require("@povio/scaffold");var o=require("colorette");var m=l((s,e,t)=>{switch(s.type){case"module-stub":case"module":{switch(e){case"message":{console.log(`${(0,o.blue)(s.name)} [module:${e}] ${t.type}: ${t.message}`);break}case"init":break;default:{console.log(`${(0,o.blue)(s.name)} [module:${e}] ${t??""}`);break}}break}case"request":{switch(e){case"register":case"init":break;default:{console.log(`${(0,o.blue)(s.module.name)} [request:${e}] ${s.match} ${t??""}`);break}}break}case"executor":{switch(e){default:{console.log(`${(0,o.blue)(s.module.name)} [executor:${e}] ${(0,o.magenta)(s.match)}  ${t??""}`);break}}break}case"task":{switch(e){default:{console.log(`${(0,o.blue)(s.request.module.name)} [task:${e}] ${(0,o.magenta)(s.executor.match)} ${t??""}`);break}}break}case"handler":{switch(e){case"prepared":{console.log(`${(0,o.cyan)("handler")} [handler:${e}] ${t??""}`),Object.values(s.modulesDict).forEach(r=>{let i=r.status==="completed"?o.dim:o.bold;console.log(`${(0,o.blue)(r.name)} ${i(`[status:${r.status}] ${r.description??""}`)}`),Object.values(r.tasks).forEach(c=>{console.log(`${(0,o.blue)(r.name)} [task:${c.executor.match}] [status:${c.status}] ${c.request.description??""}`)})});break}default:{console.log(`${(0,o.cyan)("handler")} [handler:${e}] ${t}`);break}}break}default:console.error(s,e,t)}},"scaffoldingLogger");var f={command:"apply",describe:"apply scaffolding",builder:{cwd:{describe:"Root directory of the project",demandOption:!0,type:"string",default:process.cwd()}},handler:async s=>{try{let e=s.cwd,t=new a.ScaffoldingHandler(e,m);for await(let r of(0,a.findScaffoldFiles)({cwd:e}))t.register(r);await t.init(),await t.exec()}catch(e){console.error(e),process.exit(1)}}};(0,g.default)((0,h.hideBin)(process.argv)).version(d).scriptName("scaffold").command(f).help().demandCommand(1).strictCommands(!0).showHelpOnFail(!0).fail((s,e)=>{s&&console.log(s),e&&console.error(e),console.log("Use '--help' for more info"),process.exit(1)}).parse();
