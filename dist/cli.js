#!/usr/bin/env node
"use strict";var $=Object.create;var n=Object.defineProperty;var b=Object.getOwnPropertyDescriptor;var h=Object.getOwnPropertyNames;var k=Object.getPrototypeOf,y=Object.prototype.hasOwnProperty;var a=(r,e)=>n(r,"name",{value:e,configurable:!0});var w=(r,e,s,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of h(e))!y.call(r,i)&&i!==s&&n(r,i,{get:()=>e[i],enumerable:!(t=b(e,i))||t.enumerable});return r};var x=(r,e,s)=>(s=r!=null?$(k(r)):{},w(e||!r||!r.__esModule?n(s,"default",{value:r,enumerable:!0}):s,r));var g=x(require("yargs")),u=require("yargs/helpers");var m="1.1.1";var c=require("@povio/scaffold");var o=require("colorette");var f=a((r,e,s)=>{switch(r.type){case"module-stub":case"module":{switch(e){case"configure":{console.log(`${(0,o.blue)(r.name)} [module:${e}] ${JSON.stringify(s)}`);break}case"message":{console.log(`${(0,o.blue)(r.name)} [module:${e}] ${s.type}: ${s.message}`),s.error&&console.error(s.error);break}case"register":case"status":case"init":break;default:{console.log(`${(0,o.blue)(r.name)} [module:${e}]`),s&&console.log(s);break}}break}case"request":{switch(e){case"message":{console.log(`${(0,o.blue)(r.module.name)} [request:${e}] ${s.type}: ${s.message}`),s.error&&console.error(s.error);break}case"register":case"init":break;default:{console.log(`${(0,o.blue)(r.module.name)} [request:${e}] [match:${r.match}]`),s&&console.log(s);break}}break}case"executor":{switch(e){case"register":break;default:{console.log(`${(0,o.blue)(r.module.name)} [executor:${e}] ${(0,o.magenta)(r.match)}`),s&&console.log(s);break}}break}case"task":{switch(e){case"init":break;case"message":{console.log(`${(0,o.blue)(r.request.module.name)} [task:${e}] ${(0,o.magenta)(r.executor.match)} ${s.type}: ${s.message}`),s.error&&console.error(s.error);break}default:{console.log(`${(0,o.blue)(r.request.module.name)} [task:${e}] ${(0,o.magenta)(r.executor.match)}`),s&&console.log(s);break}}break}case"handler":{switch(e){case"prepared":{console.log(`${(0,o.cyan)("handler")} [handler:${e}] ${s??""}`),Object.values(r.modulesDict).forEach(t=>{let i=t.status==="completed"?o.dim:o.bold;console.log(`${(0,o.blue)(t.name)} ${i(`[status:${t.status}] ${t.description??""}`)}`),Object.values(t.tasks).forEach(l=>{console.log(`${(0,o.blue)(t.name)} [task:${l.executor.match}] [status:${l.status}] ${l.request.description??""}`)})});break}default:break}break}default:console.error(r,e,s)}},"scaffoldingLogger");var d={command:"apply",describe:"apply scaffolding",builder:{cwd:{describe:"Root directory of the project",demandOption:!0,type:"string",default:process.cwd()}},handler:async r=>{try{let e=r.cwd,s=new c.ScaffoldingHandler(e,f);for await(let t of(0,c.findScaffoldFiles)({cwd:e}))s.register(t);await s.init(),s.status!=="error"&&await s.exec()}catch(e){console.error(e),process.exit(1)}}};(0,g.default)((0,u.hideBin)(process.argv)).version(m).scriptName("scaffold").command(d).help().demandCommand(1).strictCommands(!0).showHelpOnFail(!0).fail((r,e)=>{r&&console.log(r),e&&console.error(e),console.log("Use '--help' for more info"),process.exit(1)}).parse();
