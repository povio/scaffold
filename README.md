# Povio Scaffolding

A dynamic scaffolding orchestrator that takes requests and executors from modules,
and applies them to the project structure.

Unlike traditional scaffolding tools, this one is completely agnostic to the project structure, instead of
relying on the modules to provide the necessary information.

## Dependencies

- `ts-morph` for TypeScript AST manipulation
- `zod` for schema validation
- `interpret` and `rechoir` for module loading

## Plugins

We ship these plugins that can be used in configurations:

- `lodash`
- `ts-morph`
- `zod`
- `debug`
- `semver`
- `yaml`
- `colorette`
