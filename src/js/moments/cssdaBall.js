import Matter from "matter-js";

// CSSDA nominee badge easter egg — Matter.js ball in the main-content cage.
// Entrance: drops 15s after the entry animation finishes, aimed so it bounces
// twice on the bottom corner-cell row (c13–c16) and is captured by the
// bottom-right corner zone, which springs it into its rest pose (center on
// the frame corner, 1/4 visible) with a water-entry arrest.
// Interaction: in free flight the ball is repelled by the pointer; at rest a
// hovering pointer charges it (vibration + spin-up) for 5s, then it ejects
// and ricochets around the cage until the corner zone captures it again.
// Bounces squash the ball along the world impact axis. Clickable: opens the
// CSSDA vote page. Lives in the shell DOM, so it survives SPA transitions.
const BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" aria-hidden="true"><circle cx="45" cy="45" r="45" fill="#231f20"/><path fill="#fff" d="M32.6,43.6c.2,0,.4,0,.6,0,.2,0,.3,0,.5.2l.4-1c-.5-.2-.9-.3-1.4-.3s-.9,0-1.2.3c-.3.2-.6.5-.8.8s-.3.8-.3,1.3c0,.8.2,1.4.6,1.8.4.4.9.6,1.6.6s.9,0,1.3-.3v-1.1c-.2,0-.4.2-.6.2-.2,0-.4,0-.6,0-.7,0-1-.4-1-1.3s.1-.8.3-1c0-.3.3-.4.6-.4Z"/><path fill="#fff" d="M38.2,46.3c-.2,0-.5,0-.7,0-.3,0-.5-.2-.8-.3v1.1c.2,0,.4.2.7.2s.5,0,.8,0,.7,0,1-.2c.3,0,.5-.3.6-.5s.2-.5.2-.8,0-.6-.2-.8c-.2-.2-.4-.4-.8-.6-.4-.2-.7-.3-.8-.4-.2,0-.2,0-.2-.2s0-.2,0-.2c0,0,.2,0,.4,0,.3,0,.7,0,1.1.3l.4-1c-.5-.2-1-.3-1.5-.3s-1,0-1.3.4c-.3.2-.5.6-.5,1s0,.4,0,.6c0,.2.2.3.3.4.2,0,.4.3.7.4.3.2.5.3.6.3s0,0,.2,0c0,0,0,0,0,.2s0,.2,0,.3-.2,0-.4,0Z"/><path fill="#fff" d="M44.1,46.3c-.2,0-.5,0-.7,0-.3,0-.5-.2-.8-.3v1.1c.2,0,.4.2.7.2s.5,0,.8,0,.7,0,1-.2c.3,0,.5-.3.6-.5s.2-.5.2-.8,0-.6-.2-.8c-.2-.2-.4-.4-.8-.6-.4-.2-.7-.3-.8-.4,0,0,0-.2,0-.2,0,0,0-.2,0-.2,0,0,.2,0,.4,0,.3,0,.7,0,1.1.3l.4-1c-.5-.2-1-.3-1.5-.3s-1,0-1.3.4c-.3.2-.5.6-.5,1s0,.4,0,.6c0,.2.2.3.3.4.2,0,.4.3.7.4.3.2.5.3.6.3s0,0,.2,0c0,0,0,0,0,.2s0,.2,0,.3-.3,0-.5,0Z"/><path fill="#fff" d="M52.8,44.8c0-.7-.2-1.3-.6-1.7-.4-.4-1-.6-1.7-.6h-1.6v4.7h1.5c.8,0,1.4-.2,1.8-.6.4-.4.6-1,.6-1.8ZM51.2,45.9c-.2.2-.5.3-.8.3h-.3v-2.6h.4c.3,0,.6,0,.8.3s.3.5.3,1c-.1.4-.2.8-.4,1Z"/><path fill="#fff" d="M58.5,46.4l.2.9h1.4l-1.5-4.7h-1.7l-1.5,4.7h1.4l.2-.9h1.5ZM57.6,43.9c0-.2,0-.4,0-.5,0,0,0,.3,0,.6,0,.3,0,.5.2.7l.2.8h-1c.2-.9.3-1.4.4-1.6Z"/><polygon fill="#fff" points="51.2,39.2 46.4,34.4 41.7,39.2 39,39.2 49,29.2 38.5,29.2 28.4,39.2 24.6,39.2 24.6,39.9 65.8,39.9 65.8,39.2 51.2,39.2"/><polygon fill="#fff" points="24.6,50.6 39.1,50.6 43.8,55.3 48.6,50.6 51.2,50.6 41.2,60.6 51.7,60.6 57,55.4 61.7,50.6 65.8,50.6 65.8,49.9 24.6,49.9 24.6,50.6"/><path fill="#fff" d="M19.4,67.8l2.9-5.3.9,1-2.3,4,4.3-1.7.9,1-5.7,2-1-1.1Z"/><path fill="#fff" d="M24.9,69.7c1-1.4,2.7-1.6,4.1-.6,1.4,1,1.6,2.7.6,4.1s-2.7,1.6-4.1.6c-1.3-1-1.6-2.7-.6-4.1ZM28.6,72.4c.6-.9.6-1.9-.3-2.5-.8-.6-1.8-.4-2.5.5-.6.8-.6,1.9.2,2.5.8.6,1.8.4,2.5-.5Z"/><path fill="#fff" d="M31.3,77.1l1.9-4.2-1.5-.7.4-1,4,1.8-.4,1-1.5-.7-1.9,4.2-1.1-.5Z"/><path fill="#fff" d="M36.4,79l1.2-5.5,3.8.8-.2,1-2.7-.6-.2,1.2,2.6.6-.2,1-2.6-.6-.3,1.3,2.7.6-.2,1-3.8-.8Z"/><path fill="#fff" d="M54,78.8l-.6-2.3-2.5.6.6,2.3-1.1.3-1.3-5.5,1.1-.3.5,2.2,2.5-.6-.5-2.2,1.2-.3,1.3,5.5-1.2.3Z"/><path fill="#fff" d="M58,77.4l-2.5-5.1,3.5-1.8.5.9-2.4,1.2.5,1.1,2.4-1.2.5,1-2.4,1.2.6,1.1,2.4-1.2.5,1-3.5,1.8Z"/><path fill="#fff" d="M66.3,72.2l-2.1-.9-.7.5,1.3,1.6-.9.7-3.6-4.4,2-1.6c.9-.7,1.9-.6,2.6.3.6.8.5,1.6.1,2.1l2.3.9-1.1.8ZM64,69.1c-.3-.4-.8-.4-1.1,0l-1,.8,1,1.2,1-.8c.4-.3.5-.7.2-1.1Z"/><path fill="#fff" d="M69.2,69.4l-4.4-3.6,2.5-3,.8.7-1.7,2.1.9.8,1.7-2.1.8.7-1.7,2.1,1,.8,1.7-2.1.8.7-2.5,3Z"/><path fill="#fff" d="M17.9,35.4h-1c0,0-.6,2.3-.6,2.3l.8.6-.3,1.3-4.9-3.5.4-1.4,6-.5-.3,1.3ZM13.2,35.7l2.1,1.5.4-1.6-2.6.2Z"/><path fill="#fff" d="M20.5,29.6l-3.9-1,3,2.7-.6,1.1-5.7-1.3.6-1.1,4.1,1.1-3.1-2.9.4-.8,4.1,1-3.2-2.8.6-1.1,4.2,4.1-.6,1.1Z"/><path fill="#fff" d="M25,23.6l-.9-.4-1.6,1.7.5.9-.9,1-2.8-5.4,1-1.1,5.6,2.2-.9,1ZM20.7,21.8l1.3,2.3,1.1-1.3-2.4-1Z"/><path fill="#fff" d="M29.5,20l-2-1-.7.5,1.2,1.6-.9.7-3.3-4.6,2.1-1.5c.9-.7,1.9-.5,2.6.4.6.8.4,1.6,0,2.1l2.3,1-1.1.8ZM27.3,16.8c-.3-.4-.7-.4-1.1-.1l-1,.7.9,1.2,1-.7c.4-.3.5-.7.2-1.1Z"/><path fill="#fff" d="M31.9,18.4l-2.2-5.2,2-.8c1.6-.7,3.1,0,3.8,1.5.7,1.6,0,3.1-1.6,3.7l-2,.8ZM34.4,14.3c-.4-.9-1.2-1.4-2.3-1l-.9.4,1.4,3.3.9-.4c1-.4,1.3-1.4.9-2.3Z"/><path fill="#fff" d="M47.9,15.4l-2.4-3.8-.2,3.7h-1.2c0,0,.3-5.7.3-5.7h1.2c0,0,2.3,3.8,2.3,3.8l.2-3.6h1.2c0,0-.3,5.7-.3,5.7h-1.1Z"/><path fill="#fff" d="M51.5,13c.5-1.6,2-2.4,3.6-1.9,1.6.5,2.4,2,1.8,3.7-.5,1.6-2,2.4-3.6,1.9-1.6-.5-2.3-2-1.8-3.7ZM55.8,14.3c.3-1,0-2-1-2.3s-1.8.3-2.1,1.3c-.3,1,0,2,1,2.3,1,.3,1.8-.3,2.1-1.3Z"/><path fill="#fff" d="M61.5,20.6l2.1-3.3-3.4,2.5-.4-.3.8-4.2-2.1,3.3-1-.6,3.1-4.8,1.4.9-.7,3.6,3-2.2,1.4.9-3.1,4.8-1-.6Z"/><path fill="#fff" d="M63.8,22.6l3.9-4.1.8.8-3.9,4.1-.8-.8Z"/><path fill="#fff" d="M68.3,27.8l1.4-4.3-3,2.2-.7-.9,4.5-3.4.7,1-1.3,4.2,2.8-2.1.7.9-4.5,3.4-.7-.9Z"/><path fill="#fff" d="M70,30.3l5.1-2.4,1.6,3.5-1,.5-1.1-2.4-1.1.5,1.1,2.4-1,.4-1.1-2.4-1.2.5,1.1,2.4-1,.5-1.6-3.5Z"/><path fill="#fff" d="M72.2,35.5l5.5-1.4,1,3.7-1,.3-.7-2.6-1.2.3.7,2.6-1,.3-.7-2.6-1.2.3.7,2.6-1,.3-1-3.7Z"/></svg>`;

