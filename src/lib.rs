pub fn mandelbrot(cx: f64, cy: f64, max_iterations: u32) -> u32 {
    let mut x = 0f64;
    let mut y = 0f64;
    let mut xx = 0f64;
    let mut yy = 0f64;

    let mut i = 0;

    while i < max_iterations && xx + yy <= 4f64 {
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
    pan_x: f64, pan_y: f64,
    scale_x: f64, ratio: f64,
    max_iterations: u32
) -> *mut u8 {
    let mut memory: Vec<u8> = Vec::with_capacity((w * h * 4) as usize);

    let x_min = pan_x - scale_x;
    let y_min = pan_y - scale_x * ratio;

    for y in 0..h {
        for x in 0..w {
            let x_f = x_min + ((x as f64) / (w as f64) * 2f64 * scale_x);
            let y_f = y_min + ((y as f64) / (h as f64) * 2f64 * scale_x * ratio);

            let iterations = mandelbrot(x_f, y_f, max_iterations);
            let color = ((iterations as f64) / (max_iterations as f64) * 255f64) as u8;
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
