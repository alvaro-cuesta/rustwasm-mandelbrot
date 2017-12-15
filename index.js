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

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const ratio = 1 / 1.5

let scaleX = 1.5
let panX = -0.5
let panY = 0

canvas.addEventListener('mousewheel', onscroll, false);
canvas.addEventListener('DOMMouseScroll', onscroll, false);

fetch('/target/wasm32-unknown-unknown/release/wasm_test.wasm')
.then(response => response.arrayBuffer())
.then(bytes => WebAssembly.instantiate(bytes, {}))
.then(({ module, instance }) => {
  const { memory, draw, forget } = instance.exports

  const put = () => {
    const imagePtr = draw(canvas.width, canvas.height, panX, panY, scaleX, ratio, 300)

    const length = canvas.width * canvas.height * 4
    const imageBuffer = new Uint8ClampedArray(memory.buffer)
      .slice(imagePtr, imagePtr + length)

    ctx.putImageData(new ImageData(imageBuffer, canvas.width, canvas.height), 0, 0)

    forget(imagePtr)
  }

  const onscroll = (e) => {
    const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

    let rx = e.offsetX / canvas.width
    let ry = e.offsetY / canvas.height

    let scaleChange = (delta > 0) ? -scaleX / 2 : scaleX / 2

    panX = panX + scaleChange * (1 - rx * 2)
    panY = panY + ratio * scaleChange * (1 - ry * 2)
    scaleX = scaleX + scaleChange

    put(memory, draw)
  }

  let drag = false

  const onmousedown = (e) => {
    drag = true
  }

  const onmouseup = (e) => {
    drag = false
  }

  const onmousemove = (e) => {
    if (drag.length) {

    }
  }

  canvas.addEventListener('mousewheel', onscroll, false);
  canvas.addEventListener('DOMMouseScroll', onscroll, false);
  canvas.addEventListener('mousedown', onmousedown, false);
  canvas.addEventListener('mouseup', onmouseup, false);
  canvas.addEventListener('mousemove', onmousemove, false);

  put(memory, draw)
});

