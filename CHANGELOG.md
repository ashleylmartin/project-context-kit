# project-context-kit

## 0.1.1

### Patch Changes

- [`cf848bc`](https://github.com/ashleylmartin/project-context-kit/commit/cf848bcc35f7c40023a135955e5956f54f68031e) - Fix a data-loss bug where `session-start`/`wrap-up`/`doctor`'s local
  runtime memory cache shared a directory with the built-in Cortex Code
  memory tool's per-project topic files, and silently deleted them during
  cache sync. The cache now lives at a path exclusive to
  `project-context-kit`, so there's nothing else nearby to sweep.
