pub fn mandelbrot(cx: f64, cy: f64, max_iterations: u32) -> u32 {
    let mut x = 0f64;
    let mut y = 0f64;
    let mut xx = 0f64;
    let mut yy = 0f64;

    let mut i = 0;

    while i < max_iterations && xx + yy <= 4.0 {
        i += 1;

        let xy = x * y;
        xx = x * x;
        yy = y * y;
        x = xx - yy + cx;
        y = xy + xy + cy;
    }

    i
}

#[no_mangle]
pub fn draw(
    w: u32, h: u32,
    x_pan: f64, y_pan: f64,
    x_scale: f64, y_scale: f64,
    max_iterations: u32
) -> *mut u8 {
    // TODO: Do not allocate in each call?
    let mut memory: Vec<u8> = Vec::with_capacity((w * h * 4) as usize);

    let aspect_ratio = y_scale / x_scale;
    let r2 = (w as f64) / (h as f64) * aspect_ratio;

    for y in 0..h {
        for x in 0..w {
            let x_a = (x as f64) / (w as f64) * 2.0 - 1.0;
            let y_a = (y as f64) / (h as f64) * 2.0 - 1.0;

            let x_f = x_a * x_scale * r2 + x_pan;
            let y_f = y_a * y_scale + y_pan;

            let iterations = mandelbrot(x_f, y_f, max_iterations) - 1;

            // TODO: Non-grayscale color
            // FIXME: There is no pure black
            let color = ((iterations as f64) / ((max_iterations - 1) as f64) * 255f64) as u8;
            memory.push(color);
            memory.push(color);
            memory.push(color);
            memory.push(255u8);
        }
    }

    memory.as_mut_ptr()
}

#[no_mangle]
pub unsafe fn forget(handle: *mut u8, length: usize) {
    drop(Vec::from_raw_parts(handle, length, length));
}
