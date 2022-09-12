/**Constants**/
var GRAVITY = 0.5;
var FRICTION = 1; // Number to multiply x velocity by when a unit hits the ground (the green rectangle)
var AIR_RESISTANCE = 0.95; // Number to multiply velocity by at all times
var DAMPING = 1; // Number to divide spring force by at all times (does NOT affect gravity!)
var DISPLAY_BUTTONS = true;
var BUTTON_SIZE = 20;
var LINE_WIDTH = 5;
var MAX_SPEED = 50;
var RANDOM = 0.0001;
var tileSize;

// Globals
var softBodies;
var clicked = false;
var game;
var keys = [];
var screenAnimation = 0;
var screenImage = 0;
var screenTxt = 100;
var screen = 0;
var particles = [];
var unitsKilled = 0;
var world = "Overworld";
var shake = 0;
var music = new Howl({ src: "music.mp3", autoplay: true, loop: true });
music.play();

// Rectangle Rectangle Intersecting
var rrCol = function(x, y, w, h, x2, y2, w2, h2) {
    return x > x2 - w && y > y2 - h && x < x2 + w2 && y < y2 + h2;
};

// Rotated Rectangle Point Intersecting
var rrpCol = function(xPoint, yPoint, xPivot, yPivot, xRectangle, yRectangle, widthRectangle, heightRectangle, rotation) {
    var rotationDifference = atan2(yPoint - yPivot, xPoint - xPivot) - rotation;
    var positionDistance = dist(xPoint, yPoint, xPivot, yPivot);
    xPoint = cos(rotationDifference) * positionDistance;
    yPoint = sin(rotationDifference) * positionDistance;
    return xPoint > xRectangle && yPoint > yRectangle && xPoint < xRectangle + widthRectangle && yPoint < yRectangle + heightRectangle;
};

// Sprites
var sprites = {
    cloud: function() {
        noStroke();
        // fill(0);
        // ellipse(50, 100, 100, 75);
        // ellipse(125, 100, 150, 100);
        // ellipse(200, 100, 100, 70);
        fill(255);
        var thickness = 15;
        ellipse(50, 100, 100 - thickness, 75 - thickness);
        ellipse(125, 100, 150 - thickness, 100 - thickness);
        ellipse(200, 100, 100 - thickness, 70 - thickness);
        return get(0, 0, 250, 200);
    },
    init: function() {
        for(var key in this) {
            if(key === "init") { continue; }
            // clear();
            background(0, 0, 0, 0);
            this[key] = this[key]();
        }
    }
};

// Sounds
var sounds = {
    ouch: "ouch.mp3",
    impact: "impact.mp3",
    win: "win.mp3",
    pass: "pass.mp3",
    place: "place.mp3",
    init: function() {
        for(var key in this) {
            if(key === "init") { continue; }
            this[key] = new Howl({ src: this[key] });
        }
    }
};

// View
var view = {
    x: 0,
    y: 0,
    xTo: 0,
    yTo: 0,
    get mouseX() {
        return mouseX + this.x;
    },
    get mouseY() {
        return mouseY + this.y;
    },
    translate: function() {
        this.x += (this.xTo - this.x) / 10;
        this.y += (this.yTo - this.y) / 10;

        translate(-this.x + random(-shake, shake), -this.y + random(-shake, shake));
    },
};

// Is in array?
var isInArray = function(value, array) {
    for(var i = 0; i < array.length; i ++) {
        if(array[i] !== value) {
            continue;
        }
        return array[i];
    }
    return false;
};

var obstacles = [];
// Box
var Box = function(x, y, w, h, sticky, ghosted) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.type = "box";
    this.sticky = sticky;
    this.flowers = [];
    this.xVel = 0;
    this.yVel = 0;
    this.ghosted = ghosted;

    this.display = function() {
        this.x += this.xVel;
        this.y += this.yVel;
        if(!rrCol(this.x, this.y, this.width, this.height, view.x, view.y, width, height)) {
            return;
        }
        if(world === "Overworld" && this.flowers.length === 0) {
            for(var i = 0; i < this.width / 190; i ++) {
                this.flowers.push([random(this.x, this.x + this.width), random(1, 5), random(360), random(2, 5)]);
            }
        }
        var depth = 20;
        if(world === "Overworld") {
            for(var i = 0; i < this.flowers.length; i ++) {
                if(this.flowers[i][0] < view.x - 50 || this.flowers[i][0] > view.x + width + 50) {
                    continue;
                }
                push();
                translate(this.flowers[i][0], this.y);
                rotate(cos(frameCount * this.flowers[i][1] + this.flowers[i][2]) * this.flowers[i][3]);
                stroke(0, 150, 0);
                strokeWeight(3);
                line(0, 0, 0, -20);
                noStroke();
                fill(0, 200, 0);
                if(this.sticky) {
                    fill(255, 200, 200);
                }
                for(var j = 0; j < 360; j += 50) {
                    push();
                    translate(0, -20);
                    rotate(j);
                    ellipse(7.5, 0, 10, 10);
                    pop();
                }
                fill(255, 255, 0);
                ellipse(0, -20, 10, 10);
                pop();
            }
        }
        noStroke();
        fill(199, 143, 48);
        if(world === "Graveyard") {
            fill(40, 50, 0);
        }
        if(this.sticky) {
            fill(0, 255, 175);
            if(world === "Graveyard") {
                fill(0, 250, 125);
            }
        }
        rect(this.x, this.y, this.width, this.height);
        fill(0, 230, 0);
        if(world === "Graveyard") {
            fill(80, 100, 0);
        }
        if(this.sticky) {
            fill(255, 100, 100);
            if(world === "Graveyard") {
                fill(200, 100, 50);
            }
        }
        rect(this.x, this.y, depth, this.height);
        rect(this.x, this.y, this.width, depth);
        rect(this.x + this.width - depth, this.y, depth, this.height);
        rect(this.x, this.y + this.height - depth, this.width, depth);
        var nDiv = 30;
        for(var i = 0; i <= this.width - depth * 2; i += (this.width - depth * 2) / round(this.width / nDiv)) {
            if(this.x + i < view.x - 50 || this.x + i > view.x + width + 50) {
                continue;
            }
            ellipse(this.x + depth + i, this.y + this.height - depth, (this.width - depth * 2) / round(this.width / nDiv), depth);
            ellipse(this.x + depth + i, this.y + depth, (this.width - depth * 2) / round(this.width / nDiv), depth);
        }
        for(var i = 0; i <= this.height - depth * 2; i += (this.height - depth * 2) / round(this.height / nDiv)) {
            if(this.y + i < view.y - 50 || this.y + i > view.y + height + 50) {
                continue;
            }
            ellipse(this.x + this.width - depth, this.y + depth + i, depth, (this.height - depth * 2) / round(this.height / nDiv));
            ellipse(this.x + depth, this.y + depth + i, depth, (this.height - depth * 2) / round(this.height / nDiv));
        }
    };
};

// Blower
var Blower = function(x, y, l, r, s, furthest, sp) {
    this.x = x;
    this.y = y;
    this.realY = y;
    this.width = l;
    this.rotation = r;
    this.strength = s;
    this.speed = sp;
    this.type = "blower";

    this.particles = [];
    this.furthest = furthest;

    this.display = function() {

        this.y = this.realY + cos(frameCount * 5) * 10;
        stroke(150);
        strokeWeight(5);
        var propellers = -sin(this.rotation) * this.width / 2 + 50;
        line(this.x, this.y, this.x, this.y - propellers);
        stroke(150 + sin(frameCount * 40) * 10);
        line(this.x + cos(frameCount * 30) * 40, this.y - propellers, this.x - cos(frameCount * 30) * 40, this.y - propellers);
        noStroke();
        for(var i = this.particles.length - 1; i >= 0; i --) {
            var p = this.particles[i];
            p.x += cos(p.rotation - 90) * p.velocity;
            p.y += sin(p.rotation - 90) * p.velocity;
            p.velocity *= 0.99;
            p.age -= 1;
            fill(0, 200, 255, p.age);
            ellipse(p.x, p.y, p.size, p.size);
            if(p.age < 25) {
                this.particles.splice(i, 1);
            }
        }
        if(round(random(3)) === 0) {
            this.particles.push({
                x: this.x + cos(this.rotation) * random(-this.width / 2, this.width / 2),
                y: this.y + sin(this.rotation) * random(-this.width / 2, this.width / 2),
                velocity: this.speed || random(this.strength - 3, this.strength + 3),
                age: random(200, 230),
                size: random(10, 20),
                rotation: this.rotation,
            });
        }

        push();
        translate(this.x, this.y);
        rotate(this.rotation);
        fill(100);
        noStroke();
        arc(0, 7, this.width - 10, this.width / 2, 0, 180);
        fill(200);
        stroke(0);
        strokeWeight(3);
        rect(-this.width / 2, -5, this.width, 10);
        pop();

        // if(frameCount % 45 === 0) {
        //     sounds.propeller.play();
        // }
    };
};

