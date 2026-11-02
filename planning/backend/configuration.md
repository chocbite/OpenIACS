# Configuration

## Decisions

### Configuration defines the production system

The configuration is the definition of the system as it runs in production: which hosts are in the cluster, which values exist, and everything else that shapes what the system does. Anything that changes the production system is a configuration change.

### Only users change configuration

- A configuration change happens **only when a user triggers it**.
- **No automation changes configuration.** Nothing the system does on its own, and no rule, schedule or event, may change the configuration.
- Example: **a host joining the cluster is a configuration change**, and only happens when a user adds it. **A host rejoining** (a known host coming back after being unreachable) is not a configuration change. The resources to handle it are already allocated from when the host was added.

### Users configure through a web frontend

Users make configuration changes through a web-based frontend, which talks to a simple HTTP server in the backend. The HTTP server will get its own document.

### Configuration can happen at any time

A user can change the configuration at any time while the system is running. There is no maintenance window, and the parts of the host not affected by the change keep running while it is applied. The memory side of this is described in [memory-allocation-model.md](memory-allocation-model.md).

### Configuration is local to each host

Each host has its own configuration, and a change applies only to the host it is made on.

### Only the backend writes configuration files

Configuration files are written only by the backend, as part of a configuration change. Editing them by hand is not a supported use case. See [During boot](memory-allocation-model.md#during-boot) for what happens if they are changed anyway.

### The backend validates every change

The backend checks every incoming configuration change in full before anything is allocated or applied. An invalid change is rejected with an error, and nothing changes.

### Storage: redb

Configuration is stored on disk in a [redb](https://github.com/cberner/redb) database: an embedded, pure Rust database with a synchronous API and ACID transactions.

- The database is used **only during boot and configuration**, where allocation is allowed. At boot the configuration is read from it; a configuration change is written to it in one transaction.
- **While running, the database is never touched.** All runtime copies of the configuration live directly in memory.
- A configuration change is committed to the database as part of applying it, so the stored configuration and the running one always match.
- redb's in-memory cache is set to an explicit, small size, since all memory is locked in RAM (see [memory-allocation-model.md](memory-allocation-model.md)).

### Changes are all-or-nothing

A configuration change is either applied fully or not at all. If it cannot be applied, for example because memory cannot be allocated, the host keeps running the configuration it had and the user gets an error explaining why. See [During configuration](memory-allocation-model.md#during-configuration).

## Open questions

- **redb and allocation failure.** redb, like most Rust code, allocates with calls that make Rust abort the process if memory runs out. During boot that ends the same way as a controlled abort would. During a configuration change it would be a crash, which breaks the no-crash rule. How to handle it is undecided (see [memory-allocation-model.md](memory-allocation-model.md)).
