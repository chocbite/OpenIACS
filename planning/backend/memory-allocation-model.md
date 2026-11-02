# Memory allocation model

## Decision: boot and configuration-time allocation

Heap memory may be allocated (and freed) only during two phases:

1. **Boot.** The host starts, loads its stored configuration and allocates everything it needs.
2. **Configuration.** A user changes the configuration of the system. The memory the change needs is allocated, and memory that is no longer needed is freed.

The rest of the time the host is in the **running** phase, where no allocation or deallocation happens. All work is done in memory that already exists.

## Decision: the program never crashes

The backend must not crash under any circumstances. This applies to the allocation model in two ways:

- **Breaking the allocation rule must not crash the program.** An allocation during the running phase is a bug, but it is reported, not punished with an abort.
- **Running out of memory must not crash the program.** When memory cannot be allocated during configuration, the change is rejected and the program carries on. When it happens during boot, the boot is stopped in a controlled way (see [During boot](#during-boot)).

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

Configuration can happen at any time, and only when a user triggers it (see [configuration.md](configuration.md)). The host does not stop while a change is applied. Only the thread applying the change holds the configuration permit and may allocate; everything else keeps running in the running phase (see [Enforcement](#enforcement)).

## What this means for the code

- **Structures are sized by configuration.** Collections get their size from the configuration and never grow while running. Adding more than the capacity while running is a handled condition, not a reallocation.
- **Structures may grow during configuration.** Not everything needs a hard limit. When a configuration change needs more room (for example a user adds a host to the cluster), vectors and other allocation-backed structures may grow. They must grow with fallible allocation, so that if it fails, the structure is left exactly as it was, the existing allocation keeps working, and an error is returned that is passed back up to the user.
- **Names and text are configuration data.** Names of values and other strings are created at configuration time. While running, code refers to them by ID or by reference, not by building new strings.
- **Preallocated buffers for I/O.** Network and device buffers are allocated up front with fixed maximum sizes. Messages larger than the maximum are rejected.
- **No implicit allocation while running.** Standard library features that allocate behind the scenes are not used on running-phase code paths. Examples are `format!`, `.to_string()`, `Vec::push` beyond capacity, `HashMap` growth, `Box::new` and spawning threads.
- **Logging writes into preallocated buffers.** Log and diagnostic output must not build heap strings while running.
- **Running out of capacity is defined behaviour.** When a preallocated pool or queue is full, the code does something explicit, such as rejecting the request, dropping with a counter, or applying back-pressure. It never falls back to allocating.
- **Explicit thread stack sizes.** Every thread is created with an explicit, small stack size, because all memory is locked in RAM (see [Decision: lock memory in RAM](#decision-lock-memory-in-ram-protect-against-the-oom-killer-require-overcommit-off)).
- **Only fallible allocation, even in boot and configuration.** By default Rust aborts the process when an allocation fails. That is a crash, so every allocation must go through an API that returns an error instead (for example `Vec::try_reserve` / `try_with_capacity`). Infallible allocating calls such as `Vec::push` without reserved capacity, `Box::new`, `String::from` and `collect()` are not allowed anywhere. Some standard types have no stable fallible constructor, so the backend will need small wrappers of its own for them.

## Enforcement

The rule is enforced by the program itself, not only by code review.

- The backend installs its own **global allocator** that wraps the system allocator and checks whether allocation is currently allowed.
- Allocation is allowed when the host is in the boot phase, or when the **calling thread holds the configuration permit**. Tracking this per thread means that a configuration change on one thread does not silently permit allocations on other threads that keep running.
- An allocation or deallocation outside an allowed phase is a bug, but the allocator **still serves it**, because refusing it would make Rust abort. Instead it:
  - increments a violation counter;
  - writes a fault record (thread, size, time) into a preallocated fault buffer, without allocating anything itself;
  - activates a **safety** systems notification (see [systems-notifications.md](systems-notifications.md)).
- This is the same in debug, test and release builds. No build ever aborts on a violation.
- **Tests fail on violations.** A test runs the system in the running phase under load and fails if the violation counter is not zero. This catches the bug during development without the program itself ever crashing.

This also checks dependencies: any crate that allocates during running will be caught.

## Allocation failure

### During configuration

A configuration change is applied as a whole or not at all:

1. Allocate everything the new configuration needs, using fallible allocation only. This includes growing existing structures.
2. If any allocation fails, free what was allocated for the change, keep the old configuration running unchanged, and tell the user the change was rejected because there was not enough memory.
3. Only when every allocation has succeeded does the host switch to the new configuration and free the memory the old one no longer needs.

The host is never left half-configured.

### During boot

Configuration files are only ever written by the backend itself, during the configuration phase. Editing them by hand is **not a supported use case**.

The backend is intended for devices whose hardware and memory do not change over their lifetime. It is therefore **assumed that the same amount of memory is available at every boot** as when the configuration was saved.

Every configuration the backend saves has already been fully allocated during the configuration phase, so it is known to fit. If allocation then fails while loading the stored configuration at boot, it is treated as the files having been changed outside the backend. The same applies if the assumption above does not hold, for example because the memory on the device has been reduced. In every case:

1. The boot is aborted. The host does not enter the running phase.
2. Everything allocated so far is released, and the program exits in a controlled way with a clear error message and a distinct exit code saying that the stored configuration could not be loaded.

A controlled abort of the boot is not a crash: it is a deliberate, reported refusal to start with a configuration it cannot load.

### Memory that the operating system promises but does not deliver

#### The problem

Allocating memory does not by itself give the program physical RAM. The operating system only records that the program may use a range of addresses, and assigns RAM the first time each page (4 KB) is written. Systems can promise more memory than they have (*overcommit*). If RAM has run out when a page is first written, the allocation cannot fail anymore. Instead the operating system kills a process (the *OOM killer*), which for us is a crash.

Even when the memory exists, the operating system can later:

- move rarely used pages to swap space on disk, so the next access waits for the disk;
- drop pages of the program's code and libraries and reload them from the executable later;
- kill the backend because *another* process used up the memory, since the OOM killer picks its victim by size and score, not by who caused the shortage.

None of these fit "never crashes" or predictable timing.

#### Decision: portable baseline plus platform hardening

The protection is split into two layers.

**Layer 1: portable baseline (all platforms).** The backend's own global allocator (the same one that enforces the phases, see [Enforcement](#enforcement)) **touches every allocation**: right after memory is obtained from the system allocator, it writes one byte every 4 KB. This is plain Rust with no platform-specific code, and it covers every page even on systems with larger pages. Every heap allocation has physical RAM behind it from the moment it is made.

The baseline alone does not make failure clean (with overcommit on, a touch that finds no RAM gets the process killed instead of returning an error), does not stop swapping, does not protect against the OOM killer, and does not cover memory the allocator never sees (thread stacks, code, static data). That is what layer 2 is for.

**Layer 2: platform hardening (where supported).** A small platform module provides a single function, `harden_memory()`, called at the start of boot. Supporting a new platform means writing that one function for it. On Linux it does the following:

1. **Lock all memory in RAM.** Calls `mlockall(MCL_CURRENT | MCL_FUTURE)`. This pins everything the process has mapped (data, stacks, code and libraries) and everything it maps later. Pinned pages are never swapped out or dropped, and every later allocation gets physical RAM at the moment it is made, so a shortage shows up as a failed allocation, which the fallible allocation rules already handle. (This makes the layer 1 touching redundant on Linux, but it is kept so behaviour is the same on every platform.)
2. **Protect the process from the OOM killer.** Sets its own OOM score adjustment to the minimum (`/proc/self/oom_score_adj` = `-1000`), so it is never chosen to be killed.
3. **Check that overcommit is off.** The device should be set up with `vm.overcommit_memory = 2`, so the operating system refuses memory it does not have instead of promising it. The commit limit (`vm.overcommit_ratio` or `vm.overcommit_kbytes`) must be sized for the device.
4. **Check that pinned pages are not moved.** The device should be set up with `vm.compact_unevictable_allowed = 0`, so the kernel does not briefly pause the backend to move pinned pages while defragmenting memory.

Production devices run with high permissions and are set up so that all of these succeed.

#### Decision: missing hardening gives warnings, not a refused boot

The backend must also run on a developer's own PC for testing, where the platform may not support hardening, the program may not have high permissions, or the system settings differ. So:

- If the platform has no `harden_memory()` implementation, or any step of it fails or finds a setting that is not as required, **the host still boots and runs**.
- For each missing feature, the backend activates a **safety** systems notification that names what is missing (for example "Memory is not locked in RAM"). It stays active as long as the condition lasts. See [systems-notifications.md](systems-notifications.md).
- Layer 1 always applies, whatever the platform.

#### Consequences

- **No slowdown while running.** Pinned memory is ordinary RAM. Running-phase code never waits on page faults, swapping or reloading of code.
- **Slower boot and configuration.** RAM is assigned to every page when locking starts and when each allocation is made. This cost falls only in the phases where allocation is allowed.
- **Everything mapped uses real RAM**, including memory that is reserved but rarely used. In particular:
  - **Every thread is created with an explicit, small stack size.** The default (about 8 MB on Linux) would otherwise be fully pinned per thread.
  - Nothing may reserve large areas of memory "just in case". This applies to dependencies too.
- **Less RAM for the rest of the device.** Pinned pages can never be reclaimed. The device must have enough memory for the backend's pinned footprint plus the operating system and anything else that runs on it.

## Things that seem to need runtime memory

Some events happen while running and could seem to need new memory. Each one must be bounded by a configured limit, or treated as a configuration event:

- **A new client connects** (for example the frontend). Bounded by a configured maximum number of clients, with their buffers preallocated.
- **A host joins the cluster.** This is a configuration change, triggered by a user, so structures may grow to make room for it. **A host rejoining** after being unreachable uses resources that were already allocated when it was added, so it needs no new memory.
- **Incoming messages of varying size.** Bounded by a configured maximum message size.
- **History or event logs.** Stored in fixed-size ring buffers or preallocated storage.

## Limits

Maximums vary a lot between different parts of the system and are not set in these planning documents. Where a part needs a hard limit, it is set in the configuration and documented with that part. Not everything needs one: structures that only grow through configuration changes can grow as needed (see [What this means for the code](#what-this-means-for-the-code)).

## Open questions

- **Dependencies that allocate infallibly.** Some dependencies used during boot and configuration, such as redb ([configuration.md](configuration.md)), allocate with calls that make Rust abort if memory runs out. During configuration that would be a crash. Options include keeping a reserve of free memory that the allocator can fall back on, so the dependency's allocation succeeds and the change is then rolled back, or accepting the risk for these dependencies.