// Mincer
var Mincer = function(x, y, siz) {
    this.x = x;
    this.y = y;
    this.size = siz;
    this.dir = random(-5, 5);
    this.type = "mincer";
    
    this.display = function() {
        if(!rrCol(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2, view.x, view.y, width, height)) {
            return;
        }
        noStroke();
        fill(100);
        beginShape();
        for(var i = 0; i < 360; i += 3) {
            vertex(this.x + cos(frameCount * this.dir + i) * (this.size / 2 + 15 + cos(i * 90) * 10), this.y + sin(frameCount * this.dir + i) * (this.size / 2 + 15 + cos(i * 90) * 10));
        }
        endShape();
        fill(230);
        ellipse(this.x, this.y, this.size, this.size);
        fill(50);
        ellipse(this.x, this.y, this.size / 4, this.size / 4);
        noFill();
        stroke(255);
        strokeWeight(5);
        arc(this.x, this.y, this.size - 15, this.size - 15, -90, 0);
    };
};

// Spikes
var Spikes = function(x, y, l) {
    this.x = x;
    this.y = y;
    this.width = l;
    this.height = 40;
    
    this.type = "spikes";
    
    this.display = function() {
        if(!rrCol(this.x, this.y - 20, this.width, 40, view.x, view.y, width, height)) {
            return;
        }
        noStroke();
        for(var i = this.x; i < this.x + this.width; i += 20) {
            fill(100);
            triangle(i, this.y, i + 10, this.y - 40, i + 10, this.y + 40);
            fill(0);
            triangle(i + 20, this.y, i + 10, this.y - 40, i + 10, this.y + 40);
        }
        
    };
};
var SpikesSide = function(x, y, l) {
    this.x = x;
    this.y = y;
    this.width = l;
    this.height = 40;
    
    this.type = "spikesSide";
    
    this.display = function() {
        if(!rrCol(this.x - 20, this.y, 40, this.width, view.x, view.y, width, height)) {
            return;
        }
        noStroke();
        for(var i = this.y; i < this.y + this.width; i += 20) {
            fill(100);
            triangle(this.x, i + 20, this.x - 40, i + 10, this.x + 40, i + 10);
            fill(0);
            triangle(this.x, i, this.x - 40, i + 10, this.x + 40, i + 10);
        }
        
    };
};

// Goal
var Goal = function(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;

    this.type = "goal";

    this.display = function() {
        fill(0, 255, 0, 100);
        noStroke();
        rect(this.x, this.y, this.width, this.height);
    };
};

// Balloon Pop Particle
var Pop = function(x, y) {
    this.xpos = x;
    this.ypos = y;
    this.size = random(10, 20);
    this.opac = random(200, 255);
    this.dire = random(360);
    this.yeet = random(10, 20);

    this.display = function() {
        fill(0, 100, 255, this.opac);
        noStroke();
        ellipse(this.xpos, this.ypos, this.size, this.size);
        this.xpos += cos(this.dire) * this.yeet;
        this.ypos += sin(this.dire) * this.yeet;
        this.yeet *= 0.9;
        this.opac *= 0.9;
        if(this.opac < 10) {
            this.terminated = true;
        }
    };
};

// Sign
var Sign = function(x, y, label, rotation) {
    this.x = x;
    this.y = y;
    this.label = label;
    this.rotation = rotation;
    this.type = "sign";

    this.display = function() {
        if(!rrCol(this.x - 100, this.y - 100, 200, 200, view.x, view.y, width, height)) {
            return;
        }
        push();
        translate(this.x, this.y);
        rotate(this.rotation);
        fill(200, 150, 0);
        stroke(0);
        strokeWeight(5);
        rect(-5, -50, 10, 50);
        rect(-30, -90, 60, 40);
        if(this.label === "=>") {
            fill(255, 0, 0);
            noStroke();
            rect(-10, -74, 15, 8);
            triangle(5, -83, 5, -57, 20, -70);
        }
        else if(this.label === "star") {
            fill(255, 0, 0);
            noStroke();
            // 0, -70
            var starRadius = 10;
            beginShape();
            vertex(0, -70 - starRadius);
            vertex(starRadius / 4, -70 - starRadius / 2.5);
            vertex(starRadius, -70);
            vertex(starRadius / 2, -70 + starRadius / 2);
            vertex(starRadius / 1.5, -70 + starRadius);
            vertex(0, -70 + starRadius / 1.5);
            vertex(-starRadius / 1.5, -70 + starRadius);
            vertex(-starRadius / 2, -70 + starRadius / 2);
            vertex(-starRadius, -70);
            vertex(-starRadius / 4, -70 - starRadius / 2.5);
            vertex(0, -70 - starRadius);
            endShape();
        }
        else {
            noStroke();
            fill(0);
            textAlign(CENTER, CENTER);
            textSize(20);
            text(this.label, 0, -70);
        }
        pop();
    };
};

// Zombie
var errorMargin = 40;
var Zombie = function(x, y) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 60;

    this.xVel = 0;
    this.displayXvel = 0;
    this.yVel = 0;
    this.onFloor = false;
    this.frame = random(360);
    this.type = "zombie";

    this.collision = function(xVel, yVel) {
        for(var i = 0; i < obstacles.length; i ++) {
            var o = obstacles[i];
            if(o.type !== "box") {
                continue;
            }
            if(!rrCol(this.x, this.y, this.width, this.height, o.x, o.y, o.width, o.height)) {
                continue;
            }
            if(xVel > 0 && this.x < o.x + errorMargin) {
                this.x = o.x - this.width + o.xVel;
                this.xVel = 0;
            }
            if(xVel < 0 && this.x > o.x + o.width - errorMargin) {
                this.x = o.x + o.width + o.xVel;
                this.xVel = 0;
            }
            if(yVel > 0 && this.y < o.y + errorMargin) {
                this.y = o.y - this.height + o.yVel;
                this.yVel = 0;
                this.onFloor = true;
            }
            if(yVel < 0 && this.y > o.y + o.height - errorMargin) {
                this.y = o.y + o.height + o.yVel;
                this.yVel = 0;
            }
        }
    };
    this.display = function() {

        this.frame += 7;
        push();
        translate(this.x, this.y);
        fill(0, 210, 0);
        noStroke();
        rect(0, this.height / 2, this.width, this.height / 2);
        triangle(0, this.height / 2, this.width / 4, this.height / 3, this.width / 2, this.height / 2);
        triangle(this.width / 2, this.height / 2, this.width - this.width / 4, this.height / 3, this.width, this.height / 2);
        push();
        translate(0, constrain(cos(this.frame) * 20, -20, 0));
        triangle(this.width / 4, this.height / 2, this.width / 2, this.height - this.height / 3, this.width - this.width / 4, this.height / 2);
        rect(0, 0, this.width, this.height / 2);
        fill(255);
        ellipse(this.width / 4 + this.displayXvel * this.width / 4.5, this.height / 4, 10, 10);
        ellipse(this.width - this.width / 4 + this.displayXvel * this.width / 4.5, this.height / 4, 20, 20);
        fill(0);
        ellipse(this.width / 4 + this.displayXvel * 2.6 * this.width / 9, this.height / 4, 5, 5);
        ellipse(this.width - this.width / 4 + this.displayXvel * 4 * this.width / 9, this.height / 4, 5, 5);
        pop();
        pop();

        var searchDist = Infinity;
        var search;
        for(var i = 0; i < softBodies.units.length; i ++) {
            var unit = softBodies.units[i];
            if(unit.type === "zombie" || dist(unit.x, unit.y, this.x + this.width / 2, this.y + this.height / 2) > 1000) {
                continue;
            }
            if(dist(unit.x, unit.y, this.x + this.width / 2, this.y + this.height / 2) > searchDist) {
                continue;
            }
            searchDist = dist(unit.x, unit.y, this.x, this.y);
            search = unit;
            if(rrCol(this.x - 1, this.y - 1, this.width + 2, this.height + 2, unit.x, unit.y, 0, 0)) {
                unit.type = "zombie";
                unit.age = 0;
                searchDist = "Infinity";
                unitsKilled ++;
            }
        }

        if(search && search.y < this.y + this.height / 2 && this.onFloor) {
            this.yVel = -10;
        }
        if(!search) {
            this.xVel *= 0.9;
        }
        else if(this.x + this.width / 2 > search.x) {
            this.xVel -= 0.05;
        }
        else if(this.x + this.width / 2 < search.x) {
            this.xVel += 0.05;
        }
        this.yVel += GRAVITY;

        this.xVel = constrain(this.xVel, -0.5, 0.5);
        this.displayXvel += (this.xVel - this.displayXvel) / 25;
        this.x += this.xVel;
        this.collision(this.xVel, 0);
        this.y += this.yVel;
        this.onFloor = false;
        this.collision(0, this.yVel);
    };
};

