# Language and dependencies

## Decisions

### Language: Rust

The backend is written in Rust.

### Dependency policy: minimal

The backend uses as few external crates as possible. The default answer to "should we add a dependency?" is no. The standard library comes first, and our own code second.

A dependency can be added only when all of these hold:

1. **Clear need.** Writing and maintaining it ourselves would cost far more than depending on it (for example cryptography, where our own code would be a risk).
2. **Small footprint.** It brings few transitive dependencies. Check with `cargo tree` before adding it.
3. **Fits the allocation model.** It does not allocate memory on its own during normal running. See [memory-allocation-model.md](memory-allocation-model.md).
4. **Maintained.** It is actively maintained and has a stable API.
5. **Compatible license.** Its license is compatible with the project's license.

Further rules:

- Disable default features and enable only the features we use.
- Record every direct dependency in the table below, with the reason it was accepted.
- Review the dependency list whenever a dependency is added or upgraded.

### Targets: 32-bit and 64-bit

The backend must run on both 32-bit and 64-bit hosts. 32-bit hardware is still widely used, and some 32-bit architectures have no 64-bit atomic operations, so code must not assume they exist.

## Approved dependencies

| Crate | Used for | Reason accepted |
|---|---|---|
| `redb` | Storing configuration on disk ([configuration.md](configuration.md)) | ACID storage is hard to get right ourselves; pure Rust; synchronous API; only used during boot and configuration, where allocation is allowed |

## Open questions

- **Target platforms.** Which operating systems and CPU architectures, beyond supporting both 32-bit and 64-bit, must the backend run on? Is a `no_std` build ever needed (for example on small embedded hosts), or is `std` always available?
- **Concurrency model.** Plain threads with blocking I/O, or an async runtime? An async runtime would be a large dependency and tends to allocate per task, which conflicts with both this policy and the allocation model. Plain threads, or a small event loop of our own, fit better.
- **Rust edition and minimum supported Rust version (MSRV).**
- **Project license.**
