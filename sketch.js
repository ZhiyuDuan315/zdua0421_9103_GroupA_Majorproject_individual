
let bg;          // Overall background color (dark blue with black undertones)
let colorSet;    // Palette
let colorPool;   // The color pool after removing the background makes it easier to randomly select colors
let rings = [];  // Data for storing each circular pattern

const NOISE_SPEED = 0.01; // Controlling the update rate of noise
let noiseZ = 0;           // The timeline of background noise is used to make the background flow slowly

function setup() {
  createCanvas(windowWidth, windowHeight);

  colorSet = [
    color(10, 13, 24),    
    color(255, 90, 0),    
    color(255, 0, 110),   
    color(80, 220, 100),  
    color(255, 200, 0),   
    color(0, 210, 255),   
    color(140, 110, 255), 
    color(255, 80, 170),  
    color(255, 120, 40),  
    color(40, 255, 200)   
  ];
  bg = colorSet[0];
  colorPool = colorSet.slice(1); // Remove the background color, and what's left are all bright colors

  // Adjust the noise details
  noiseDetail(4, 0.5);

  generateLayout();
}

function draw() {
  // First, draw the background (a colored vertical light strip made of noise)
  drawNoiseBackground();

  // Draw the circular pattern in the foreground
  for (let ring of rings) {
    // Advance the noise time by one frame at a time, allowing the shape to continuously change
    ring.nShape += NOISE_SPEED * 0.4;
    ring.nAura  += NOISE_SPEED * 0.25;

    // Halo intensity: I'll use a fixed value of 0.7 here
    const t = 0.7;

    drawAura(ring, t);

    if (ring.style === "dots") {
      drawDotMandala(ring);
    } else {
      drawCircle(ring);
    }
  }
}

//Background: Dark background + vertical colored noise bars
// Expanding upon the noise vs random example in the courseware
// Using lerpColor(c1, c2, nn) ​​to interpolate between the two colors
// Using pow(n, 0.9) to perform a non-linear transformation on the noise result, making the bright areas more prominent
// This approach of performing mathematical mapping on the noise result is based on the generative art tutorial: https://www.gorillasun.de/blog/an-introduction-to-perlin-noise-in-p5js-and-processing/
// I adopted the concept of noise + color interpolation + non-linear mapping
function drawNoiseBackground() {
  background(bg);

  const stepX = 6;      // The width of each vertical bar
  const scaleX = 0.003; // Control the rate of change of noise in the x-direction

  // Create a touch of aurora color
  const c1 = color(0, 210, 255);
  const c2 = color(255, 0, 110);

  noStroke();

  for (let x = 0; x < width; x += stepX) {
// Using noise(x * scaleX, noiseZ):
// This is the basic usage of using position + time as noise input, as discussed in class
// x * scaleX: Makes the noise change more slowly in the x-direction, avoiding overly fragmented stripes
// noiseZ: Serves as the time axis, increasing every frame.
     let n = noise(x * scaleX, noiseZ);
     // Apply a power function to the noise value to make the highlights more prominent.
     let nn = pow(n, 0.9); 

    let col = lerpColor(c1, c2, nn);
    let alpha = map(nn, 0, 1, 50, 180); // The transparency also changes

    fill(red(col), green(col), blue(col), alpha);
    rect(x, 0, stepX + 1, height);
  }

  // If we move the time forward a little, the background will slowly flow
  noiseZ += 0.03;
}

// Halo: A multi-layered Perlin noise cloud surrounding the center
// Examples of using `noise()` to control the position, size, and color of points were shown in class, but not explained in detail.
// Multi-layered noise contours + cloud-like halo using `beginShape`/`vertex`
// The ideas come from:
// 1) p5.js custom shape tutorials (`beginShape` / `vertex` / `endShape`: https://p5js.org/reference/#/p5/beginShape
// 2) Coding Train - Custom Shapes tutorial (how to draw complex contours using vertex): https://www.youtube.com/watch?v=76fiD5DvzeQ
// 3) Examples of using noise to distort boundary lines/curves in Perlin noise tutorials (e.g., The Nature of Code).
// Based on these concepts, I designed a multi-layered halo structure:
// Each layer samples noise along an angle, with a perturbation radius.
// Multiple layers are stacked, with varying transparency and amplitude, forming a cloud-like structure with a sense of volume.
function drawAura(ring, t) {
  const baseColor = ring.palette[1];

  // The approximate radius of the halo is slightly larger than that of the main image
  const baseR   = ring.r * (1.0 + 0.5 * t);
  // Fluctuation amplitude: The larger the value, the greater the edge fluctuation
  const maxExtra = ring.r * (0.8 + 1.0 * t);

  const cx = ring.x;
  const cy = ring.y;

  const layers   = 4;   // Number of halo layers
  const segments = 80;  // The more contour sampling points, the smoother the surface

  noStroke();

  for (let k = 0; k < layers; k++) {
    // The ratio of the base radius of each layer (smaller for inner layers, larger for outer layers)
    const lerpR = map(k, 0, layers - 1, 0.6, 1.2);
    // The intensity of undulations in each layer (even more pronounced in the outer layers)
    const amp   = map(k, 0, layers - 1, 0.25, 0.45);
    // Reduce the transparency slightly from the inside out to make the edges softer
    const alpha = map(k, 0, layers - 1, 120, 40) * (1 - t * 0.3);

    const col = color(
      red(baseColor),
      green(baseColor),
      blue(baseColor),
      alpha
    );
    fill(col);

    beginShape();
    for (let i = 0; i <= segments; i++) {
      let ang = (i / segments) * TWO_PI;

      // Use 1D noise to sweep along the contour, so that the edges are a coherent wave, without jagged edges
      // In class, we discussed using a time-varying value to advance noise()
      // Here, I combine time, angle, and layer index to allow the noise to take values ​​in a higher-dimensional space
      // Conceptually similar to sampling in 2D/3D noise space as discussed in *The Nature of Code*
      let noisePos = ring.nAura + k * 10 + i * 0.07;
      let n = noise(noisePos);

      let extra = map(n, 0, 1, -amp, amp) * maxExtra;
      let rAura = baseR * lerpR + extra;

      let x = cx + rAura * cos(ang);
      let y = cy + rAura * sin(ang);
      vertex(x, y);
    }
    endShape(CLOSE);
  }
}


