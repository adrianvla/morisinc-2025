import Matter from "matter-js";
import {getProjectName} from "../modules/pathDetector";
import {prefersReducedMotion} from "../utils/prefersReducedMotion";

// CSSDA winner badges — three Matter.js balls launched chaotically onto the
// About page and the morisinc.net project page. They drop in with random
// spawn points, random fling velocities and random spin, fall onto the
// c13–c16 corner-grid strip — resting on the strip cell plus the grid's
// row gap, so no black seam cuts between ball and line — bounce off the
// walls and off each other, and settle there.
// Moving balls flee the pointer; resting balls can be woken with a fast
// pointer flick ("pyon-pyon"). Slow balls ease upright so the badge faces
// read correctly at rest. Each ball links to the CSSDA awards page.
// On page leave the balls are NOT removed instantly: dropAwardBalls() opens
// the floor and lets them fall out of view, then tears the scene down.
// Spawned/destroyed by syncAwardBalls() on page enter/leave (Barba SPA hops
// between project pages included); full navigations reload and re-sync.

const SITE_URL = "https://www.cssdesignawards.com/sites/adrian-vlasov-portfolio/50043/";
const AWARDS = [
    {src: "/assets/img/awards/cssda-best-ui-purple.svg", label: "CSS Design Awards — Best UI Design Award"},
    {src: "/assets/img/awards/cssda-best-inn-green.svg", label: "CSS Design Awards — Best Innovation Award"},
    {src: "/assets/img/awards/cssda-special-kudos-yellow.svg", label: "CSS Design Awards — Special Kudos"},
];

const R = 44;                 // ball radius, px (badges render at 88x88)
const G_PX = 2600;            // gravity, px/s^2 (Matter: gravity.y=1 ≈ 1000)
const REST = 0.62;            // restitution, all bodies
const AIR = 0;                // frictionAir: any nonzero is per-step multiplicative
                              // drag that kills the drop feel
const REPEL_R = 190;          // moving-ball pointer repulsion radius, px
const REPEL_A = 2800;         // moving-ball repulsion accel, px/s^2
const FLICK_SPEED = 700;      // pointer speed (px/s) that wakes a resting ball
const FLICK_GAIN = 0.35;      // fraction of pointer speed imparted by a flick
const FLICK_MAX = 1400;       // cap on flick impulse speed, px/s
const SETTLE_V = 9;           // px/s below which a ball counts as resting
const UPRISE_K = 4;           // 1/s ease rate toward upright when resting
const FLING_VX = 350;         // chaotic launch: mean horizontal fling, px/s
const FLING_VY = 200;         // chaotic launch: max vertical pop, px/s
const RESYNC_FRAMES = 10;     // re-measure the strip every N rendered frames
const STEP_MS = 1000 / 60;    // Matter fixed step: variable dt kills restitution

let inst = null;

// Route gate: project names are normalized like fetchProjects does
// ("morisinc.net" -> "morisinc_net"), so match the normalized key.
export function syncAwardBalls() {
    if (window.innerWidth < 600) { destroy(); return; }
    const onAbout = /^\/about\/?$/.test(window.location.pathname);
    const onMorisinc = getProjectName() === "morisinc_net";
    if (onAbout || onMorisinc) {
        if (!inst) inst = spawn();
    } else {
        dropAwardBalls();
    }
}

// Page left: open the floor and let the balls fall out of view before the
// scene is torn down. Safe to call repeatedly / with no instance alive.
export function dropAwardBalls() {
    if (!inst) return;
    const dying = inst;
    inst = null;
    dying.dropOut();
}

function destroy() {
    if (!inst) return;
    inst.destroy();
    inst = null;
}