const R = 44;                 // ball radius, px (badge rendered at 88x88)
const G_PX = 2600;            // gravity, px/s^2 (Matter: gravity.y=1 ≈ 1000)
const REST = 0.62;            // restitution, all bodies
const AIR = 0;                // frictionAir: any nonzero is per-step multiplicative
                              // drag that destroys the ballistic corner aim
const SPIN_RATE = 14;         // perpetual rotation, deg/s (clockwise on screen =
                              // "antitrigonometric" per FR/RU convention)
const SPIN_DAMP = 0.8;        // spin relaxation rate, 1/s (tau = 1.25s)
const CAPTURE_R = 95;         // corner capture-zone radius, px
const CAPTURE_VMAX = 650;     // px/s: faster balls fly through the zone
const CAPTURE_DEEP = 42;      // px: deep in the wedge, always captured
const DROP_DELAY_MS = 15000;  // after the entry animation finishes, drop
const CHARGE_R = 150;         // settled-state pointer proximity, px
const CHARGE_TIME = 5;        // s of hover to trigger ejection
const REPEL_R = 190;          // free-state pointer repulsion radius, px
const REPEL_A = 2800;         // free-state repulsion accel, px/s^2
const SINK_K = 170;           // corner-medium spring stiffness (water entry)
const SINK_C = 24;            // corner-medium damping (~critically damped)
const SQUASH_K = 380;         // squash spring stiffness
const SQUASH_C = 34;          // squash damping (~critically damped, no wobble)
const STEP_MS = 1000 / 60;    // Matter fixed step: variable dt kills restitution