// Ghost
var Ghost = function(x, y) {
    this.x = x;
    this.y = y;

    this.xVel = 0;
    this.yVel = 0;
    this.age = 0;
    this.rotation = 0;
    this.haunt = 0;

    this.type = "ghost";

    this.display = function() {
        var search;
        if(this.age > 200) {
            var searchDist = Infinity;
            for(var i = 0; i < softBodies.units.length; i ++) {
                var unit = softBodies.units[i];
                if(unit.type === "zombie" || dist(unit.x, unit.y, this.x, this.y) > 1000) {
                    continue;
                }
                if(dist(unit.x, unit.y, this.x, this.y) > searchDist) {
                    continue;
                }
                searchDist = dist(unit.x, unit.y, this.x, this.y);
                search = unit;
            }

            if(search) {
                this.xVel += (search.x - this.x) / dist(search.x, search.y, this.x, this.y);
                this.yVel += (search.y - this.y) / dist(search.x, search.y, this.x, this.y);
            }
        }
        else {
            this.age ++;
            this.yVel = -1;
        }

        this.haunt = max(this.haunt - 1, 0);
        if(search && dist(search.x, search.y, this.x, this.y) < 10) {
            this.haunt += 2;
        }

        var velocity = dist(this.xVel, this.yVel, 0, 0);
        velocity = constrain(velocity, -2, 2);
        this.xVel = (this.xVel / dist(this.xVel, this.yVel, 0, 0)) * velocity;
        this.yVel = (this.yVel / dist(this.xVel, this.yVel, 0, 0)) * velocity;
        this.x += this.xVel;
        this.y += this.yVel;
        this.rotation += (this.xVel * 10 - this.rotation) / 10;
        push();
        translate(this.x, this.y);
        rotate(this.rotation);
        fill(0, map(this.age, 0, 200, 0, 100) * map(this.haunt, 0, 20, 1, 0));
        noStroke();
        arc(0, 0, 60, 60, -180, 0);
        rect(-30, 0, 60, 30);
        fill(255, 255 * map(this.haunt, 0, 20, 1, 0));
        ellipse(-10, -10, 10, 10);
        ellipse(10, -10, 10, 10);
        pop();
        if(this.haunt > 20) {
            unitsKilled ++;
            search.dead = true;
            this.dead = true;
        }
    };
};

// Gravestone
var Gravestone = function(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 70;

    this.ghosted = false;
    this.type = "gravestone";
    this.particles = [];

    this.display = function() {
        if(!this.ghosted) {
            for(var i = 0; i < softBodies.units.length; i ++) {
                var unit = softBodies.units[i];
                if(dist(this.x, this.y, unit.x, unit.y) > 200) {
                    continue;
                }
                obstacles.push(new Ghost(this.x + this.width / 2, this.y));
                for(var i = 0; i < 50; i ++) {
                    this.particles.push({
                        x: random(this.x, this.x + this.width),
                        y: random(this.y - this.height, this.y),
                        theta: random(360),
                        velocity: random(5, 15),
                        age: 0,
                        size: random(5, 10),
                    });
                }
                this.ghosted = true;
            }

            fill(200);
            noStroke();
            rect(this.x, this.y - this.height, this.width, this.height, 30, 30, 0, 0);
            stroke(100);
            strokeWeight(3);
            for(var i = this.y - this.height + 30; i < this.y - this.height + 60; i += 10) {
                line(this.x + 10, i, this.x + this.width - 10, i);
            }
        }

        noStroke();
        var pDead = false;
        for(var i = this.particles.length - 1; i >= 0; i --) {
            var p = this.particles[i];
            p.x += cos(p.theta) * p.velocity;
            p.y += sin(p.theta) * p.velocity;
            p.velocity *= 0.9;
            p.age += 10;
            fill(200, 255 - p.age);
            ellipse(p.x, p.y, p.size, p.size);
            if(p.age > 255) {
                pDead = true;
            }
        }
        if(pDead) {
            this.dead = true;
        }
    };
};

