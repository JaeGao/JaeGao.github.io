let orbitShapeSlider;
let shapes = [];
let creatures = [];
let orbitCenter;
let orbitShapeSliderValue = 1;
let lastUpdateTime = 0;
const sizeUpdateInterval = 250; // Update shapes' sizes every 1000 milliseconds (1 second)


function setup() {
  let myCanvas = createCanvas(1000, 700);
  myCanvas.parent("p5-canvas-container");
  colorMode(RGB);
 
  pixelDensity(1);
  frameRate(30);

  orbitCenter = createVector(width / 2, height / 2);
  initShapes();

  creatures.push(new Creature(createVector(random(width), random(height)), color(255, 20, 147)));
  creatures.push(new Creature(createVector(random(width), random(height)), color(0, 191, 255)));

  orbitShapeSlider = createSlider(0, 2, 1, 0.1);
  orbitShapeSlider.position(width - 250, height + 150);

  // Initial size update
  lastUpdateTime = millis();
}

function draw() {
  background(0);
  drawGlowingCursor();
  // Time-based size update for shapes
  if (millis() - lastUpdateTime > sizeUpdateInterval) {
    shapes.forEach(shape => {
      shape.updateSize();
    });
    lastUpdateTime = millis();
  }

  orbitShapeSliderValue = lerp(orbitShapeSliderValue, orbitShapeSlider.value(), 0.05);
  shapes.forEach(shape => {
    shape.update();
    shape.draw();
  });

  creatures.forEach(creature => {
    creature.attractToCenter(orbitCenter);
    shapes.forEach(shape => {
      creature.repelFromShape(shape);
    });
    creature.update();
    creature.bounceOffEdges();
    creature.draw();
  });
}
function drawGlowingCursor() {
  push(); // Save current drawing settings
  noStroke(); // No border for the glowing effect

  // Check if the mouse is pressed
  if (mouseIsPressed) {
    fill(255); // Bright white color
  } else {
    fill(255, 255, 0, 150); // Semi-transparent yellow for the default state
  }

  blendMode(ADD); // Use ADD blend mode for the glowing effect
  ellipse(mouseX, mouseY, 50, 50); // Draw the glowing circle at the mouse position
  blendMode(BLEND); // Reset blendMode to default
  pop(); // Restore original drawing settings
}
function initShapes() {
  shapes = [];
  for (let i = 0; i < 100; i++) {
    let x = random(width);
    let y = random(height);
    let c = random([color(34, 54, 159), color(205, 100, 100),color(130, 120, 160)]);
    let type = random(['ellipse', 'rect', 'triangle']);
    shapes.push(new Shape(x, y, type, c));
  }
}

class Shape {
  constructor(x, y, type, color) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.color = color;
    this.orbitRadius = random(100, 300);
    this.angle = random(TWO_PI);
    this.angleVel = random(-0.05, 0.05);
    // Initialize size properties and targets for smooth transitions
    this.sizeWidth = 20 * random();
    this.sizeHeight = 20 * random();
    this.targetSizeWidth = this.sizeWidth;
    this.targetSizeHeight = this.sizeHeight;
    if (this.type === 'triangle') {
      this.triangleHeight = (sqrt(3) / 2) * this.sizeWidth;
      this.targetTriangleHeight = this.triangleHeight;
    } else {
      this.triangleHeight = 0;
      this.targetTriangleHeight = 0;
    }
  }

  update() {
    this.angle += this.angleVel;
    this.x = orbitCenter.x + cos(this.angle) * this.orbitRadius * orbitShapeSliderValue;
    this.y = orbitCenter.y + sin(this.angle) * this.orbitRadius * orbitShapeSliderValue;

    // Smoothly transition size properties towards their targets
    this.sizeWidth = lerp(this.sizeWidth, this.targetSizeWidth, 0.1);
    this.sizeHeight = lerp(this.sizeHeight, this.targetSizeHeight, 0.1);
    if (this.type === 'triangle') {
      this.triangleHeight = lerp(this.triangleHeight, this.targetTriangleHeight, 0.1);
    }
  }

  updateSize() {
    // Set new target sizes for smooth transitions
    this.targetSizeWidth = 20 * random();
    this.targetSizeHeight = 20 * random();
    if (this.type === 'triangle') {
      this.targetTriangleHeight = (sqrt(3) / 2) * this.targetSizeWidth;
    }
  }

  draw() {
    fill(this.color);
    noStroke();
    switch (this.type) {
      case 'ellipse':
        ellipse(this.x, this.y, this.sizeWidth, this.sizeHeight);
        break;
      case 'rect':
        rect(this.x - 10, this.y - 10, this.sizeWidth, this.sizeHeight);
        break;
      case 'triangle':
        triangle(
          this.x - 10, this.y + this.triangleHeight / 2,
          this.x + 10, this.y + this.triangleHeight / 2,
          this.x, this.y - this.triangleHeight / 2
        );
        break;
    }
  }
}
class Creature {
  constructor(position, col) {
    this.position = position;
    this.velocity = createVector(random(-1, 1), random(-1, 1));
    this.acceleration = createVector(0, 0);
    this.color = col;
    this.maxSpeed = 10;
    this.maxForce = 0.5;
    this.radius = 10; // This will also influence the size of the triangles.
    this.rotation = 0; // Initial rotation for the triangles.
  }

