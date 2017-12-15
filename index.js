const BENCHMARK_TIMES = 100

const containerElement = document.getElementById('container')
const canvasElement = document.getElementById('canvas')
const benchmarkElement = document.getElementById('benchmark')
const iterationsElement = document.getElementById('iterations')

const ctx = canvas.getContext('2d')

let scaleX = 1.5
let scaleY = 1
let panX = -0.5
let panY = 0

fetch('/target/wasm32-unknown-unknown/release/wasm_test.wasm')
.then(response => response.arrayBuffer())
.then(bytes => WebAssembly.instantiate(bytes, {}))
.then(({ module, instance }) => {
  const { memory, draw, forget } = instance.exports

  let maxIterations

  const timedPut = () => {
    const start = performance.now()
    put()
    console.log(`Render: ${performance.now() - start}ms`)
  }

  const put = () => {
    canvasElement.width = containerElement.offsetWidth
    canvasElement.height = containerElement.offsetHeight

    const imagePtr = draw(canvasElement.width, canvasElement.height, panX, panY, scaleX, scaleY, maxIterations)

    const length = canvasElement.width * canvasElement.height * 4
    const imageBuffer = new Uint8ClampedArray(memory.buffer)
      .slice(imagePtr, imagePtr + length)

    ctx.putImageData(new ImageData(imageBuffer, canvasElement.width, canvasElement.height), 0, 0)

    forget(imagePtr)
  }

  const onzoom = (e) => {
    const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

    let rx = e.offsetX / canvasElement.width
    let ry = e.offsetY / canvasElement.height

    let scaleChangeX = (delta > 0) ? -scaleX / 2 : scaleX / 2
    let scaleChangeY = (delta > 0) ? -scaleY / 2 : scaleY / 2

    let r2 = canvasElement.width / canvasElement.height * (scaleY / scaleX)

    // FIXME: Zoom is not correct (very noticeable when resizing canvas)
    // FIXME: It zooms more than it dezooms
    panX = panX + scaleChangeX * (1 - rx * 2) * r2
    panY = panY + scaleChangeY * (1 - ry * 2)
    scaleX += scaleChangeX
    scaleY += scaleChangeY

    timedPut()

    e.preventDefault()
  }

  canvasElement.addEventListener('mousewheel', onzoom, false);
  canvasElement.addEventListener('DOMMouseScroll', onzoom, false);

  let drag = null

  const onmousedown = (e) => {
    drag = [e.offsetX, e.offsetY]
  }

  // TODO: Pan on resize so that result is visually equal
  const onmouseup = (e) => {
    drag = null

    if (canvasElement.width !== containerElement.offsetWidth || canvasElement.height !== containerElement.offsetHeight) {
      timedPut()
    }
  }

  const onmousemove = (e) => {
    if (drag !== null) {
      let newDrag = [e.offsetX, e.offsetY]

      let r2 = canvasElement.width / canvasElement.height * (scaleY / scaleX)

      panX += (drag[0] - newDrag[0]) / canvasElement.width * scaleX * 2 * r2
      panY += (drag[1] - newDrag[1]) / canvasElement.height * scaleY * 2

      drag = newDrag

      timedPut()
    }
  }

  const oniterations = () => {
    maxIterations = parseInt(iterationsElement.value)
    timedPut()
  }

  const onbenchmark = () => {
    const start = performance.now()

    for (let i = 0; i < BENCHMARK_TIMES; i++) {
      put()
    }

    console.log(`${BENCHMARK_TIMES} renders: ${performance.now() - start}ms`)
  }

  canvasElement.addEventListener('mousedown', onmousedown, false);
  document.addEventListener('mouseup', onmouseup, false);
  document.addEventListener('mousemove', onmousemove, false);

  iterationsElement.addEventListener('input', oniterations, false);

  benchmarkElement.addEventListener('click', onbenchmark, false);

  oniterations()
});