// Initialization: Generate fixed positions and avoid overlap
// A small logic was added here to prevent circular shapes from colliding, ensuring that there is a certain distance between each circle
// This adopts the common approach of "trial random location + distance detection" in circle packing/rejection sampling
function generateLayout() {
  rings = [];
  const S = min(width, height);

  const N_SPOKES = 5; // Number of spokes
  const N_DOTS   = 7; // Number of circles, mainly composed of dots

  // The size range will vary with the canvas size
  const Rmin_spokes = S * 0.09;
  const Rmax_spokes = S * 0.14;
  const Rmin_dots   = S * 0.06;
  const Rmax_dots   = S * 0.09;

  // First, place the spokes type, slightly towards the center of the screen
  for (let i = 0; i < N_SPOKES; i++) {
    let r = random(Rmin_spokes, Rmax_spokes);
    let pos = findNonOverlappingPosition(r, rings, 50);

    let palette = [
      random(colorPool),
      random(colorPool),
      random(colorPool),
      random(colorPool),
      random(colorPool)
    ];

    rings.push({
      x: pos.x,
      y: pos.y,
      r,
      palette,
      style: "spokes",
      nShape: random(7000), // Time seed for controlling shape noise
      nAura:  random(9000)  // Time seed for controlling halo noise
    });
  }

  // Then place more dots, spreading them out around the perimeter.
  for (let i = 0; i < N_DOTS; i++) {
    let r = random(Rmin_dots, Rmax_dots);
    let pos = findNonOverlappingPosition(r, rings, 40);

    let palette = [
      random(colorPool),
      random(colorPool),
      random(colorPool),
      random(colorPool),
      random(colorPool)
    ];

    rings.push({
      x: pos.x,
      y: pos.y,
      r,
      palette,
      style: "dots",
      nShape: random(7000),
      nAura:  random(9000)
    });
  }
}

 //A simple function to prevent overlapping circular shapes
 //If a random position is found and it is too close to an existing circle, the process will be repeated several times
function findNonOverlappingPosition(r, existingRings, margin) {
  const border = margin + r;  // Leave at least a little blank space from the edge
  const maxTries = 200;
  let x, y;
  let ok = false;

  for (let t = 0; t < maxTries && !ok; t++) {
    x = random(border, width  - border);
    y = random(border, height - border);
    ok = true;

    for (let other of existingRings) {
      let d = dist(x, y, other.x, other.y);
      // If the distance is less than the sum of the two radii * 1.25, it's considered too crowded
      if (d < (r + other.r) * 1.25) {
        ok = false;
        break;
      }
    }
  }

  // If the perfect position is not found in the loop, use the last result
  return { x, y };
}

function windowResized() {
  // Referencing the window resize callback from p5.js: https://p5js.org/reference/#/p5/windowResize
  resizeCanvas(windowWidth, windowHeight);
  generateLayout();
}


function getAnimatedRadius(ring) {
  return ring.r;
}


 // Small utility functions for edge deformation
 // Given a base radius baseR, calculate a wavy radius based on the angle ang and Perlin noise
 // amp controls the maximum offset percentage (e.g., 0.3 is ±30%), and `freq` controls the number of peaks in one cycle
 // Using 2D noise (noise(x, y)) to distort shape boundaries is common in generative art, such as noisy terrain, noise rings, and noise blobs
 // Reference: p5.js noise() documentation (explaining 2D/3D noise): https://p5js.org/reference/#/p5/noise
 // An introduction to Perlin Noise in P5JS and Processing: https://www.gorillasun.de/blog/an-introduction-to-perlin-noise-in-p5js-and-processing/
