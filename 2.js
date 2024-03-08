let orbitShapeSlider;
let shapes = [];
let creatures = [];
let orbitCenter;

function setup() {
  let myCanvas = createCanvas(800, 800);
    myCanvas.parent("p5-canvas-container");
  colorMode(RGB);
  pixelDensity(1);
  frameRate(30);

  orbitCenter = createVector(width / 2, height / 2);
  initShapes();

  creatures.push(new Creature(createVector(random(width), random(height)), color(255, 20, 147)));
  creatures.push(new Creature(createVector(random(width), random(height)), color(0, 191, 255)));

  orbitShapeSlider = createSlider(0, 2, 1, 0.1);
  orbitShapeSlider.position(width-250, height+150);
}

function draw() {
  background(0);

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

function initShapes() {
  shapes = [];
  for (let i = 0; i < 100; i++) {
    let x = random(width);
    let y = random(height);
    let c = random([color(34, 54, 89), color(165, 100, 100)]);
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
  }

  update() {
    this.angle += this.angleVel;
    this.x = orbitCenter.x + cos(this.angle) * this.orbitRadius * orbitShapeSlider.value();
    this.y = orbitCenter.y + sin(this.angle) * this.orbitRadius * orbitShapeSlider.value();
  }

  draw() {
    fill(this.color);
    noStroke();
    switch (this.type) {
      case 'ellipse':
        ellipse(this.x, this.y, 20, 20);
        break;
      case 'rect':
        rect(this.x - 10, this.y - 10, 20, 20);
        break;
      case 'triangle':
        const h = (sqrt(3) / 2) * 20;
        triangle(
          this.x - 10, this.y + h / 2,
          this.x + 10, this.y + h / 2,
          this.x, this.y - h / 2
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
    this.radius = 10; // Assuming a radius of 10 pixels for the creature
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    // Bounce off edges
    this.bounceOffEdges();
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

  draw() {
    fill(this.color);
    noStroke();
    ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }
}
