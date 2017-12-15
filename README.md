# RustWASM Mandelbrot

A Rust + Web Assembly experiment. Mandelbrot fractals, yay!

- LLVM WASM backend (no Emscripten, target `wasm-unknown-unknown`)

# Running

```sh
$ cargo build --release
$ python -m http.server 8888
```

# TODO

- Search for TODO, FIXME or HACK in source code
- Multithreaded with JS workers?
- Mobile zooming/panning
- Zoom independently X/Y with shift/control/alt/whatever
- Can I share imageData with WASM?

# License

TODO
