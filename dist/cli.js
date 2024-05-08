#!/usr/bin/env node
"use strict";var l=Object.create;var n=Object.defineProperty;var m=Object.getOwnPropertyDescriptor;var f=Object.getOwnPropertyNames;var g=Object.getPrototypeOf,y=Object.prototype.hasOwnProperty;var u=(s,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of f(e))!y.call(s,r)&&r!==t&&n(s,r,{get:()=>e[r],enumerable:!(i=m(e,r))||i.enumerable});return s};var w=(s,e,t)=>(t=s!=null?l(g(s)):{},u(e||!s||!s.__esModule?n(t,"default",{value:s,enumerable:!0}):t,s));var p=w(require("yargs")),a=require("yargs/helpers");var c="1.0.2";var o=require("@povio/scaffold"),d={command:"apply",describe:"apply scaffolding",builder:{cwd:{describe:"Root directory of the project",demandOption:!0,type:"string",default:process.cwd()}},handler:async s=>{try{let e=s.cwd,t=new o.ScaffoldingHandler(e);for await(let i of(0,o.findScaffoldFiles)({cwd:e}))t.register(i);await t.init(),await t.exec()}catch(e){console.error(e),process.exit(1)}}};(0,p.default)((0,a.hideBin)(process.argv)).version(c).scriptName("scaffold").command(d).help().demandCommand(1).strictCommands(!0).showHelpOnFail(!0).fail((s,e)=>{s&&console.log(s),e&&console.error(e),console.log("Use '--help' for more info"),process.exit(1)}).parse();
