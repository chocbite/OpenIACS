# Backend planning

Planning documents for the OpenIACS backend. Each distinct part of the design has its own file.

| Document | Covers |
|---|---|
| [overview.md](overview.md) | What the backend does and the distributed cluster model |
| [language-and-dependencies.md](language-and-dependencies.md) | Rust as the language and the minimal dependency policy |
| [memory-allocation-model.md](memory-allocation-model.md) | The boot and configuration-time allocation model |

## Conventions for these documents

- One distinct part per file. When a topic grows large enough to stand on its own, give it a new file and link it from this index.
- Each document separates **decisions** (settled) from **open questions** (not settled). Do not turn an open question into a decision without the project owner agreeing.
- The documents describe OpenIACS on its own terms. They do not refer to or compare with other systems.
