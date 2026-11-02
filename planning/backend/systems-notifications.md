# Systems notifications

## Purpose

Systems notifications tell users about conditions in the host itself that make it run in a less than optimal way. Examples:

- memory is not locked in RAM (see [memory-allocation-model.md](memory-allocation-model.md));
- an allocation happened during the running phase;
- the default passcode has not been changed.

Systems notifications are used **only** for this kind of information. They are not responses to user requests: for example "configuration change rejected" is an error returned to the user who made the change, because there is no ongoing condition behind it.

## Decisions

### Host level only

Systems notifications belong to the host they are raised on. They are never shared with or collected at cluster level, as there is no need.

### Immutable and either active or not

- Each systems notification is **immutable**: its category and message are fixed when it is declared.
- At runtime, a notification is either **active** (the condition holds) or **inactive** (it does not). There is nothing else to it.
- A notification clears itself when its condition goes away. There is no acknowledgement by users.
- Each notification counts how many times it has been activated, and records when it last changed state. This is cheap, and helps spot conditions that come and go.

### Categories

Every systems notification has exactly one category, which says what it affects:

| Category | Used for | Example |
|---|---|---|
| **Safety** | Anything that could harm the safety of the system or undermine the guarantees it is built on | Memory not locked in RAM; an allocation during the running phase |
| **Security** | Anything that weakens the security of the system | The default passcode has not been changed |
| **Performance** | Anything that makes performance worse | |

When notifications are sorted, the order is safety, then security, then performance.

Internal faults (software bugs detected at runtime, such as an allocation during the running phase) are **safety** notifications.

### Design: a global intrusive linked list

There is no predefined table of notifications. Instead:

- A `SystemNotification` struct can be **declared anywhere in the code**: as a `static` in any module, or inside an object created during configuration (for example a per-peer "host unreachable" notification inside that host's structure).
- The struct carries its own link pointers (an *intrusive* list). **Activating** a notification links it into one global list of active notifications; **deactivating** it unlinks it.
- Linking and unlinking never allocate, so the list has **no allocation and no limit**, and notifications can be raised from running-phase code.
- Objects that own notifications can be created and removed during configuration, so notifications can come and go with the configuration.
- Notifications that need details (such as which host is unreachable) live inside the object they are about, and get their details from it, so the notification itself stays immutable.

Example declaration:

```rust
static MEMORY_NOT_LOCKED: SystemNotification =
    SystemNotification::new(Category::Safety, "Memory is not locked in RAM");
```

#### Rules

1. **Protected by a mutex.** The list is protected by a `std::sync::Mutex` in a `static`. A lock-free list with removal from the middle is hard to get right, and notifications rarely change state, so a lock costs nothing that matters. The standard `Mutex` does not allocate on the supported platforms.
2. **A notification never moves while linked.** A `static` is fine. A notification inside a configuration object must be in its own fixed allocation (for example a `Box` that is never moved, enforced with `Pin`), never directly inside a `Vec` or other structure that can move its contents.
3. **A notification unlinks itself when dropped.** Its `Drop` implementation removes it from the list, so the list can never point at freed memory.
4. **Doubly linked.** Deactivating is a direct unlink, without walking the list.
5. **The lock is held briefly and never while calling out.** Activate, deactivate and reading the list touch only the list. Nothing else is called while the lock is held, so it cannot deadlock with other locks.
6. **Lock poisoning is handled.** If the mutex reports that it is poisoned, the list recovers and carries on; it is never unwrapped.
7. **The `unsafe` code stays in one small module**, behind a safe API: `activate()`, `deactivate()` and "iterate active notifications".

#### Reading the notifications

The HTTP server shows the active notifications to users by walking the list under the lock and copying them into its preallocated response buffer.

#### Inactive notifications are not visible

Only active notifications are in the list, so there is no way to list every notification that could happen, or to see the activation count of an inactive one. This is accepted for now. If it is ever needed, it can be added later without breaking changes.

## Open questions

*(none at the moment)*
