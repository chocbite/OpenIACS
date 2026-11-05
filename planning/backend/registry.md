# Registry

## Terms

- **Item:** anything in the system that has a permanent identity and can be linked to, logged and shown in the UI. Items come in different **kinds**: for example a value holding data (an `i32`, an `f64`, a string), or something abstract that exists to link functionality together, such as a printer or an SMS modem.
- **Registry:** the system that ties item IDs to the item objects in the running code.

## Decisions

### The registry only handles identity

The registry is responsible for IDs and for finding the item an ID refers to, nothing else. Everything else about an item (its data, behaviour, configuration and how it is logged or shown) is specific to its kind and described with that kind.

### Owners

Every item has exactly one **owner**: a struct in the running code that represents the lifetime of the item. The owner is an internal concept only. It is not visible to users, and it is never stored.

- **Creating an item returns its owner.** The owner struct cannot be copied or cloned, so an item can never have more than one owner.
- **The owner has exclusive rights to mutate the item.** Anything else in the program that wants to change the item must go through the owner, which can deny the request. What can be mutated, and how requests to the owner work, is specific to each item kind.
- **The owner provides methods for interacting with the item**, specific to each item kind.
- **Dropping the owner deletes the item**, in the same way as a Rust `Drop`. The item's slot is freed, and every handle to it becomes stale (see [Handles](#handles-how-running-code-refers-to-items)). Since this frees memory, owners are only dropped during boot or configuration (see [memory-allocation-model.md](memory-allocation-model.md)).
- **Ownership never changes.** An item cannot be handed over to a new owner.
- **Owners are recreated at boot.** The code that recreates an item from the stored configuration gets its owner back. Only the item's permanent ID is stored.

### Item metadata

Which metadata an item has is specific to its kind, but **any change to an item's metadata is a configuration change** (see [configuration.md](configuration.md)). Basic metadata shared by all items, such as a name, is not decided yet.

### One registry per item kind

Each item kind has its own registry, with its own ID counter.

- IDs only need to be unique **within one registry**. `value#5` and `printer#5` can both exist without colliding.
- In code, each registry has its own ID and handle types (for example `ValueId` and `PrinterId`), so IDs of different kinds can never be mixed up.
- An item's kind is fixed when it is created and **never changes**. Changing the kind means creating a new item.
- The kind is the kind of item (`value`, `printer`, `sms`), not its data type. Changing a value's data type, for example from `i32` to `i64`, does not change its ID.

### Permanent IDs

- When a user creates an item, it gets the next number from its registry's counter.
- The counter is a 64-bit integer stored in the configuration database. It only ever increases, so an ID is **never reused**, even after its item is deleted. Old log entries and links can never end up pointing at a different item.

### Host IDs

- Each host gets a **host ID** when it is added to the cluster. It is generated (a random 64-bit number written as a short text string), checked for uniqueness when the host is added, and stored in the host's configuration.
- A host ID **never changes**.
- Each host also has a **friendly name** for display, which users can change freely. Nothing stores it as a reference.

### Stored form and display form

An item ID has two representations outside the software.

**Stored form**, used for configuration, links, logs and the HTTP API:

```
<kind>#<number>@<host-id>
```

For example `value#1042@k3f9x2qm`.

- `<kind>` is the name of the item's registry.
- `<number>` is the item's permanent ID in that registry.
- `<host-id>` is the permanent host ID of the host that owns the item.
- `<kind>` and `<host-id>` only use `a-z`, `0-9`, `_` and `-`, so `#` and `@` never appear inside them and the form is unambiguous to parse.

**Display form**, used only by the frontend: the item shown with its own name and the host's friendly name, for example *"Boiler temperature" on "Boiler room"*. Names can be changed without breaking anything, because they are never stored as references.

The HTTP API returns both: the stored ID, so the frontend can link to the item and refer back to it, and the current friendly names to show. The frontend never builds IDs itself.

Inside a host, the host part is not needed for its own items: the ID is just the number within its registry.

### Handles: how running code refers to items

Permanent IDs are for the world outside the running code. Running code uses **handles** instead.

- Each registry stores its items in a **compact array of slots**. Slots of deleted items are reused, so the array is only as large as the number of items that exist, however high the ID counter has gone.
- A handle is **slot index + generation**. Each slot has a generation number that increases every time the slot is reused. A handle to a deleted item is then detected as stale instead of silently pointing at the item that replaced it.
- Handles exist only in memory and are never stored or shown outside the software.

### Links are resolved at configuration time

- When configuration is loaded at boot or changed, every stored link (for example `value#1042@k3f9x2qm`) is translated once into a handle.
- Running code follows handles directly to the slot, with no lookup by permanent ID.
- Each registry also has a **permanent ID → handle** lookup for the boundaries, for example when the frontend asks for `value#1042`. It is a sorted array or a hashmap, built during configuration, so lookups while running do not allocate.

### Stale links do nothing

Deleting an item that other configuration links to is allowed. Links to it become **stale**, and a stale link safely **does nothing**:

- What "nothing" means is specific to each item kind.
- A stale link never crashes and never reaches a different item (see [Handles](#handles-how-running-code-refers-to-items)).
- The same applies at boot: a stored link to an item that no longer exists is resolved to a stale link instead of stopping the boot.

### Logs

Log files belong to one host, so log entries store only the item's number within its registry, which is compact and fixed-size. The full stored form is produced when entries are shown or exported.

## Open questions

- **Basic metadata.** Which metadata, if any, all items have in common (for example a name).
- **Links to items on other hosts.** Items on another host are not in the local registry. How does a link to a remote item get a handle, and what does it point to while the other host is unreachable?