function measureCage() {
    // balls rest on the c13–c16 corner-grid strip — the site's bottom
    // frame line. No vertical clamp: the strip row (10px at the bottom of
    // a fixed 100vh grid) is always inside the viewport, and clamping the
    // floor to innerHeight - R floated the balls 32px above the strip.
    // Side walls clamp horizontally: narrow desktop widths can overflow
    // the fixed grid.
    const c13 = document.querySelector(".c13");
    const c16 = document.querySelector(".c16");
    const r13 = c13 ? c13.getBoundingClientRect() : null;
    const r16 = c16 ? c16.getBoundingClientRect() : null;
    // the ledge is the strip cell PLUS the grid's row gap above it (the 2px
    // black seam would otherwise cut the ball off the grey line) — read the
    // gap live from the grid instead of hardcoding it
    const grid = document.querySelector(".container");
    const rowGap = grid ? parseFloat(getComputedStyle(grid).rowGap) || 0 : 0;
    return {
        floor: r13 ? r13.top - rowGap : window.innerHeight,
        left: r13 ? r13.left : 0,
        right: Math.min(r16 ? r16.right : window.innerWidth, window.innerWidth),
    };
}

function spawn() {
    const cage = measureCage();
    const reduced = prefersReducedMotion();

    const root = document.createElement("div");
    root.id = "award-balls";
    root.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;z-index:9000;pointer-events:none;";
    document.body.appendChild(root);

    const engine = Matter.Engine.create({gravity: {x: 0, y: G_PX / 1000}});
    const world = engine.world;
    const mkWall = (x, y, w, h) =>
        Matter.Bodies.rectangle(x, y, w, h, {isStatic: true, restitution: REST, friction: 0.1});
    const wallFloor = mkWall((cage.left + cage.right) / 2, cage.floor + 60, cage.right - cage.left + 400, 120);
    const wallL = mkWall(cage.left - 60, cage.floor / 2 - 300, 120, cage.floor + 1400);
    const wallR = mkWall(cage.right + 60, cage.floor / 2 - 300, 120, cage.floor + 1400);
    const wallT = mkWall((cage.left + cage.right) / 2, -700, cage.right - cage.left + 400, 120);
    Matter.Composite.add(world, [wallFloor, wallL, wallR, wallT]);

    const balls = [];
    const byBody = new Map();
    const timeouts = [];

    AWARDS.forEach((def) => {
        const a = document.createElement("a");
        a.href = SITE_URL;
        a.target = "_blank";
        a.rel = "noopener";
        a.setAttribute("aria-label", def.label);
        a.setAttribute("data-pointer", "");
        a.style.cssText =
            `position:fixed;left:0;top:0;width:${R * 2}px;height:${R * 2}px;` +
            `pointer-events:auto;will-change:transform;opacity:0;transition:opacity .3s;`;
        a.innerHTML =
            `<img src="${def.src}" alt="" draggable="false" ` +
            `style="display:block;width:100%;height:100%;border-radius:50%;-webkit-user-drag:none;user-select:none;">`;
        root.appendChild(a);

        const ball = {
            def, a,
            body: null,
            x: 0, y: 0, vx: 0, vy: 0,
            angle: Math.random() * 360,
            sq: 0, sqv: 0, squashImpulse: 0, sqAxis: 0,
            launchVx: 0, launchVy: 0,
            started: false,
        };
        balls.push(ball);

        if (reduced) {
            // static fallback: upright row along the strip, right-aligned
            ball.x = cage.right - R - 6 - balls.indexOf(ball) * (R * 2 + 16);
            ball.y = cage.floor - R;
            ball.angle = 0;
            ball.started = true;
            a.style.opacity = "1";
        } else {
            // chaotic launch: random spawn point above the viewport
            const span = Math.max(R, (cage.right - cage.left) - R * 3);
            const x0 = cage.left + R * 1.5 + Math.random() * span;
            const y0 = -140 - Math.random() * 260;
            ball.x = x0; ball.y = y0;
            ball.launchVx = (Math.random() * 2 - 1) * (FLING_VX + Math.random() * 150) / 60;
            ball.launchVy = (Math.random() * 2 - 1) * FLING_VY / 60;
            // the body joins the world only when its drop timer fires —
            // otherwise hidden balls fall while still invisible
            ball.body = Matter.Bodies.circle(x0, y0, R, {
                restitution: REST, frictionAir: AIR, friction: 0, frictionStatic: 0,
            });
            byBody.set(ball.body.id, ball);
            timeouts.push(setTimeout(() => {
                ball.started = true;
                Matter.Composite.add(world, ball.body);
                Matter.Body.setVelocity(ball.body, {x: ball.launchVx, y: ball.launchVy});
                a.style.opacity = "1";
            }, 200 + Math.random() * 700));
        }
    });

    let raf = 0;
    let acc = 0;
    let last = performance.now();
    let resyncTick = 0;
    const pointer = {x: 0, y: 0, has: false, speed: 0, lastT: 0};

    if (!reduced) {
        Matter.Events.on(engine, "collisionStart", (e) => {
            for (const pair of e.pairs) {
                for (const mine of [pair.bodyA, pair.bodyB]) {
                    const ball = byBody.get(mine.id);
                    if (!ball) continue;
                    const n = pair.collision.normal;
                    const v = Matter.Body.getVelocity(ball.body); // px/step at 60fps
                    const impact = Math.abs(v.x * n.x + v.y * n.y) * 60; // px/s along normal
                    if (impact > 250) {
                        ball.squashImpulse = Math.max(ball.squashImpulse, Math.min(0.25, impact / 4200));
                        ball.sqAxis = Math.atan2(n.y, n.x) * 180 / Math.PI;
                    }
                }
            }
        });
    }

    const renderBall = (ball) => {
        // squash along the impact normal's world axis, independent of spin:
        // translate . rotate(sqAxis) . scale . rotate(angle - sqAxis)
        const s = Math.max(-0.25, Math.min(0.25, ball.sq));
        ball.a.style.transform =
            `translate3d(${ball.x - R}px,${ball.y - R}px,0) ` +
            `rotate(${ball.sqAxis}deg) scale(${1 - s},${1 + s * 0.7}) rotate(${ball.angle - ball.sqAxis}deg)`;
    };

    const frame = (now) => {
        const dt = Math.min((now - last) / 1000, 0.033);
        last = now;

        acc += dt * 1000;
        let steps = 0;
        while (acc >= STEP_MS && steps < 3) {
            Matter.Engine.update(engine, STEP_MS);
            acc -= STEP_MS;
            steps++;
        }
        if (steps === 3) acc = 0; // fell behind: drop time, don't spiral

        // the site re-layouts after load (font swap, autofit, s1 height) and
        // the strip moves — walls must follow or balls rest on stale air
        if (++resyncTick >= RESYNC_FRAMES) {
            resyncTick = 0;
            syncWalls();
        }

        for (const ball of balls) {
            if (!ball.started || !ball.body) continue;
            ball.x = ball.body.position.x;
            ball.y = ball.body.position.y;
            ball.vx = ball.body.velocity.x * 60;
            ball.vy = ball.body.velocity.y * 60;
            const speed = Math.hypot(ball.vx, ball.vy);

            if (speed > SETTLE_V) {
                if (pointer.has) {
                    const dx = ball.x - pointer.x, dy = ball.y - pointer.y;
                    const d = Math.hypot(dx, dy);
                    if (d < REPEL_R && d > 0.001) {
                        const aRe = REPEL_A * (1 - d / REPEL_R);
                        Matter.Body.setVelocity(ball.body, {
                            x: ball.body.velocity.x + (dx / d) * aRe * dt / 60,
                            y: ball.body.velocity.y + (dy / d) * aRe * dt / 60,
                        });
                    }
                }
                // spin follows horizontal travel
                ball.angle += (ball.vx / R) * (180 / Math.PI) * dt;
            } else {
                // resting: ease the badge face upright so it reads correctly
                const target = Math.round(ball.angle / 360) * 360;
                ball.angle += (target - ball.angle) * Math.min(1, UPRISE_K * dt);
            }

            if (ball.squashImpulse > 0) {
                // v0 = depth * omega: the kick peak equals the intended squash depth
                ball.sqv += ball.squashImpulse * Math.sqrt(380);
                ball.squashImpulse = 0;
            }
            ball.sqv += (-380 * ball.sq - 34 * ball.sqv) * dt;
            ball.sq += ball.sqv * dt;

            renderBall(ball);
        }
        raf = requestAnimationFrame(frame);
    };

    const onPointerMove = (e) => {
        const t = performance.now();
        if (pointer.has) {
            const dtm = Math.max(1, t - pointer.lastT);
            pointer.speed = Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) / dtm * 1000;
        }
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.lastT = t;
        pointer.has = true;

        if (reduced) return;
        // fast flick near a resting ball wakes it ("pyon-pyon")
        if (pointer.speed > FLICK_SPEED) {
            for (const ball of balls) {
                if (!ball.started || !ball.body) continue;
                const speed = Math.hypot(ball.body.velocity.x, ball.body.velocity.y) * 60;
                if (speed > SETTLE_V) continue;
                const dx = ball.x - pointer.x, dy = ball.y - pointer.y;
                const d = Math.hypot(dx, dy);
                if (d > REPEL_R || d < 0.001) continue;
                const kick = Math.min(FLICK_MAX, pointer.speed * FLICK_GAIN) / 60;
                Matter.Body.setVelocity(ball.body, {
                    x: ball.body.velocity.x + (dx / d) * kick * 0.6,
                    y: ball.body.velocity.y + (dy / d) * kick - kick * 0.4, // flicks tend upward
                });
            }
        }
    };

    // re-measure the strip and reposition the walls; resting balls ride along
    const syncWalls = () => {
        Object.assign(cage, measureCage());
        Matter.Body.setPosition(wallFloor, {x: (cage.left + cage.right) / 2, y: cage.floor + 60});
        Matter.Body.setPosition(wallL, {x: cage.left - 60, y: cage.floor / 2 - 300});
        Matter.Body.setPosition(wallR, {x: cage.right + 60, y: cage.floor / 2 - 300});
        balls.forEach((ball, i) => {
            if (!ball.started) return;
            if (reduced) {
                ball.x = cage.right - R - 6 - i * (R * 2 + 16);
                ball.y = cage.floor - R;
            } else if (ball.body) {
                const speed = Math.hypot(ball.body.velocity.x, ball.body.velocity.y) * 60;
                if (speed <= SETTLE_V) {
                    const nx = Math.min(cage.right - R - 2, Math.max(cage.left + R + 2, ball.x));
                    const ny = Math.min(cage.floor - R, Math.max(R + 2, ball.y));
                    Matter.Body.setPosition(ball.body, {x: nx, y: ny});
                }
            }
        });
        balls.forEach(renderBall);
    };

    window.addEventListener("pointermove", onPointerMove, {passive: true});
    window.addEventListener("resize", syncWalls);

    if (reduced) {
        balls.forEach(renderBall);
    } else {
        raf = requestAnimationFrame(frame);
    }

    return {
        destroy() {
            timeouts.forEach(clearTimeout);
            cancelAnimationFrame(raf);
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("resize", syncWalls);
            Matter.Events.off(engine);
            Matter.Composite.clear(world, false);
            Matter.Engine.clear(engine);
            root.remove();
        },
        dropOut() {
            // floor opens, balls tumble out of the viewport, then teardown
            timeouts.forEach(clearTimeout);
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("resize", syncWalls);
            if (reduced) {
                balls.forEach((b) => { b.a.style.opacity = "0"; });
                setTimeout(() => root.remove(), 350);
                return;
            }
            Matter.Composite.remove(world, wallFloor);
            const gone = () => {
                if (balls.every((b) => !b.started || !b.body || b.body.position.y > cage.floor + R * 2 + 140)) {
                    cancelAnimationFrame(raf);
                    Matter.Events.off(engine);
                    Matter.Composite.clear(world, false);
                    Matter.Engine.clear(engine);
                    root.remove();
                    return;
                }
                setTimeout(gone, 100);
            };
            gone();
        }
    };
}
