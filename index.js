/*var Module = {
  wasmBinaryFile: "wasm-test.wasm",
  onRuntimeInitialized: main,
};

function main() {
  var getData = Module.cwrap('get_data', 'string', []);
  console.log(getData());
};

main();
*/

const BENCHMARK_TIMES = 100

const canvasElement = document.getElementById('canvas')
const benchmarkElement = document.getElementById('benchmark')
const iterationsElement = document.getElementById('iterations')

const ctx = canvas.getContext('2d')

const ratio = 1 / 1.5

let scaleX = 1.5
let panX = -0.5
let panY = 0

fetch('/target/wasm32-unknown-unknown/release/wasm_test.wasm')
.then(response => response.arrayBuffer())
.then(bytes => WebAssembly.instantiate(bytes, {}))
.then(({ module, instance }) => {
  const { memory, draw, forget } = instance.exports

  let maxIterations = parseInt(iterationsElement.value)

  const timedPut = () => {
    const start = performance.now()
    put()
    console.log(`Render: ${performance.now() - start}ms`)
  }

  const put = () => {
    const imagePtr = draw(canvasElement.width, canvasElement.height, panX, panY, scaleX, ratio, maxIterations)

    const length = canvasElement.width * canvasElement.height * 4
    const imageBuffer = new Uint8ClampedArray(memory.buffer)
      .slice(imagePtr, imagePtr + length)

    ctx.putImageData(new ImageData(imageBuffer, canvasElement.width, canvasElement.height), 0, 0)

    forget(imagePtr)
  }

  const onscroll = (e) => {
    const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

    let rx = e.offsetX / canvasElement.width
    let ry = e.offsetY / canvasElement.height

    let scaleChange = (delta > 0) ? -scaleX / 2 : scaleX / 2

    panX = panX + scaleChange * (1 - rx * 2)
    panY = panY + ratio * scaleChange * (1 - ry * 2)
    scaleX = scaleX + scaleChange

    timedPut()
  }

  canvasElement.addEventListener('mousewheel', onscroll, false);
  canvasElement.addEventListener('DOMMouseScroll', onscroll, false);

  let drag = null

  const onmousedown = (e) => {
    drag = [e.offsetX, e.offsetY]
  }

  const onmouseup = (e) => {
    drag = null
  }

  // FIXME: Doesn't look like it pans correctly
  const onmousemove = (e) => {
    if (drag !== null) {
      let newDrag = [e.offsetX, e.offsetY]

      panX += (drag[0] - newDrag[0]) / canvasElement.width * scaleX
      panY += (drag[1] - newDrag[1]) / canvasElement.height * scaleX * ratio

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

  timedPut()
});

