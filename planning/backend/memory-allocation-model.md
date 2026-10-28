# Memory allocation model

## Decision: boot and configuration-time allocation

Heap memory may be allocated (and freed) only during two phases:

1. **Boot.** The host starts, loads its stored configuration and allocates everything it needs.
2. **Configuration.** A user changes the configuration of the system. The memory the change needs is allocated, and memory that is no longer needed is freed.

The rest of the time the host is in the **running** phase, where no allocation or deallocation happens. All work is done in memory that already exists.

## Decision: the program never crashes

The backend must not crash under any circumstances. This applies to the allocation model in two ways:

- **Breaking the allocation rule must not crash the program.** An allocation during the running phase is a bug, but it is reported, not punished with an abort.
- **Running out of memory must not crash the program.** When memory cannot be allocated during boot or configuration, the program handles it and carries on.

Both are described below.

## Why

- **Predictable behaviour.** The time an operation takes does not depend on the allocator. This matters for alarms and control.
- **No slow decay over long uptimes.** Memory cannot fragment or leak gradually while the system runs for months.
- **Out-of-memory only happens at expected moments.** If memory runs out, it happens during boot or while a user is making a change. Someone is there to see it and react, and the change can be rejected cleanly. It cannot happen at 3 a.m. in the middle of handling an alarm.
- **Known footprint.** After boot or a configuration change, the memory use of the host is known and fixed until the next change.

## Phases

```
          boot                  configuration change
 start ─────────▶ running ◀──────────────────────────▶ configuration
        (alloc allowed)   (no alloc)               (alloc allowed)
```

- **Boot → running.** Once everything is allocated, the host enters the running phase.
- **Running → configuration → running.** A user change moves the host into the configuration phase. The change is applied and the host returns to running.

## What this means for the code

- **Fixed-capacity structures.** Collections are sized from the configuration and never grow while running. Adding more than the capacity is a handled condition, not a reallocation.
- **Names and text are configuration data.** Names of values and other strings are created at configuration time. While running, code refers to them by ID or by reference, not by building new strings.
- **Preallocated buffers for I/O.** Network and device buffers are allocated up front with fixed maximum sizes. Messages larger than the maximum are rejected.
- **No implicit allocation while running.** Standard library features that allocate behind the scenes are not used on running-phase code paths. Examples are `format!`, `.to_string()`, `Vec::push` beyond capacity, `HashMap` growth, `Box::new` and spawning threads.
- **Logging writes into preallocated buffers.** Log and diagnostic output must not build heap strings while running.
- **Running out of capacity is defined behaviour.** When a preallocated pool or queue is full, the code does something explicit, such as rejecting the request, dropping with a counter, or applying back-pressure. It never falls back to allocating.
- **Only fallible allocation, even in boot and configuration.** By default Rust aborts the process when an allocation fails. That is a crash, so every allocation must go through an API that returns an error instead (for example `Vec::try_reserve` / `try_with_capacity`). Infallible allocating calls such as `Vec::push` without reserved capacity, `Box::new`, `String::from` and `collect()` are not allowed anywhere. Some standard types have no stable fallible constructor, so the backend will need small wrappers of its own for them.

## Enforcement

The rule is enforced by the program itself, not only by code review.

- The backend installs its own **global allocator** that wraps the system allocator and checks whether allocation is currently allowed.
- Allocation is allowed when the host is in the boot phase, or when the **calling thread holds the configuration permit**. Tracking this per thread means that a configuration change on one thread does not silently permit allocations on other threads that keep running.
- An allocation or deallocation outside an allowed phase is a bug, but the allocator **still serves it**, because refusing it would make Rust abort. Instead it:
  - increments a violation counter;
  - writes a fault record (thread, size, time) into a preallocated fault buffer, without allocating anything itself;
  - raises it as an **internal fault** that is visible to users of the system, like any other alarm.
- This is the same in debug, test and release builds. No build ever aborts on a violation.
- **Tests fail on violations.** A test runs the system in the running phase under load and fails if the violation counter is not zero. This catches the bug during development without the program itself ever crashing.

This also checks dependencies: any crate that allocates during running will be caught.

## Allocation failure

### During configuration

A configuration change is applied as a whole or not at all:

1. Allocate everything the new configuration needs, using fallible allocation only.
2. If any allocation fails, free what was allocated for the change, keep the old configuration running unchanged, and tell the user the change was rejected because there was not enough memory.
3. Only when every allocation has succeeded does the host switch to the new configuration and free the memory the old one no longer needs.

The host is never left half-configured.

### During boot

If the stored configuration cannot be allocated at boot, the host must still come up and stay reachable, so that a user can see what went wrong and fix it. How it does that is an open question (see below).

### Memory that the operating system promises but does not deliver

Some operating systems hand out memory that does not physically exist yet, and fill it only when it is first used. If the memory is not there at that point, the operating system can kill the process, which counts as a crash. To make sure such a failure shows up during boot or configuration and not later while running, the backend **touches all memory it allocates** (writes to every page) before it uses it. Whether more is needed is an open question.

## Things that seem to need runtime memory

Some events happen while running and could seem to need new memory. Each one must be bounded by a configured limit, or treated as a configuration event:

- **A new client connects** (for example the frontend). Bounded by a configured maximum number of clients, with their buffers preallocated.
- **A host joins the cluster.** Bounded by a configured maximum cluster size, or handled as a configuration change.
- **Incoming messages of varying size.** Bounded by a configured maximum message size.
- **History or event logs.** Stored in fixed-size ring buffers or preallocated storage.

## Open questions

- **Boot with a configuration that does not fit.** Should the host fall back to a minimal built-in configuration that only keeps it reachable (for example cluster membership and configuration access), or load as much of the stored configuration as fits and report the rest as faulty?
- **Memory the operating system promises but does not deliver.** Is touching every page enough, or should the backend also lock its memory in RAM, and should the deployment documentation require a specific operating system memory setting?
- **Scope of a configuration change.** Does the whole host pause while configuration is applied, or only the parts affected by the change keep running and the rest continue?
- **Cluster-wide configuration.** Is a configuration change applied to all hosts together, or can each host be configured on its own?
- **Who may trigger the configuration phase.** Only users through the frontend, or also automated actions such as a host joining?
- **Limits and defaults.** What are the default maximums (clients, cluster size, message size, number of values per host), and are they all set in configuration?