  update() {
    this.repelFromMouse(mouseX, mouseY);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
    let alignment = this.align(creatures);
    this.applyForce(alignment);
    // Update rotations for counter-rotating triangles
    this.rotation += 0.05; 
  }
  repelFromMouse(mx, my) {
    let mousePos = createVector(mx, my);
    let d = dist(this.position.x, this.position.y, mousePos.x, mousePos.y);
    if (d < 50) { // Repel if within 50 pixels of the mouse cursor
      let force = p5.Vector.sub(this.position, mousePos).normalize().mult(this.maxForce * 5);
      this.applyForce(force);
    }
  }
  align(creatures) {
    let perceptionRadius = 50;
    let steering = createVector();
    let total = 0;
    for (let other of creatures) {
      let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (other != this && d < perceptionRadius) {
        steering.add(other.velocity);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }
  draw() {
    push(); // Start a new drawing state
    translate(this.position.x, this.position.y); // Move to the creature's position

    // Draw first triangle (counter-clockwise rotation)
    rotate(this.rotation);
    noFill();
    stroke(this.color);
    strokeWeight(3);
    this.drawTriangle(this.radius);

    // Draw second triangle (clockwise rotation)
    rotate(-2 * this.rotation); // Counter-rotate twice the angle for difference
    noFill();
    stroke(this.color);
    strokeWeight(3);
    this.drawTriangle(this.radius);

    // Draw surrounding circle with thin black border

    
    pop(); // Restore original drawing state
  }

  drawTriangle(radius) {
    // Calculate the height of the triangle to make the triangles equilateral
    let sideLength = radius * 2; // Approximation of side length based on radius
    let triangleHeight = sqrt(3) / 2 * sideLength;
    beginShape();
    vertex(-sideLength / 2, triangleHeight / 2);
    vertex(sideLength / 2, triangleHeight / 2);
    vertex(0, -triangleHeight / 2);
    endShape(CLOSE);
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  attractToCenter(center) {
    let now = millis(); // Current time in milliseconds
    let force = p5.Vector.sub(center, this.position);
    force.setMag(this.maxForce);
    this.applyForce(force);
  }

  repelFromShape(shape) {
    // Assume all shapes are drawn with an effective radius of 10 pixels
    let shapeRadius = 10;
    let d = dist(this.position.x, this.position.y, shape.x, shape.y);

    // Direct collision detection
    if (d < this.radius + shapeRadius) {
      let direction = p5.Vector.sub(this.position, createVector(shape.x, shape.y)).normalize();
      let force = direction.mult(this.maxForce * 10); // Apply a strong repulsion force
      this.applyForce(force);
    }
  }

  bounceOffEdges() {
    if (this.position.x <= 0 || this.position.x >= width) {
      this.velocity.x *= -1;
    }
    if (this.position.y <= 0 || this.position.y >= height) {
      this.velocity.y *= -1;
    }
  }

 
}