// Elastic Soft Body
var Unit = function(x, y, mass, elasticity, still, type) {

    this.x = x;
    this.y = y;
    this.xVel = 0;
    this.yVel = 0;
    this.xAccel = 0;
    this.yAccel = 0;

    this.age = 0;
    this.mass = mass;
    this.elasticity = 0;
    this.still = still;
    
    // Boost type
    this.boostRatio = 1;
    this.boosts = [];
    
    this.type = type || "normal";

    switch(type) {
        case "balloon":
            this.size = 40;
        break;
        case "sticky":
            this.sticky = true;
        break;
        default:
            this.size = 20;
        break;
    }
    
};
var softBodies = {
    
    units: [],
    connections: [],
    particles: [],
    
    collisionX: function(u) {
        var unit = this.units[u];
        if(unit.x > game.xConstrain.max || unit.x < game.xConstrain.min) {
            unit.x = constrain(unit.x, game.xConstrain.min, game.xConstrain.max);
            unit.xVel = abs(unit.xVel) * -abs(unit.elasticity);
        }
        var noGo = false;
        for(var j = obstacles.length - 1; j >= 0; j --) {
            if(noGo) {
                return;
            }
            var o = obstacles[j];
            switch(o.type) {
                case "box":
                    if(!rrCol(unit.x, unit.y, 0, 0, o.x, o.y, o.width, o.height)) {
                        continue;
                    }
                    if(unit.xVel > 0 && unit.x < o.x + errorMargin) {
                        unit.x = o.x + o.xVel;
                        unit.xVel = abs(unit.xVel) * -unit.elasticity;
                        unit.yVel *= FRICTION;
                    }
                    if(unit.xVel < 0 && unit.x > o.x + o.width - errorMargin) {
                        unit.x = o.x + o.width + o.xVel;
                        unit.xVel = abs(unit.xVel) * -unit.elasticity;
                        unit.yVel *= FRICTION;
                    }
                    if((o.sticky || unit.sticky) && !unit.stuck) {
                        unit.still = true;
                        unit.stuck = j;
                        unit.xStuck = unit.x - o.x;
                        unit.yStuck = unit.y - o.y;
                    }
                break;
                case "goal":
                    if(!rrCol(unit.x, unit.y, 0, 0, o.x, o.y, o.width, o.height)) {
                        continue;
                    }
                    screenAnimation = 1;
                    screenTxt = 100;
                    screen = 2;
                    noGo = true;
                break;
                case "mincer":
                    if(unit.type !== "balloon" && dist(unit.x, unit.y, o.x, o.y) > o.size / 2 + 20) {
                        continue;
                    }
                    if(unit.type === "balloon") {
                        if(dist(unit.x, unit.y, o.x, o.y) > o.size / 2 + 40) {
                            continue;
                        }
                        for(var lol = this.connections.length - 1; lol >= 0; lol --) {
                            if(!isInArray(unit, this.connections[lol])) {
                                continue;
                            }
                            this.connections.splice(lol, 1);
                        }
                        this.units.splice(u, 1);
                        unit.popped = true;
                        for(var part = 0; part < random(20, 30); part ++) {
                            particles.push(new Pop(unit.x, unit.y));
                        }
                        sounds.impact.play();
                        return;
                    }
                    // screenAnimation = 1;
                    // screenTxt = 100;
                    // screen = 1;
                    unitsKilled ++;
                    unit.dead = true;
                break;
                case "spikes":
                    if(unit.type !== "balloon" && dist(unit.x, unit.y, constrain(unit.x, o.x + 20, o.x + o.width - 20), o.y) > 20) {
                        continue;
                    }
                    if(unit.type === "balloon") {
                        if(dist(unit.x, unit.y, constrain(unit.x, o.x + 20, o.x + o.width - 20), o.y) > 35) {
                            continue;
                        }
                        for(var lol = this.connections.length - 1; lol >= 0; lol --) {
                            if(!isInArray(unit, this.connections[lol])) {
                                continue;
                            }
                            this.connections.splice(lol, 1);
                        }
                        this.units.splice(u, 1);
                        unit.popped = true;
                        for(var part = 0; part < random(20, 30); part ++) {
                            particles.push(new Pop(unit.x, unit.y));
                        }
                        sounds.impact.play();
                        return;
                    }
                    // screenAnimation = 1;
                    // screenTxt = 100;
                    // screen = 1;
                    unitsKilled ++;
                    unit.dead = true;
                break;
                case "spikesSide":
                    if(unit.type !== "balloon" && !rrCol(unit.x, unit.y, 0, 0, o.x - 20, o.y, 40, o.width)) {
                        continue;
                    }
                    if(unit.type === "balloon") {
                        if(dist(unit.x, unit.y, o.x, constrain(unit.y, o.y + 20, o.y + o.width - 20)) > 35) {
                            continue;
                        }
                        for(var lol = this.connections.length - 1; lol >= 0; lol --) {
                            if(!isInArray(unit, this.connections[lol])) {
                                continue;
                            }
                            this.connections.splice(lol, 1);
                        }
                        this.units.splice(u, 1);
                        unit.popped = true;
                        for(var part = 0; part < random(20, 30); part ++) {
                            particles.push(new Pop(unit.x, unit.y));
                        }
                        sounds.impact.play();
                        return;
                    }
                    // screenAnimation = 1;
                    // screenTxt = 100;
                    // screen = 1;
                    unitsKilled ++;
                    unit.dead = true;
                break;
                case "blower":
                    if(!rrpCol(unit.x, unit.y, o.x, o.y, -o.width / 2, -1000, o.width, 1000, o.rotation)) {
                        continue;
                    }
                    var strength = constrain((o.furthest - dist(unit.x, unit.y, o.x, o.y)) / o.furthest, 0, 1);
                    unit.xVel += cos(o.rotation - 90) * o.strength * strength;
                    unit.yVel += sin(o.rotation - 90) * o.strength * strength;
                    unit.xAccel += cos(o.rotation - 90) * o.strength * strength;
                    unit.yAccel += sin(o.rotation - 90) * o.strength * strength;
                break;
                default:
                    continue;
            }
        }
    },
    collisionY: function(u) {
        var unit = this.units[u];
        if(unit.y < game.viewYconstrain.min) {
            unit.y = game.viewYconstrain.min;
            unit.yVel = 0;
        }
        for(var j = obstacles.length - 1; j >= 0; j --) {
            var o = obstacles[j];
            switch(o.type) {
                case "box":
                    if(!rrCol(unit.x, unit.y, 0, 0, o.x, o.y, o.width, o.height)) {
                        continue;
                    }
                    if(unit.yVel > 0 && unit.y < o.y + errorMargin) {
                        unit.xVel += o.xVel * FRICTION * 2;
                        unit.y = o.y + o.yVel;
                        unit.yVel = abs(unit.yVel) * -abs(unit.elasticity);
                    }
                    if(unit.yVel < 0 && unit.y > o.y + o.height - errorMargin) {
                        unit.xVel *= FRICTION;
                        unit.y = o.y + o.height + o.yVel;
                        unit.yVel = -abs(unit.yVel) * -abs(unit.elasticity);
                    }
                    if((o.sticky || unit.sticky) && !unit.stuck) {
                        unit.still = true;
                        unit.stuck = j;
                        unit.xStuck = unit.x - o.x;
                        unit.yStuck = unit.y - o.y;
                    }
                break;
                default:
                    continue;
            }
        }
        // var theNoise = noise(unit.x / 500) * 500;
        // if(unit.y > height - theNoise - 5) {
        //     unit.y = height - theNoise - 5;
        //     unit.yVel = abs(unit.yVel) * -abs(unit.elasticity);
        //     unit.xVel *= FRICTION;
        // }
    },
    
    forces: function() {

        for(var i = this.connections.length - 1; i >= 0; i --) {
            var connection = this.connections[i][1];
            var unit = this.connections[i][0];
            var distance = max(dist(unit.x, unit.y, connection.x, connection.y), 0.01);
            var forceMagnitude = (distance - this.connections[i][2]) * this.connections[i][3];
            var boostMagnitude;
            var boostForceX;
            var boostForceY;
            if(unit.type === "booster") {
                boostMagnitude = map(distance, 0, 100, 0, 0.5);
                boostForceX = (connection.x - unit.x) * boostMagnitude / DAMPING;
                boostForceY = (connection.y - unit.y) * boostMagnitude / DAMPING;
            }
            var xSpringForce = (connection.x - unit.x) / distance * forceMagnitude / DAMPING;
            var ySpringForce = (connection.y - unit.y) / distance * forceMagnitude / DAMPING;
            var totalForceX = xSpringForce;
            var totalForceY = ySpringForce;
            if(!unit.still) {
                unit.xAccel += xSpringForce;
                unit.yAccel += ySpringForce;
                if(unit.type === "booster") {
                    unit.xAccel = boostForceX;
                    unit.yAccel = boostForceY;
                }
            }
            if(connection.still) {
                continue;
            }
            connection.xAccel -= totalForceX;
            connection.yAccel -= totalForceY;
        }
        for(var i = this.units.length - 1; i >= 0; i--) {
            var unit = this.units[i];
            if(!unit.still && unit.type !== "balloon") {
                unit.yAccel += GRAVITY * unit.mass;
            }
            if(unit.type === "balloon") {
                unit.yAccel -= GRAVITY * 2 * unit.mass;
            }
            if(unit.still && unit.stuck !== undefined) {
                unit.x = obstacles[unit.stuck].x + unit.xStuck;
                unit.y = obstacles[unit.stuck].y + unit.yStuck;
            }
        }
        
    },
    applyForces: function() {
        
        for(var i = this.units.length - 1; i >= 0; i--) {
            var unit = this.units[i];
            unit.px = unit.x;
            unit.py = unit.y;
            if(!unit.still) {
                unit.xVel += unit.xAccel + random(-RANDOM, RANDOM);
                unit.xVel *= AIR_RESISTANCE;
                var vectorLength = dist(unit.xVel, unit.yVel, 0, 0);
                var xVelNormalized = unit.xVel / vectorLength;
                vectorLength = constrain(vectorLength, -MAX_SPEED, MAX_SPEED);
                unit.xVel = xVelNormalized * vectorLength;
                unit.x += unit.xVel / unit.mass;
                this.collisionX(i);
                if(game.loading || unit.popped) {
                    return;
                }
                unit.yVel += unit.yAccel + random(-RANDOM, RANDOM);
                unit.yVel *= AIR_RESISTANCE;
                vectorLength = dist(unit.xVel, unit.yVel, 0, 0);
                var yVelNormalized = unit.yVel / vectorLength;
                vectorLength = constrain(vectorLength, -MAX_SPEED, MAX_SPEED);
                unit.yVel = yVelNormalized * vectorLength;
                unit.y += unit.yVel / unit.mass;
                this.collisionY(i);
            }
            unit.xAccel = 0;
            unit.yAccel = 0;
        }
        
    },
    display: function() {
        
        if(!game.pause) {
            this.forces();
            this.applyForces();
        }
        strokeWeight(5);
        for(var j = this.connections.length - 1; j >= 0; j --) {
            var connection = this.connections[j];
            stroke(0);
            strokeWeight(constrain((connection[2] - dist(connection[0].x, connection[0].y, connection[1].x, connection[1].y)) / 10, -3, 5) + 5);
            line(connection[0].x, connection[0].y, connection[1].x, connection[1].y);
            if(connection[1].type !== "zombie" && connection[0].type === "zombie" && connection[0].age === 50) {
                unitsKilled ++;
                connection[1].type = "zombie";
                connection[1].age = 0;
                connection[3] = game.defaultStiffness;
            }
            if(connection[0].type !== "zombie" && connection[1].type === "zombie" && connection[1].age === 50) {
                unitsKilled ++;
                connection[0].type = "zombie";
                connection[0].age = 0;
            }
            if(connection[0].dead || connection[1].dead) {
                this.connections.splice(j, 1);
            }
        }

        for(var i = this.particles.length - 1; i >= 0; i --) {
            var p = this.particles[i];
            p.x += cos(p.theta) * p.velocity;
            p.y += sin(p.theta) * p.velocity;
            p.velocity *= 0.9;
            fill(p.r, p.g, p.b, p.age);
            noStroke();
            ellipse(p.x, p.y, p.size, p.size);
            p.age -= 10;
            if(p.age <= 10) {
                this.particles.splice(i, 1);
            }
        }
        for(var i = this.units.length - 1; i >= 0; i--) {
            var unit = this.units[i];
            unit.age ++;
            if(unit.y > game.maxHeight) {
                // screenAnimation = 1;
                // screenTxt = 100;
                // screen = 1;
                unitsKilled ++;
                unit.dead = true;
            }
            if(unit.type === "zombie" && unit.age === 50) {
                unit.dead = true;
            }
            if(unit.dead) {
                for(var j = 0; j < random(10, 20); j ++) {
                    this.particles.push({
                        x: unit.x,
                        y: unit.y,
                        theta: random(360),
                        velocity: random(3, 5),
                        size: random(5, 15),
                        r: 0,
                        g: 0,
                        b: 0,
                        age: 255,
                    });
                    var newParticle = this.particles[this.particles.length - 1];
                    switch(unit.type) {
                        case "booster":
                            newParticle.r = map(unit.boostRatio, 1, -0.3, 255, 0);
                        break;
                        case "sticky":
                            newParticle.r = 255;
                            newParticle.g = 100;
                            newParticle.b = 100;
                        break;
                        case "zombie":
                            newParticle.g = 200;
                        break;
                    }
                }
                this.units.splice(i, 1);
                sounds.ouch.play();
                shake += 10;
                continue;
            }
            
            switch(unit.type) {
                case "booster":
                    fill(map(unit.boostRatio, 1, -0.3, 255, 0), 0, 0);
                break;
                case "sticky":
                    fill(255, 100, 100);
                break;
                case "zombie":
                    fill(0, 200, 0);
                break;
                default:
                    fill(0);
                break;
            }
            if(unit.type === "balloon") {
                noFill();
                strokeWeight(1);
                for(var b = 0; b < 40; b ++) {
                    stroke(0, 100, 255, map(b, 0, 40, 50, 150));
                    ellipse(unit.x, unit.y, b, b);
                }
                stroke(255, 200);
                strokeWeight(5);
                arc(unit.x, unit.y, 30, 30, -80, 10);
            }
            else {
                noStroke();
                ellipse(unit.x, unit.y, 20, 20);
            }

            if(unit.type === "booster") {
                unit.boostRatio -= 0.006;
                if(unit.boostRatio < 0) {
                    unit.type = "normal";
                    for(var j = 0; j < this.connections.length; j ++) {
                        var c = this.connections[j];
                        c[3] = game.defaultStiffness;
                    }
                }
                for(var j = 0; j < 2; j ++) {
                    unit.boosts.push({
                        x: unit.x,
                        y: unit.y,
                        size: random(5, 10),
                        velocity: random(10, 20),
                        direction: 180 + atan2(unit.yVel, unit.xVel) + random(-45, 45),
                        r: random(200, 255),
                        g: random(200),
                    });
                }
            }
            if(unit.boosts.length !== 0) {
                for(var j = unit.boosts.length - 1; j >= 0; j --) {
                    var b = unit.boosts[j];
                    b.x += cos(b.direction) * b.velocity;
                    b.y += sin(b.direction) * b.velocity;
                    b.velocity *= 0.9;
                    fill(b.r, b.g, 0, map(b.velocity, 0, 5, 0, 200));
                    noStroke();
                    ellipse(b.x, b.y, b.size, b.size);
                    if(b.velocity < 0.1) {
                        unit.boosts.splice(j, 1);
                    }
                }
            }
            
        }
        
    },
    
};

