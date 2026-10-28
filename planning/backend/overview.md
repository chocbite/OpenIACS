# Backend overview

## Purpose

OpenIACS (Open Integrated Alarm and Control System) monitors and controls **values**.

A value is a named piece of state in the system, for example a measured temperature, the state of a switch or a setpoint. Values can be read and observed, and where allowed, written to control something. The exact definition of a value (types, metadata, quality, timestamps, access rights) will get its own document.

## Distributed model

The backend is distributed. Several hosts run the backend, and together they form a **cluster** that acts as one system.

- Every host in the cluster runs the same backend software.
- Values can live on different hosts, but the cluster as a whole presents them as one system.

## Guiding constraints

These apply to every part of the backend:

- **Rust with minimal dependencies.** See [language-and-dependencies.md](language-and-dependencies.md).
- **The program never crashes.** No condition, including bugs, bad input or running out of memory, may bring the backend down. Faults are handled and reported.
- **Boot and configuration-time allocation.** Memory is allocated only while the host boots and while a user changes the configuration. See [memory-allocation-model.md](memory-allocation-model.md).

## Open questions

- Are all hosts equal peers, or do some hosts have special roles (for example a leader or coordinator)?
- Which host owns a given value? Is it always the host physically connected to the thing the value represents?
- How do hosts discover each other and join or leave the cluster?
- What happens to the values of a host that becomes unreachable?
- Can a client (for example the frontend) connect to any host and see the whole cluster, or must it connect to a specific host?
- Is there a maximum cluster size? This affects the allocation model, since resources per host must be sized in advance.
