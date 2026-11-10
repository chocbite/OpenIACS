# Registry primitives

## Purpose

Primitives are the simplest kinds of item in the [registry](registry.md): each one holds a single piece of fixed-size data, such as a boolean or a number. They are the basic building blocks for monitoring, control, linking, logging and presentation in the UI.

## Decisions

### Primitives never block

**Reading and writing a primitive must be completely non-blocking.** This is the most important property of primitives, because they are used everywhere in running-phase code, including in time-critical paths.

- No mutex or other lock is ever taken to read or write a primitive.
- **The writer never waits.** The owner (the only writer, see [Owners](registry.md#owners)) writes the data without waiting for readers, other threads or I/O.
- **Readers never wait for the writer.** A reader always gets a complete, consistent value without waiting on a lock held by another thread.
- **No I/O on the write path.** Writing a nonvolatile primitive never waits for the disk; saving it happens in the background (see [Nonvolatile storage](#nonvolatile-storage)).

### Data types

| Type | Description |
|---|---|
| `bool` | True or false |
| `i64` | 64-bit signed integer |
| `f64` | 64-bit floating point |
| Decimal fixed point | An `i64` plus a number of decimals set in configuration. For example `12345` with 2 decimals means `123.45`. Used for exact decimal quantities that floating point cannot represent exactly. |

Not included, on purpose:

- **8- and 16-bit integers.** Converting device data of those sizes is the job of the item's owner. The memory saved is negligible.
- **Unsigned integers.** `i64` holds every `u32` exactly. The top half of `u64` is rarely needed and can be handled by the owner.
- **`i32` and `f32`.** On 64-bit hosts there is no performance difference, and every extra numeric type adds conversion rules for links. On 32-bit hosts the extra cost of 64-bit arithmetic is small compared with everything else involved in updating a value. If measurements on real target hardware show a need, 32-bit types can be added later without breaking changes.

### Two kinds: volatile and nonvolatile

Primitives come in two item kinds, each with its own registry:

- **Volatile primitives** live only in memory. Their data is lost when the host restarts.
- **Nonvolatile primitives** are saved to disk, and their data survives a restart.

The **data type is configuration** of the item, not part of its kind. Changing a primitive's data type does not change its ID. Changing between volatile and nonvolatile does: it means creating a new item.

### Reading and writing on 32-bit hosts

All data types fit in 64 bits.

- Where the platform has 64-bit atomic operations, primitives are read and written with them.
- Where it does not (some 32-bit architectures), primitives use a **seqlock**: the owner increments a 32-bit sequence counter before and after writing the data, and a reader retries if the counter changed while it was reading. The writer never waits and readers never block, so the [non-blocking rule](#primitives-never-block) still holds.

Which method is used is decided at compile time (`cfg(target_has_atomic = "64")`). The types, behaviour, API and logs are the same on every platform.

### Nonvolatile storage

Nonvolatile data is runtime data, not configuration, so it is **not stored in the configuration database**. Writing to that database while running would break the [allocation model](memory-allocation-model.md).

#### File layout

- Nonvolatile primitives are stored in one file of **fixed-size slots**, mapped one to one with the ID: the slot for an item is at offset `id × slot_size`.
- Each slot holds **two copies** of *data (64 bits) + sequence number + checksum*. A write goes to the older copy. At boot the newest copy with a valid checksum wins, so a write cut off by power loss falls back to the previous value instead of garbage.
- When a nonvolatile primitive is created (a configuration change), its slot is written with the initial value, extending the file if needed. Boot never reads an uninitialized slot.
- IDs are never reused, so deleted items leave unused slots in the file. This costs only disk space (well under 1 MB for 100,000 IDs) and no RAM, since slots are written at their offset and the file is not kept in memory.

#### Background writer

- The owner writes the data in memory only. A background writer saves changed slots to the file.
- To protect flash storage (SD cards, eMMC) from wear, each primitive is written to disk **at most once per write interval**, plus on a clean shutdown.
- A power loss can therefore lose changes made within the last write interval. This is accepted.

## Open questions

- **Kind names.** What the two kinds are called in the stored ID form (for example `prim` and `nvprim`).
- **Write interval.** What the default write interval is, and whether it can be set per primitive.
- **Changing the data type of a nonvolatile primitive.** Is the stored data converted to the new type, or reset to an initial value?
- **Fixed-size strings.** Proposed: strings with a fixed capacity in bytes (UTF-8), stored as length + bytes, with writes longer than the capacity rejected. They can be non-blocking with a seqlock, since the owner is the only writer. Since different capacities would break `offset = id × slot_size`, strings would come in fixed capacity classes (for example 16, 32, 64, 128 and 256 bytes), each its own kind with its own registry and file. Changing a string's capacity class would mean creating a new item.
