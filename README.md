# Povio Scaffolding

A dynamic scaffolding orchestrator that takes requests and executors from modules,
and applies them to the project structure.

Unlike traditional scaffolding tools, this one is completely agnostic to the project structure, instead
relying on the modules to provide the necessary information.

## Dependencies

- `ts-morph` for TypeScript AST manipulation
- `yargs` for CLI parsing
- `zod` for schema validation
- `yaml` for configuration
- `cosmiconfig` for configuration loading