// Game cache
var game = {
    holdUnit: "none",

    loaded: false,
    maxHeight: 600,

    addMode: true,
    addType: "normal",

    units: 0,

    timer: 0,
    
    viewXconstrain: {
        min: 0,
        max: 1920,
    },
    viewYconstrain: {
        min: 0,
        max: 1080,
    },

    xConstrain: {
        min: 1,
        max: 1919,
    },

    defaultStiffness: 1,

    level: 0,
    levels: [
        function() {
            GRAVITY = 0.3;
            var l = 100;
            game.units = 10;
            softBodies.units.push(new Unit(400, 700, 10, 1, false));
            softBodies.units.push(new Unit(400 + l / 2, 650, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(400 + l, 700, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            obstacles.push(new Box(-50, 800, 600, 500, false));
            obstacles.push(new Box(700, 750, 1270, 500, false));
            obstacles.push(new Spikes(550, 1080, 250));
            obstacles.push(new Goal(750, 0, 1270, 1080));
            obstacles.push(new Sign(710, 760, "=>", 5));
        },
        function() {
            GRAVITY = 0.2;
            var l = 100;
            game.units = 20;
            view.x = 600;
            view.xTo = 600;
            view.y = 0;
            view.yTo = 0;
            game.viewYconstrain = {
                min: -200,
                max: 1080,
            };
            softBodies.units.push(new Unit(850, 800, 10, 1, false));
            softBodies.units.push(new Unit(850 + l / 2, 700, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(850 + l, 800, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            obstacles.push(new Box(-50, 800, 1050, 500, false));
            obstacles.push(new Box(1250, 200, 100, 1000, true));
            obstacles.push(new Box(1250, 800, 1050, 500, false));
            obstacles.push(new Goal(1250, 100, 100, 100));
            obstacles.push(new Sign(1300, 210, "star", -3));
        },
        function() {
            GRAVITY = 0.1;
            var l = 100;
            view.x = 450;
            view.xTo = 450;
            view.y = 280;
            view.yTo = 280;
            game.units = 1;
            softBodies.units.push(new Unit(700 + l / 2, 775, 10, 1, false));
            softBodies.units.push(new Unit(700 + l / 2, 800, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(700 + l, 800, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(700 + l, 775, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 4],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            obstacles.push(new Box(1920 / 2 - 100, 300, 200, 200, false));
            obstacles.push(new Box(-50, 900, 900, 300, false));
            obstacles.push(new Box(1070, 900, 900, 300, false));
            obstacles.push(new Mincer(1920 / 2, 490, 150));
            obstacles.push(new Mincer(1920 / 2, 310, 150));
            obstacles.push(new Mincer(1920 / 2, 1080, 300));
            obstacles.push(new Goal(1500, 0, 420, 1920));
            obstacles.push(new Sign(1450, 910, "=>", 2));
        },
        function() {
            GRAVITY = 0.5;
            var l = 100;
            game.units = 36;
            game.viewYconstrain = {
                min: 0,
                max: 1080,
            };
            softBodies.units.push(new Unit(375 + l / 2, 650, 10, 1, false));
            softBodies.units.push(new Unit(375 + l, 700, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(375, 700, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            obstacles.push(new Box(-50, -50, 2020, 250, false));
            obstacles.push(new Box(1420, 700, 550, 500, false));
            obstacles.push(new Box(-50, 700, 550, 500, true));
            obstacles.push(new Spikes(0, 200, 1920));
            obstacles.push(new Spikes(200, 1080, 1420));
            obstacles.push(new Mincer(50, 100, 100));
            obstacles.push(new Goal(1500, 0, 420, 1080));
            obstacles.push(new Sign(1450, 710, "=>", -7));
        },
        function() {
            GRAVITY = 0.1;
            var l = 100;
            game.units = 12;
            game.maxHeight = 700;
            view.yTo = -1000;
            view.y = -1000;
            game.viewYconstrain = {
                min: -1000,
                max: 1080,
            };
            softBodies.units.push(new Unit(600 + l / 2, 375, 10, 1, false));
            softBodies.units.push(new Unit(600 + l / 2, 400, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(600 + l, 400, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(600 + l, 375, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 4],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            obstacles.push(new Box(-50, -1050, 2020, 150, false));
            obstacles.push(new Box(-600, 0, 1920, 100, false));
            obstacles.push(new Box(-50, 550, 2020, 580, false));
            obstacles.push(new Box(500, -500, 1920, 100, false));
            obstacles.push(new Spikes(-600, 100, 1920));
            obstacles.push(new Mincer(50, 100, 100));
            obstacles.push(new Goal(700, -1000, 1220, 500));
            obstacles.push(new Sign(650, -490, "=>", -7));
        },
        function() {
            GRAVITY = 0.1;
            var l = 100;
            game.units = 10;
            view.yTo = -50;
            view.y = -50;
            game.viewYconstrain = {
                min: -50,
                max: 1080,
            };
            softBodies.units.push(new Unit(900 + l / 2, 775, 10, 1, false));
            softBodies.units.push(new Unit(900 + l / 2, 800, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(900 + l, 800, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(900 + l, 775, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 4],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            obstacles.push(new Box(200, 300, 1920, 100, false));
            obstacles.push(new Box(-200, -100, 700, 250, false));
            obstacles.push(new Box(-50, 830, 2020, 300, false));
            obstacles.push(new Spikes(0, 150, 400));
            obstacles.push(new Goal(400, 150, 100, 150));
            obstacles.push(new Sign(350, 310, "=>", 1));
        },
        function() {
            GRAVITY = 0.5;
            var l = 100;
            game.units = 5;
            view.yTo = 0;
            view.y = 0;
            game.viewYconstrain = {
                min: 0,
                max: 1080,
            };
            softBodies.units.push(new Unit(100 + l / 2, 775, 10, 1, false));
            softBodies.units.push(new Unit(100 + l / 2, 800, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(100 + l, 800, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(100 + l, 775, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 4],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            obstacles.push(new Box(-50, 0, 2020, 100, false));
            obstacles.push(new Box(-50, 830, 380, 300, false));
            obstacles.push(new Spikes(0, 100, 1920));
            obstacles.push(new Spikes(330, 1080, 1590));
            obstacles.push(new Mincer(50, 100, 100));
            obstacles.push(new Goal(1500, 0, 420, 1080));
            obstacles.push(new Sign(1450, 1080, "=>", -2));
        },
        function() {
            GRAVITY = 0.5;
            var l = 100;
            game.units = 5;
            view.yTo = 0;
            view.y = 0;
            game.viewYconstrain = {
                min: 0,
                max: 1080,
            };
            softBodies.units.push(new Unit(100 + l / 2, 775, 10, 1, false));
            softBodies.units.push(new Unit(100 + l / 2, 800, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(100 + l, 800, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(100 + l, 775, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 4],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            obstacles.push(new Box(-50, 0, 2020, 100, false));
            obstacles.push(new Box(-50, 830, 380, 300, false));
            obstacles.push(new Spikes(0, 100, 1920));
            obstacles.push(new Spikes(330, 1080, 1590));
            obstacles.push(new Mincer(50, 100, 100));
            obstacles.push(new Goal(1500, 0, 420, 1080));
            obstacles.push(new Sign(1450, 1080, "=>", 3));
            obstacles.push(new Blower(960, 800, 60, -20, 10, 1000));
        },
        function() {
            GRAVITY = 0.5;
            var l = 100;
            game.units = 80;
            view.yTo = 0;
            view.y = 0;
            game.viewYconstrain = {
                min: 0,
                max: 1080,
            };
            softBodies.units.push(new Unit(1500 + l / 2, 575, 10, 1, false));
            softBodies.units.push(new Unit(1500 + l / 2, 600, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(1500 + l, 600, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(1500 + l, 575, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 4],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            obstacles.push(new Spikes(0, 1080, 1500));
            obstacles.push(new Mincer(1920 / 2, 450, 200));
            obstacles.push(new Box(1500, 800, 470, 330, true));
            obstacles.push(new Box(500, 400, 1470, 100, false));
            obstacles.push(new Box(1800, 500, 170, 300, false));
            obstacles.push(new Box(-50, -50, 2020, 150, false));
            obstacles.push(new Spikes(0, 100, 1920));
            obstacles.push(new Goal(1800, 0, 120, 400));
            obstacles.push(new Sign(1750, 410, "=>", -5));
        },
        function() {
            GRAVITY = 0.5;
            var l = 100;
            game.units = 8;
            view.xTo = -1;
            view.x = 0;
            view.yTo = 0;
            view.y = 0;
            game.viewXconstrain = {
                min: 0,
                max: 2000,
            };
            game.viewYconstrain = {
                min: 0,
                max: 1080,
            };
            softBodies.units.push(new Unit(100 + l / 2, 875, 10, 1, false));
            softBodies.units.push(new Unit(100 + l / 2, 900, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(100 + l, 900, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(100 + l, 875, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 4],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            obstacles.push(new Box(-50, 900, 2100, 250, false));
            obstacles.push(new Box(800, -50, 100, 550, false));
            obstacles.push(new Box(350, 500, 100, 580, true));
            obstacles.push(new Goal(1900, 0, 100, 1920));
            obstacles.push(new Box(-50, -50, 550, 150, false));
            obstacles.push(new Spikes(0, 100, 500));
            obstacles.push(new SpikesSide(500, 0, 100));
            obstacles.push(new SpikesSide(800, 0, 300));
            obstacles.push(new Sign(1850, 910, "=>", 3));
            obstacles.push(new Zombie(1200, 800));
        },
        function() {
            world = "Graveyard";
            GRAVITY = 0.5;
            var l = 100;
            game.units = 2;
            view.xTo = 43;
            view.x = 43;
            view.yTo = 277;
            view.y = 277;
            game.viewXconstrain = {
                min: 0,
                max: 2000,
            };
            game.viewYconstrain = {
                min: 0,
                max: 1080,
            };
            softBodies.units.push(new Unit(100 + l / 2, 875, 10, 1, false));
            softBodies.units.push(new Unit(100 + l / 2, 900, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(100 + l, 900, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(100 + l, 875, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 4],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            obstacles.push(new Box(-50, 900, 2100, 250, false));
            obstacles.push(new Goal(1900, 0, 100, 1920));
            for(var i = 0; i < 10; i ++) {
                obstacles.push(new Gravestone(i * 100 + 500, 900));
            }
            obstacles.push(new Sign(1850, 910, "=>", -4));
        },
        function() {
            world = "Graveyard";
            GRAVITY = 0.5;
            var l = 100;
            game.units = 7;
            view.xTo = -1;
            view.x = 0;
            view.yTo = 0;
            view.y = 0;
            game.viewXconstrain = {
                min: 0,
                max: 2000,
            };
            game.viewYconstrain = {
                min: 0,
                max: 1080,
            };
            softBodies.units.push(new Unit(100 + l / 2, 875, 10, 1, false));
            softBodies.units.push(new Unit(100 + l / 2, 900, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(100 + l, 900, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(100 + l, 875, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 4],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            obstacles.push(new Box(-50, 900, 2100, 250, false));
            obstacles.push(new Box(400, 550, 300, 100, false));
            obstacles.push(new Box(1000, 500, 100, 600, true));
            obstacles.push(new Box(400, -50, 100, 650, false));
            obstacles.push(new Box(950, 775, 100, 175, false));
            obstacles.push(new Goal(1900, 0, 100, 1920));
            obstacles.push(new Zombie(600, 500));
            obstacles.push(new Gravestone(600, 550));
            obstacles.push(new Sign(1850, 910, "=>", 2));
        },
        function() {
            world = "Graveyard";
            GRAVITY = 0.5;
            var l = 100;
            game.units = 12;
            view.xTo = -1;
            view.x = 0;
            view.yTo = 0;
            view.y = 0;
            game.viewXconstrain = {
                min: 0,
                max: 1920,
            };
            game.viewYconstrain = {
                min: -200,
                max: 1080,
            };
            softBodies.units.push(new Unit(668 + l / 2, 875, 10, 1, false));
            softBodies.units.push(new Unit(668 + l / 2, 900, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(668 + l, 900, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(668 + l, 875, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 4],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            obstacles.push(new Box(-50, 900, 2100, 250, false));
            obstacles.push(new Box(-50, 600, 1500, 100, false));
            obstacles.push(new Box(900, 200, 1070, 100, false));
            obstacles.push(new Spikes(900, 300, 1070));
            obstacles.push(new Goal(1820, -200, 100, 400));
            for(var i = 0; i < 5; i ++) {
                obstacles.push(new Gravestone(i * 100 + 1000, 900));
            }
            obstacles.push(new Sign(1770, 210, "=>", -7));
        },
        function() {
            world = "Graveyard";
            GRAVITY = 0.5;
            var l = 100;
            game.units = 12;
            view.xTo = 0;
            view.x = 0;
            view.yTo = -1;
            view.y = 0;
            game.viewXconstrain = {
                min: 0,
                max: 1920,
            };
            game.viewYconstrain = {
                min: 0,
                max: 1080,
            };
            softBodies.units.push(new Unit(75 + l / 2, 100, 10, 1, false));
            softBodies.units.push(new Unit(75 + l / 2, 200, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(75 + l, 200, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(75 + l, 100, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 4],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            for(var i = 0; i < 6; i ++) {
                obstacles.push(new Box(i * 317, 900, 340, 500, false, true));
            }
            obstacles.push(new Gravestone(400, 900));
            obstacles.push(new Gravestone(700, 900));
            obstacles.push(new Gravestone(800, 900));
            obstacles.push(new Box(-50, 200, 250, 100, false));
            obstacles.push(new Box(700, -50, 100, 400, true));
            obstacles.push(new Box(1700, 300, 270, 100, false));
            obstacles.push(new Spikes(0, 300, 200));
            obstacles.push(new Goal(1820, 0, 100, 300));
            obstacles.push(new Zombie(1000, 900));
            obstacles.push(new Zombie(1300, 900));
            obstacles.push(new Sign(1770, 310, "=>", 10));
            obstacles.push(new Spikes(700, 0, 1220));
            // obstacles.push(new SpikesSide(1700, 200, 100));
            obstacles.push(new Box(1200, 300, 200, 100, false, true));
        },
        function() {
            world = "Graveyard";
            GRAVITY = 0.5;
            var l = 100;
            game.units = 12;
            view.xTo = 0;
            view.x = 0;
            view.yTo = -1;
            view.y = 0;
            game.viewXconstrain = {
                min: 0,
                max: 1500,
            };
            game.viewYconstrain = {
                min: 0,
                max: 1080,
            };
            softBodies.units.push(new Unit(75 + l / 2, 200, 10, 1, false));
            softBodies.units.push(new Unit(75 + l / 2, 300, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 2],
                softBodies.units[softBodies.units.length - 1],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(75 + l, 300, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            softBodies.units.push(new Unit(75 + l, 200, 10, 1, false));
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 2],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 4],
                l,
                game.defaultStiffness,
            ]);
            softBodies.connections.push([
                softBodies.units[softBodies.units.length - 1],
                softBodies.units[softBodies.units.length - 3],
                l,
                game.defaultStiffness,
            ]);
            obstacles.push(new Gravestone(200, 750));
            obstacles.push(new Gravestone(300, 750));
            obstacles.push(new Gravestone(400, 750));
            obstacles.push(new Box(250, 200, 100, 400, false));
            obstacles.push(new Box(500, -50, 100, 900, false));
            obstacles.push(new Box(150, 750, 352, 100, false));
            obstacles.push(new Box(150, 1030, 600, 100, false));
            obstacles.push(new Box(1300, 300, 250, 100, false));
            obstacles.push(new Goal(1400, 0, 100, 300));
            obstacles.push(new Zombie(1000, 900));
            obstacles.push(new Blower(150, 500, 150, 0, 20, 200, 3));
            obstacles.push(new Blower(50, 100, 150, 80, 20, 400, 5));
            obstacles.push(new Sign(1370, 310, "=>", 10));
            obstacles.push(new Spikes(0, 1080, 1500));
        },
    ],

    loading: false,
    load: function() {
        world = "Overworld";
        game.loading = true;
        softBodies.units = [];
        softBodies.connections = [];
        softBodies.particles = [];
        obstacles = [];
        particles = [];
        game.addType = "normal";
        game.maxHeight = 1080;
        game.viewXconstrain = {
            min: 0,
            max: 1920,
        };
        view.x = 0;
        view.xTo = 0;
        view.y = 0;
        view.yTo = 0;
        game.viewYconstrain = {
            min: 0,
            max: 1080,
        };
        game.xConstrain = {
            min: 0,
            max: 1920,
        };
        this.levels[this.level]();
        if(view.yTo === 0 && view.xTo === 0) {
            var averagePos = {
                x: 0,
                y: 0,
            };
            for(var i = 0; i < softBodies.units.length; i ++) {
                var u = softBodies.units[i];
                averagePos.x += u.x;
                averagePos.y += u.y;
            }
            averagePos.x /= softBodies.units.length;
            averagePos.y /= softBodies.units.length;
            view.x = averagePos.x - width / 2;
            view.xTo = averagePos.x - width / 2;
            view.y = averagePos.y - height / 2;
            view.yTo = averagePos.y - height / 2;
        }
        game.timer = 0;
        game.maxUnits = game.units;
    },

};

// Clouds
var clouds = [];

// Setup
var jscanvas;
var setup = function() {
    createCanvas(1000, 800);
    angleMode(DEGREES);
    sprites.init();
    sounds.init();

    jscanvas = document.getElementById("defaultCanvas0");
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1iv(gl.getUniformLocation(program, "u_canvas"), [0]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
};

// Mouse Released
var mouseReleased = function() {
    clicked = true;
};

// Key Pressed
var keyPressed = function() {
    keys[keyCode] = true;
    keys[key.toString().toLowerCase()] = true;
};

// Key Released
var keyReleased = function() {
    keys[keyCode] = false;
    keys[key.toString().toLowerCase()] = false;
};

// Draw
var adds = [];
var draw = function() {
    tileSize = map(width, 600, 1920, 50, 75);
    cursor(ARROW);
    background(0, 255, 255);
    strokeWeight(2);
    for(var i = 0; i < height + 1; i += 2) {
        switch(world) {
            case "Overworld":
                stroke(0, map(i + view.y, 0, height, 200, 100), map(i + view.y, 0, height, 255, 200));
            break;
            case "Graveyard":
                stroke(0, map(i + view.y, 0, height, 200, 100), map(i + view.y, 0, height, 200, 100));
            break;
        }
        line(0, i, width, i);
    }
    
    if(!game.loaded) {
        game.load();
        game.loaded = true;
    }

    if(!game.loading && screenAnimation === 0) {
        game.timer ++;
        if(keys.q || (rrCol(mouseX, mouseY, 0, 0, tileSize, 0, tileSize, tileSize) && mouseIsPressed)) {
            game.addType = "normal";
        }
        if((keys.w || (rrCol(mouseX, mouseY, 0, 0, tileSize * 2, 0, tileSize, tileSize) && mouseIsPressed)) && game.level > 1) {
            game.addType = "booster";
        }
        if((keys.e || (rrCol(mouseX, mouseY, 0, 0, tileSize * 3, 0, tileSize, tileSize) && mouseIsPressed)) && game.level > 2) {
            game.addType = "balloon";
        }
        if((keys.r || (rrCol(mouseX, mouseY, 0, 0, tileSize * 4, 0, tileSize, tileSize) && mouseIsPressed)) && game.level > 4) {
            game.addType = "sticky";
        }
        push();
        if(mouseIsPressed && mouseButton === RIGHT) {
            view.xTo -= mouseX - pmouseX;
            view.yTo -= mouseY - pmouseY;
        }
        view.xTo = constrain(view.xTo, game.viewXconstrain.min, game.viewXconstrain.max - width);
        view.yTo = constrain(view.yTo, game.viewYconstrain.min, game.viewYconstrain.max - height);
        view.translate();

        if(world === "Overworld") {
            if(round(random(50)) === 1) {
                clouds.push({
                    x: game.viewXconstrain.min - sprites.cloud.width,
                    y: random(-500, 50),
                    velocity: random(1, 3),
                });
            }
            for(var i = clouds.length - 1; i >= 0; i --) {
                var c = clouds[i];
                image(sprites.cloud, c.x, c.y);
                c.x += c.velocity;
                if(c.x > game.viewXconstrain.max) {
                    clouds.splice(i, 1);
                }
            }
        }

        for(var i = obstacles.length - 1; i >= 0; i --) {
            var o = obstacles[i];
            o.display();
            if(o.dead) {
                obstacles.splice(i, 1);
            }
        }

        softBodies.display();
        for(var i = particles.length - 1; i >= 0; i --) {
            particles[i].display();
            if(particles[i].terminated) {
                particles.splice(i, 1);
            }
        }

        adds = [];
        var goodToGo = true;
        if(game.units < 1) {
            goodToGo = false;
        }
        else {
            for(var i = obstacles.length - 1; i >= 0; i --) {
                var o = obstacles[i];
                if(!goodToGo) {
                    continue;
                }
                if(o.type === "mincer" && dist(view.mouseX, view.mouseY, o.x, o.y) > o.size / 2) {
                    continue;
                }
                if(o.type === "spikes" && !rrCol(view.mouseX, view.mouseY, 0, 0, o.x, o.y - 20, o.width, 40)) {
                    continue;
                }
                if(o.type === "box" && !rrCol(view.mouseX, view.mouseY, 0, 0, o.x, o.y, o.width, o.height)) {
                    continue;
                }
                if(o.type === "zombie" && !rrCol(view.mouseX, view.mouseY, 0, 0, o.x, o.y, o.width, o.height)) {
                    continue;
                }
                if(o.type === "spikesSide" && !rrCol(view.mouseX, view.mouseY, 0, 0, o.x - 10, o.y, 40, o.width)) {
                    continue;
                }
                if(o.type === "goal" || o.type === "blower" || o.type === "sign" || o.type === "ghost" || o.type === "gravestone") {
                    continue;
                }
                goodToGo = false;
            }
        }
        if(goodToGo) {
            for(var i = softBodies.units.length - 1; i >= 0; i --) {
                var unit = softBodies.units[i];
                if(game.addMode === true) {
                    if(unit.type === "booster" || unit.type === "balloon" || unit.type === "zombie") {
                        continue;
                    }
                    if(dist(view.mouseX, view.mouseY, unit.x, unit.y) > 125) {
                        continue;
                    }
                    adds.push(unit);
                }
            }
            adds.sort(function(a, b) {
                return dist(view.mouseX, view.mouseY, a.x, a.y) - dist(view.mouseX, view.mouseY, b.x, b.y);
            });
            if(adds.length > 0 && game.addMode && mouseY > tileSize) {
                stroke(255);
                strokeWeight(5);
                switch(game.addType) {
                    case "booster":
                        if(adds.length < 2) {
                            goodToGo = false;
                        }
                        adds = [adds[0], adds[1]];
                        if(goodToGo) {
                            for(var i = adds.length - 1; i >= 0; i --) {
                                var unit = adds[i];
                                line(view.mouseX, view.mouseY, unit.x, unit.y);
                            }
                            if(clicked && mouseButton === LEFT && game.units > 0) {
                                game.units --;
                                softBodies.units.push(new Unit(view.mouseX, view.mouseY, 10, 1, false, "booster"));
                                softBodies.connections.push([
                                    softBodies.units[softBodies.units.length - 1],
                                    adds[0],
                                    dist(view.mouseX, view.mouseY, adds[0].x, adds[0].y),
                                    10,
                                ]);
                                softBodies.connections.push([
                                    softBodies.units[softBodies.units.length - 1],
                                    adds[1],
                                    dist(view.mouseX, view.mouseY, adds[1].x, adds[1].y),
                                    10,
                                ]);
                                sounds.place.play();
                            }
                        }
                    break;
                    case "sticky":
                        if(adds.length < 2) {
                            goodToGo = false;
                        }
                        adds = [adds[0], adds[1]];
                        if(goodToGo) {
                            for(var i = adds.length - 1; i >= 0; i --) {
                                var unit = adds[i];
                                line(view.mouseX, view.mouseY, unit.x, unit.y);
                            }
                            if(clicked && mouseButton === LEFT && game.units > 0) {
                                game.units --;
                                softBodies.units.push(new Unit(view.mouseX, view.mouseY, 10, 1, false, "sticky"));
                                softBodies.connections.push([
                                    softBodies.units[softBodies.units.length - 1],
                                    adds[0],
                                    dist(view.mouseX, view.mouseY, adds[0].x, adds[0].y),
                                    game.defaultStiffness,
                                ]);
                                softBodies.connections.push([
                                    softBodies.units[softBodies.units.length - 1],
                                    adds[1],
                                    dist(view.mouseX, view.mouseY, adds[1].x, adds[1].y),
                                    game.defaultStiffness,
                                ]);
                                sounds.place.play();
                            }
                        }
                    break;
                    case "balloon":
                        adds = [adds[0]];
                        if(goodToGo) {
                            for(var i = adds.length - 1; i >= 0; i --) {
                                var unit = adds[i];
                                line(view.mouseX, view.mouseY, unit.x, unit.y);
                            }
                            if(clicked && mouseButton === LEFT && game.units > 0) {
                                game.units --;
                                softBodies.units.push(new Unit(view.mouseX, view.mouseY, 10, 1, false, "balloon"));
                                softBodies.connections.push([
                                    softBodies.units[softBodies.units.length - 1],
                                    adds[0],
                                    dist(view.mouseX, view.mouseY, adds[0].x, adds[0].y),
                                    game.defaultStiffness,
                                ]);
                                sounds.place.play();
                            }
                        }
                    break;
                    default:
                        if(adds.length < 2) {
                            goodToGo = false;
                        }
                        adds = [adds[0], adds[1]];
                        if(goodToGo) {
                            var rightOk = true;
                            for(var i = adds.length - 1; i >= 0; i --) {
                                var unit = adds[i];
                                line(view.mouseX, view.mouseY, unit.x, unit.y);
                                for(var j = softBodies.connections.length - 1; j >= 0; j --) {
                                    var connection = softBodies.connections[j];
                                    if(connection[0] !== unit && connection[1] !== unit) {
                                        continue;
                                    }
                                    if(isInArray(adds[1 - i], connection) && isInArray(adds[i], connection)) {
                                        rightOk = false;
                                    }
                                }
                            }
                            if(clicked && mouseButton === LEFT && game.units > 0) {
                                game.units --;
                                softBodies.units.push(new Unit(view.mouseX, view.mouseY, 10, 1, false));
                                for(var i = adds.length - 1; i >= 0; i --) {
                                    softBodies.connections.push([
                                        softBodies.units[softBodies.units.length - 1],
                                        adds[0],
                                        dist(view.mouseX, view.mouseY, adds[0].x, adds[0].y),
                                    game.defaultStiffness,
                                    ]);
                                    softBodies.connections.push([
                                        softBodies.units[softBodies.units.length - 1],
                                        adds[1],
                                        dist(view.mouseX, view.mouseY, adds[1].x, adds[1].y),
                                    game.defaultStiffness,
                                    ]);
                                }
                                sounds.place.play();
                            }
                            if(clicked && mouseButton === RIGHT && rightOk) {
                                softBodies.connections.push([
                                    adds[0],
                                    adds[1],
                                    dist(adds[0].x, adds[0].y, adds[1].x, adds[1].y),
                                    game.defaultStiffness,
                                ]);
                            }
                        }
                }
                if(goodToGo) {
                    for(var i = 0; i < 360; i += 90) {
                        line(view.mouseX + cos(frameCount * 2 + i) * (45 + cos(frameCount * 3) * 8), view.mouseY + sin(frameCount * 2 + i) * (45 + cos(frameCount * 3) * 8), view.mouseX + cos(frameCount * 2 + i) * (55 + cos(frameCount * 3) * 8), view.mouseY + sin(frameCount * 2 + i) * (55 + cos(frameCount * 3) * 8));
                    }
                    noStroke();
                    switch(game.addType) {
                        case "booster":
                            fill(255, 0, 0, 150);
                            ellipse(view.mouseX, view.mouseY, 20, 20);
                        break;
                        case "balloon":
                            fill(0, 100, 255, 150);
                            ellipse(view.mouseX, view.mouseY, 40, 40);
                        break;
                        case "sticky":
                            fill(255, 100, 100, 150);
                            ellipse(view.mouseX, view.mouseY, 20, 20);
                        break;
                        default:
                            fill(0, 150);
                            ellipse(view.mouseX, view.mouseY, 20, 20);
                        break;
                    }
                }
            }
        }
        
        pop();

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, jscanvas);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        clear();

        push();
        translate(-view.x, -view.y);


        fill(0);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(30);
        var waitTime = 50;
        switch(game.level) {
            case 0:
                text("Build a chain to the green region\nRight click and drag to pan the view", 1920 / 4.2, 1080 / 2);
            break;
            case 1:
                if(game.timer === waitTime) {
                    view.yTo = 200;
                }
                text("Pink blocks are sticky!", 900, 600);
            break;
            case 2:
                text("Boosters move toward connected units.\nPress 'w' to select boosters, 'q' to select normal units.\nUnits can only connect to booster units that have run out of fuel.", 1920 / 2, 1080 / 1.5);
            break;
            case 3:
                text("Press 'e' to select balloon units.\nThey float up, but can easily pop.\nUnits cannot connect to balloon units.", 1920 / 4.5, 1080 / 2);
            break;
            case 4:
                if(game.timer === waitTime) {
                    view.yTo = 0;
                }
            break;
            case 5:
                text("Press 'r' to select sticky units.\nWhen they collide with a block, they stick to it.", 800, 1080 / 2);
                if(game.timer === waitTime) {
                    view.xTo = 280;
                    view.yTo = 200;
                }
            break;
            case 7:
                obstacles[obstacles.length - 1].rotation = cos(frameCount * 2) * 45;
            break;
            case 9:
                text("Avoid monsters!", 1920 / 2, 600);
            break;
            case 10:
                text("Come too close to a gravestone,\nand a ghost will come out to haunt you!", 600, 1080 / 2);
            break;
            case 13:
                var o = obstacles[6];
                if(o.type === "gravestone") {
                    o.y = 900 + cos(frameCount * 3 + 1 * 100) * 25;
                }
                var o = obstacles[8];
                if(o.type === "gravestone") {
                    o.y = 900 + cos(frameCount * 3 + 2 * 100) * 25;
                }
                var o = obstacles[7];
                if(o.type === "gravestone") {
                    o.y = 900 + cos(frameCount * 3 + 2 * 100) * 25;
                }
                for(var i = 0; i < 6; i ++) {
                    o = obstacles[i];
                    o.yVel = 900 + cos(frameCount * 3 + i * 100) * 25 - o.y;
                }
                o = obstacles[obstacles.length - 1];
                if(o.type === "ghost") {
                    o = obstacles[obstacles.length - 2];
                }
                if(o.type === "ghost") {
                    o = obstacles[obstacles.length - 3];
                }
                if(o.type === "ghost") {
                    o = obstacles[obstacles.length - 4];
                }
                o.xVel = 1150 + cos(frameCount * 1) * 350 - o.x;
            break;
        }
        pop();

        fill(255, 200);
        noStroke();
        rect(0, 0, width, tileSize);
        if(mouseY < tileSize) {
            if(mouseX < tileSize) {
                rect(0, 0, tileSize, tileSize);
                cursor(HAND);
                if(clicked) {
                    game.load();
                }
            }
        }
        stroke(0);
        strokeWeight(3);
        noFill();
        arc(tileSize / 2, tileSize / 2, 17, 17, 90, 360);
        line(tileSize / 2 + 8, tileSize / 2, tileSize / 2 + 3, tileSize / 2 - 1);
        line(tileSize / 2 + 8, tileSize / 2, tileSize / 2 + 11, tileSize / 2 - 5);

        noStroke();
        fill(0, 100);
        if(game.addType === "normal") {
            fill(255, 100);
        }
        rect(tileSize, 0, tileSize, tileSize);
        fill(0, 100);
        if(game.addType === "booster") {
            fill(255, 100);
        }
        rect(tileSize * 2, 0, tileSize, tileSize);
        fill(0, 100);
        if(game.addType === "balloon") {
            fill(255, 100);
        }
        rect(tileSize * 3, 0, tileSize, tileSize);
        fill(0, 100);
        if(game.addType === "sticky") {
            fill(255, 100);
        }
        rect(tileSize * 4, 0, tileSize, tileSize);
        fill(0);
            ellipse(tileSize + tileSize / 2, tileSize / 2, 20, 20);
        if(game.level > 1) {
            fill(255, 0, 0);
            ellipse(tileSize * 2 + tileSize / 2, tileSize / 2, 20, 20);
        }
        if(game.level > 2) {
            fill(0, 100, 255);
            ellipse(tileSize * 3 + tileSize / 2, tileSize / 2, 40, 40);
        }
        if(game.level > 4) {
            fill(255, 100, 100);
            ellipse(tileSize * 4 + tileSize / 2, tileSize / 2, 20, 20);
        }

        fill(255);
        textSize(15);
        textAlign(CENTER, BOTTOM);
        if(game.addType === "normal") {
            fill(0);
        }
        text("Q", tileSize + tileSize / 2, tileSize);
        fill(255);
        if(game.addType === "booster") {
            fill(0);
        }
        text("W", tileSize * 2 + tileSize / 2, tileSize);
        fill(255);
        if(game.addType === "balloon") {
            fill(0);
        }
        text("E", tileSize * 3 + tileSize / 2, tileSize);
        fill(255);
        if(game.addType === "sticky") {
            fill(0);
        }
        text("R", tileSize * 4 + tileSize / 2, tileSize);

        fill(0);
        noStroke();
        textAlign(RIGHT, CENTER);
        textSize(20);
        text(game.units + " unit" + ((game.units > 1) ? "s" : "") + " left", width - tileSize / 2, tileSize / 2);
        textAlign(CENTER, CENTER);
        text(unitsKilled + " unit" + ((unitsKilled > 1 || !unitsKilled) ? "s" : "") + " killed   " + "   World: " + world, width / 2, tileSize / 2);
        if(softBodies.units.length === 0) {
            screenAnimation = 1;
            screenTxt = 100;
            screen = 1;
        }

        if(screenAnimation > 0) {
            screenImage = get(0, 0, width, height);
        }
    }
    if(screenAnimation > 0) {
        image(screenImage, 0, 0, width, height);
        if(screen === 2) {
            if(game.level === 14) {
                if(screenAnimation === 1) {
                    music.stop();
                    sounds.win.play();
                }
                fill(0, 255, 0, constrain(screenAnimation * 3, 0, 100));
                screenAnimation ++;
                noStroke();
                rect(0, 0, width, height);
                fill(255);
                noStroke();
                textAlign(CENTER, CENTER);
                textSize(200);
                text("You win", width / 2, height / 2 - screenTxt * 3);
                fill(0);
                text("You win", width / 2 + 3, height / 2 - screenTxt * 3 + 3);
                textSize(30);
                fill(255);
                text("with " + unitsKilled + " units killed", width / 2, height / 2 + 150 - screenTxt * 3);
                fill(0);
                text("with " + unitsKilled + " units killed", width / 2 + 3, height / 2 + 150 - screenTxt * 3 + 3);
            }
            else {
                if(screenAnimation === 1) { sounds.pass.play(); }
                fill(0, 255, 0, constrain(screenAnimation * 3, 0, 100));
                screenAnimation ++;
                noStroke();
                rect(0, 0, width, height);
                fill(255);
                noStroke();
                textAlign(CENTER, CENTER);
                textSize(30);
                text("Level complete!", width / 2, height / 2 - 100 - screenTxt * 3);
                fill(0);
                text("Level complete!", width / 2 + 3, height / 2 - 100 - screenTxt * 3 + 3);
                fill(255);
                ellipse(width / 2, height / 2 + 100 + screenTxt * 3, 150, 150);
                if(dist(mouseX, mouseY, width / 2, height / 2 + 100 + screenTxt * 3) < 100) {
                    cursor(HAND);
                    textSize(40);
                    ellipse(width / 2, height / 2 + 100 + screenTxt * 3, 160, 160);
                    if(clicked) {
                        screenAnimation = 0;
                        game.level ++;
                        game.loaded = false;
                    }
                }
                fill(0);
                text("Next", width / 2, height / 2 + 100 + screenTxt * 3);
            }
        }
        else {
            fill(255, 0, 0, constrain(screenAnimation * 3, 0, 100));
            screenAnimation ++;
            noStroke();
            rect(0, 0, width, height);
            fill(255);
            noStroke();
            textAlign(CENTER, CENTER);
            textSize(30);
            text("Ouch!", width / 2, height / 2 - 50 - screenTxt * 3);
            if(dist(mouseX, mouseY, width / 2, height / 2 + 50 + screenTxt * 3) < 40) {
                cursor(HAND);
                textSize(40);
                if(clicked) {
                    screenAnimation = 0;
                    game.loaded = false;
                }
            }
            text("Retry?", width / 2, height / 2 + 50 + screenTxt * 3);
        }
        screenTxt *= 0.9;
    }
    shake *= 0.8;

    clicked = false;
    game.loading = false;
};