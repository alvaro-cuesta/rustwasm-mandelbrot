const BENCHMARK_TIMES = 100

const containerElement = document.getElementById('container')
const canvasElement = document.getElementById('canvas')
const benchmarkElement = document.getElementById('benchmark')
const iterationsElement = document.getElementById('iterations')

const ctx = canvas.getContext('2d')

fetch('/target/wasm32-unknown-unknown/release/wasm_test.wasm')
.then(response => response.arrayBuffer())
.then(bytes => WebAssembly.instantiate(bytes, {}))
.then(({ module, instance }) => {
  const { memory, draw, forget } = instance.exports

  let scaleX = 1.5
  let scaleY = 1
  let panX = -0.5
  let panY = 0

  const drawCanvas = () => {
    let maxIterations = parseInt(iterationsElement.value)

    canvasElement.width = containerElement.offsetWidth
    canvasElement.height = containerElement.offsetHeight

    const imagePtr = draw(canvasElement.width, canvasElement.height, panX, panY, scaleX, scaleY, maxIterations)

    const length = canvasElement.width * canvasElement.height * 4
    const imageBuffer = new Uint8ClampedArray(memory.buffer)
      .slice(imagePtr, imagePtr + length)

    ctx.putImageData(new ImageData(imageBuffer, canvasElement.width, canvasElement.height), 0, 0)

    forget(imagePtr)
  }

  const timedDrawCanvas = () => {
    const start = performance.now()
    drawCanvas()
    console.log(`Render: ${performance.now() - start}ms`)
  }

  // Zooming
  const onzoom = (e) => {
    const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))

    let rx = e.offsetX / canvasElement.width
    let ry = e.offsetY / canvasElement.height

    // HACK: I'm not sure what I'm doing
    let scaleChangeX = (delta > 0) ? -scaleX / 3 : scaleX / 2
    let scaleChangeY = (delta > 0) ? -scaleY / 3 : scaleY / 2

    let canvasRatio = canvasElement.width / canvasElement.height * (scaleY / scaleX)

    // FIXME: Zoom is not correct (very noticeable when resizing canvas)
    panX = panX + scaleChangeX * (1 - rx * 2) * canvasRatio
    panY = panY + scaleChangeY * (1 - ry * 2)
    scaleX += scaleChangeX
    scaleY += scaleChangeY

    timedDrawCanvas()

    e.preventDefault()
  }

  canvasElement.addEventListener('mousewheel', onzoom, false);
  canvasElement.addEventListener('DOMMouseScroll', onzoom, false);

  // Resizing
  document.addEventListener('mouseup', (e) => {
    if (canvasElement.width !== containerElement.offsetWidth || canvasElement.height !== containerElement.offsetHeight) {
      let canvasRatio = canvasElement.width / canvasElement.height * (scaleY / scaleX)

      panX += (containerElement.offsetWidth - canvasElement.width) / canvasElement.width * scaleX * canvasRatio
      panY += (containerElement.offsetHeight - canvasElement.height) / canvasElement.height * scaleY
      scaleY *= containerElement.offsetHeight / canvasElement.height

      timedDrawCanvas()
    }
  }, false);

  // Panning
  document.addEventListener('mousemove', (e) => {
    if (e.target === canvasElement && e.buttons & 1) {
      let canvasRatio = canvasElement.width / canvasElement.height * (scaleY / scaleX)

      panX -= e.movementX * 2 / canvasElement.width * scaleX * canvasRatio
      panY -= e.movementY * 2 / canvasElement.height * scaleY

      timedDrawCanvas()
    }
  }, false);

  // Iteration control
  iterationsElement.addEventListener('input', () => {
    timedDrawCanvas()
  }, false);

  // Benchmark control
  benchmarkElement.addEventListener('click', () => {
    const start = performance.now()

    for (let i = 0; i < BENCHMARK_TIMES; i++) {
      drawCanvas()
    }

    console.log(`${BENCHMARK_TIMES} renders: ${performance.now() - start}ms`)
  }, false);

  // Initial paint
  timedDrawCanvas()
});