export function initCssdaBall() {
    const c13 = document.querySelector('.c13');
    const c16 = document.querySelector('.c16');
    if (!c13 || !c16 || window.innerWidth < 600) return;
    if (document.querySelector('#cssda-ball')) return;

    let floorY = c13.getBoundingClientRect().top;
    let left = c13.getBoundingClientRect().left;
    let right = c16.getBoundingClientRect().right;

    const ball = document.createElement('div');
    ball.id = 'cssda-ball';
    ball.style.cssText =
        `position:fixed;left:0;top:0;width:${R * 2}px;height:${R * 2}px;` +
        `z-index:9000;will-change:transform;` +
        `opacity:0;transition:opacity .3s;`;
    ball.innerHTML =
        `<a href="https://www.cssdesignawards.com/sites/adrian-vlasov-portfolio/50043/"` +
        ` target="_blank" rel="noopener" aria-label="Vote for this site on CSS Design Awards"` +
        ` data-pointer style="display:block;width:100%;height:100%;border-radius:50%">` +
        BADGE_SVG + `</a>`;
    document.body.appendChild(ball);

    const engine = Matter.Engine.create({ gravity: { x: 0, y: G_PX / 1000 } });
    const world = engine.world;
    const mkWall = (x, y, w, h) =>
        Matter.Bodies.rectangle(x, y, w, h, { isStatic: true, restitution: REST, friction: 0.1 });
    const wallFloor = mkWall((left + right) / 2, floorY + 60, right - left + 400, 120);
    const wallL = mkWall(left - 60, floorY / 2 - 300, 120, floorY + 1400);
    const wallR = mkWall(right + 60, floorY / 2 - 300, 120, floorY + 1400);
    const wallT = mkWall((left + right) / 2, -700, right - left + 400, 120);
    Matter.Composite.add(world, [wallFloor, wallL, wallR, wallT]);

    const body = Matter.Bodies.circle(0, -120, R, {
        restitution: REST, frictionAir: AIR, friction: 0, frictionStatic: 0,
    });

    let x = 0, y = 0, vx = 0, vy = 0;       // px, px/s (mirror of body in free mode)
    let angle = -25, spinVel = 0;
    let mode = 'waiting';
    let ejectT = 0;
    let entranceDone = false;
    let charge = 0;
    let sq = 0, sqv = 0;
    let squashImpulse = 0, sqAxis = 0;
    const pointer = { x: 0, y: 0, has: false };
    let acc = 0;
    let last = performance.now();

    Matter.Events.on(engine, 'collisionStart', (e) => {
        for (const pair of e.pairs) {
            const other = pair.bodyA === body ? pair.bodyB : pair.bodyA;
            if (other !== wallFloor && other !== wallL && other !== wallR) continue;
            const n = pair.collision.normal;
            const v = Matter.Body.getVelocity(body); // px/step at 60fps
            const impact = Math.abs(v.x * n.x + v.y * n.y) * 60; // px/s along normal
            if (impact > 250) {
                squashImpulse = Math.max(squashImpulse, Math.min(0.25, impact / 4200));
                sqAxis = Math.atan2(n.y, n.x) * 180 / Math.PI;
            }
        }
    });

    const render = () => {
        // squash along the impact normal's world axis, independent of ball spin:
        // translate . rotate(sqAxis) . scale . rotate(angle - sqAxis)
        const s = Math.max(-0.25, Math.min(0.25, sq));
        const jx = charge > 0 ? (Math.random() - 0.5) * charge * 2.2 : 0;
        const jy = charge > 0 ? (Math.random() - 0.5) * charge * 2.2 : 0;
        ball.style.transform =
            `translate3d(${x - R + jx}px,${y - R + jy}px,0) ` +
            `rotate(${sqAxis}deg) scale(${1 - s},${1 + s * 0.7}) rotate(${angle - sqAxis}deg)`;
    };

    const capture = () => {
        const d = Math.hypot(right - x, floorY - y);
        // entrance: grab unconditionally — the arrival speed exceeds VMAX and
        // would otherwise carry the ball into the right wall
        if (!entranceDone) return d <= 110;
        // post-eject immunity must precede the deep grab: the ball launches
        // from inside the deep zone, which would swallow it after one step
        if ((performance.now() - ejectT) / 1000 < 1.2) return false;
        if (d < CAPTURE_DEEP) return true;
        if (d > CAPTURE_R) return false;
        // a fast ball crossing the zone must bounce on, not get swallowed
        return Math.hypot(vx, vy) <= CAPTURE_VMAX;
    };

    const frame = (now) => {
        const dt = Math.min((now - last) / 1000, 0.033);
        last = now;

        if (mode === 'free') {
            if (!entranceDone && vx < 460) {
                // entrance drift: guarantees cornerward progress; bounces stay natural
                Matter.Body.setVelocity(body, { x: (vx + 500 * dt) / 60, y: body.velocity.y });
            }
            if (pointer.has) {
                const dx = x - pointer.x, dy = y - pointer.y;
                const d = Math.hypot(dx, dy);
                if (d < REPEL_R && d > 0.001) {
                    const a = REPEL_A * (1 - d / REPEL_R);
                    Matter.Body.setVelocity(body, {
                        x: body.velocity.x + (dx / d) * a * dt / 60,
                        y: body.velocity.y + (dy / d) * a * dt / 60,
                    });
                }
            }
            let steps = 0;
            acc += dt * 1000;
            while (acc >= STEP_MS && steps < 3) {
                Matter.Engine.update(engine, STEP_MS);
                acc -= STEP_MS;
                steps++;
            }
            if (steps === 3) acc = 0; // fell behind: drop time, don't spiral
            x = body.position.x; y = body.position.y;
            vx = body.velocity.x * 60; vy = body.velocity.y * 60;
            angle += (vx / R) * (180 / Math.PI) * dt;

            if (capture()) {
                Matter.Composite.remove(world, body);
                entranceDone = true;
                spinVel = (vx / R) * (180 / Math.PI);
                mode = 'sink';
            }
        } else if (mode === 'sink') {
            // water entry: momentum preserved, damped spring toward the corner point
            vx += ((right - x) * SINK_K - vx * SINK_C) * dt;
            vy += ((floorY - y) * SINK_K - vy * SINK_C) * dt;
            x += vx * dt;
            y += vy * dt;
            if (Math.hypot(right - x, floorY - y) < 1 && Math.abs(vx) + Math.abs(vy) < 6) {
                x = right; y = floorY;
                vx = vy = 0;
                mode = 'spin';
            }
        } else if (mode === 'spin') {
            x = right; y = floorY;
            const d = pointer.has ? Math.hypot(x - pointer.x, y - pointer.y) : Infinity;
            if (d < CHARGE_R) charge = Math.min(CHARGE_TIME, charge + dt);
            else charge = Math.max(0, charge - dt * 1.5);
            spinVel += ((SPIN_RATE + charge * 130) - spinVel) * Math.min(1, 8 * dt);
            if (charge >= CHARGE_TIME) {
                charge = 0;
                ejectT = performance.now();
                let dx = x - pointer.x, dy = y - pointer.y;
                const d2 = Math.hypot(dx, dy) || 1;
                dx /= d2; dy /= d2;
                // always launch into the cage: a wallward component would
                // ricochet off 42px away and instantly re-capture
                dx = -Math.abs(dx);
                if (dy > -0.35) dy = -0.35;
                const n2 = Math.hypot(dx, dy);
                dx /= n2; dy /= n2;
                // spawn clear of the walls: the rest pose overlaps them by ~R,
                // and Matter's overlap resolution would fight the launch
                Matter.Body.setPosition(body, { x: right - R - 2, y: floorY - R - 2 });
                Matter.Body.setVelocity(body, { x: dx * 26, y: dy * 26 }); // ~1560 px/s
                Matter.Composite.add(world, body);
                mode = 'free';
            }
        }

        if (mode === 'sink' || mode === 'spin') {
            // one continuous relaxation toward perpetual spin (charge overrides in spin)
            if (mode === 'sink')
                spinVel = SPIN_RATE + (spinVel - SPIN_RATE) * Math.exp(-SPIN_DAMP * dt);
            angle += spinVel * dt;
        }

        if (squashImpulse > 0) {
            // v0 = depth * omega: the kick peak equals the intended squash depth
            sqv += squashImpulse * Math.sqrt(SQUASH_K);
            squashImpulse = 0;
        }
        sqv += (-SQUASH_K * sq - SQUASH_C * sqv) * dt;
        sq += sqv * dt;

        render();
        requestAnimationFrame(frame);
    };

    const start = () => {
        // Ballistic aim: floor-contact gaps shrink geometrically (gap2 = e*gap1),
        // so contact #3 is targeted at right-R; the capture zone grabs the
        // descent into it and the corner springs it to rest.
        const dropY = -120;
        const h = floorY - R - dropY;
        const tDrop = Math.sqrt(2 * h / G_PX);
        const t1 = 2 * REST * Math.sqrt(2 * G_PX * h) / G_PX;
        const x1 = left + (right - left) * 0.35;
        vx = (right - R - x1) / (t1 * (1 + REST));
        x = x1 - vx * tDrop;
        y = dropY;
        vy = 0;
        Matter.Composite.add(world, body);
        Matter.Body.setPosition(body, { x, y });
        Matter.Body.setVelocity(body, { x: vx / 60, y: 0 });
        ball.style.opacity = '1';
        mode = 'free';
        acc = 0;
        last = performance.now();
        requestAnimationFrame(frame);
    };

    window.addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.has = true; }, { passive: true });

    window.addEventListener('resize', () => {
        const r13 = c13.getBoundingClientRect();
        const r16 = c16.getBoundingClientRect();
        floorY = r13.top; left = r13.left; right = r16.right;
        Matter.Body.setPosition(wallFloor, { x: (left + right) / 2, y: floorY + 60 });
        Matter.Body.setPosition(wallL, { x: left - 60, y: floorY / 2 - 300 });
        Matter.Body.setPosition(wallR, { x: right + 60, y: floorY / 2 - 300 });
        if (mode === 'spin' || mode === 'sink') { x = right; y = floorY; }
    });

    setTimeout(start, DROP_DELAY_MS);
}