function noisyRadius(baseR, ang, ring, amp, freq) {
  const t = ring.nShape;
  const nx = cos(ang * freq) * 0.5 + 0.5;
  const ny = sin(ang * freq) * 0.5 + 0.5;
  const n  = noise(nx + t, ny + t);
  const offset = map(n, 0, 1, -amp, amp);
  return baseR * (1 + offset);
}

// spokes 
// The structure basically follows the group's code, except that the outer spokes and dot matrix are connected to noise deformation
 
function drawCircle(ring) {
  const R = getAnimatedRadius(ring);

  // Outer ring
  strokeWeight(max(2, R * 0.08));
  stroke(ring.palette[0]);
  noFill();
  circle(ring.x, ring.y, R * 2);

  // The endpoint radius is wavy using noisyRadius
  let nSpokes = 15;
  strokeWeight(2);
  stroke(ring.palette[1]);

  for (let i = 0; i < nSpokes; i++) {
    let ang = i * TWO_PI / nSpokes;
    let innerR = R * 0.12;
    let outerR = noisyRadius(R * 0.88, ang, ring, 0.35, 2.0);

    let x1 = ring.x + innerR * cos(ang);
    let y1 = ring.y + innerR * sin(ang);
    let x2 = ring.x + outerR * cos(ang);
    let y2 = ring.y + outerR * sin(ang);
    line(x1, y1, x2, y2);
  }

  // Middle ring
  strokeWeight(max(2, R * 0.04));
  stroke(ring.palette[2]);
  noFill();
  circle(ring.x, ring.y, R * 1.2);

  // Outer ring dot matrix: The radius of each dot is jittered with a tiny bit of noise
  noStroke();
  fill(ring.palette[3]);
  let dotsA = max(7, int(R / 5));
  let baseRA = R * 0.38;

  for (let i = 0; i < dotsA; i++) {
    let a = i * TWO_PI / dotsA;
    let rA = noisyRadius(baseRA, a, ring, 0.3, 3.0);
    let x = ring.x + rA * cos(a);
    let y = ring.y + rA * sin(a);
    circle(x, y, 7);
  }

  // Inner ring dot matrix
  fill(ring.palette[1]);
  let dotsB = max(3, int(R / 5));
  let baseRB = R * 0.26;

  for (let i = 0; i < dotsB; i++) {
    let a = i * TWO_PI / dotsB;
    let rB = noisyRadius(baseRB, a, ring, 0.18, 2.5);
    let x = ring.x + rB * cos(a);
    let y = ring.y + rB * sin(a);
    circle(x, y, 6);
  }

  // small central ring
  noStroke();
  fill(ring.palette[4]);
  circle(ring.x, ring.y, R * 0.24);
  fill(random(colorSet)); // I maintain a degree of randomness, allowing for slight variations in the center
  circle(ring.x, ring.y, R * 0.12);
}

// dots 
// Similarly, connect each dot matrix ring to the noisyRadius and let it vibrate slightly

function drawDotMandala(ring) {
  const R = getAnimatedRadius(ring);

  // Radiation (spokes)
  let nSpokes = 8;
  strokeWeight(2);
  stroke(ring.palette[1]);

  for (let i = 0; i < nSpokes; i++) {
    let ang = i * TWO_PI / nSpokes;
    let innerR = R * 0.12;
    let outerR = noisyRadius(R * 0.80, ang, ring, 0.32, 2.3);

    let x1 = ring.x + innerR * cos(ang);
    let y1 = ring.y + innerR * sin(ang);
    let x2 = ring.x + outerR * cos(ang);
    let y2 = ring.y + outerR * sin(ang);
    line(x1, y1, x2, y2);
  }

  noStroke();

  // Inner ring dot matrix
  let n1 = 8;
  let baseR1 = R * 0.22;
  let s1 = R * 0.10;
  fill(ring.palette[2]);

  for (let i = 0; i < n1; i++) {
    let a = i * TWO_PI / n1;
    let r1 = noisyRadius(baseR1, a, ring, 0.22, 2.4);
    let x = ring.x + r1 * cos(a);
    let y = ring.y + r1 * sin(a);
    circle(x, y, s1);
  }

  // Middle ring dot matrix
  let n2 = 19;
  let baseR2 = R * 0.52;
  let s2 = R * 0.08;
  fill(ring.palette[3]);

  for (let i = 0; i < n2; i++) {
    let a = i * TWO_PI / n2;
    let r2 = noisyRadius(baseR2, a, ring, 0.28, 3.1);
    let x = ring.x + r2 * cos(a);
    let y = ring.y + r2 * sin(a);
    circle(x, y, s2);
  }

  // Outer ring dot matrix
  let n3 = 24;
  let baseR3 = R * 0.55;
  let s3 = R * 0.09;
  fill(ring.palette[4]);

  for (let i = 0; i < n3; i++) {
    let a = i * TWO_PI / n3;
    let r3 = noisyRadius(baseR3, a, ring, 0.3, 3.5);
    let x = ring.x + r3 * cos(a);
    let y = ring.y + r3 * sin(a);
    circle(x, y, s3);
  }

  // small central ring
  fill(ring.palette[0]);
  circle(ring.x, ring.y, R * 0.20);
}
