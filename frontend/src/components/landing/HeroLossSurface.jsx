import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

import { SURFACES } from "../../constants/surfaces";

/* ──────────────────────────────────────────────────────────
   subgrad — Hero loss surface (live, not a mockup)

   This runs the same gradient descent the Surface Lab runs, on the
   same SURFACES definition, auto-looping. It replaced a static shape-
   checker mock that showed the least interesting of the four labs
   while the copy beside it promised motion — the visual contradicted
   the pitch.

   Three.js is already in the landing bundle (no code splitting yet),
   so the download cost was being paid to render nothing. This spends
   it on the actual differentiator.

   Deliberately not interactive: no OrbitControls, no sliders. It's a
   window into the product, and anything clickable here competes with
   the CTA instead of feeding it.
   ────────────────────────────────────────────────────────── */

const SURFACE = SURFACES.bowl;

/* The loop tells the headline's story rather than just idling: descend
   sensibly, then crank the learning rate until the run blows up.

   For z = x² + y² the update is x <- x(1 - 2·lr), so the run is stable
   for 0 < lr < 1 and oscillates outward above it. SAFE_LR spreads the
   descent across the whole phase (the lab's default 0.1 converges by
   about step 16 — verified 6.48 -> 4.1472 -> 0.0051 — which would leave
   the ball sitting motionless for most of the loop). BLOWUP_LR is past
   the stability threshold, so the trail visibly rings outward and
   escapes the bowl. */
const SAFE_LR = 0.055;
const BLOWUP_LR = 1.18;
const STEPS_PER_SEC = 12;
const DESCEND_STEPS = 26;
/* Halt the run while the ball is still framed. Simulated: at hypot 1.96
   it sits at height 1.92, comfortably below the camera; one more step
   throws it to 3.54 and then 6.56, well above the camera and out of
   shot — which would leave the held end-frame showing empty sky. */
const ESCAPE_RADIUS = 1.95;
const HOLD_SECONDS = 1.5;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/* Wireframe mesh of z = f(x, y), displaced per-vertex. */
function SurfaceMesh() {
  const geometry = useMemo(() => {
    const segments = 52;
    const size = SURFACE.domain[1] - SURFACE.domain[0];
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = SURFACE.evaluate(pos.getX(i), pos.getY(i)) * SURFACE.zScale;
      pos.setZ(i, z);
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshBasicMaterial
        color="#2f7d5c"
        wireframe
        transparent
        opacity={0.42}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* Runs the loop: descend -> crank the lr -> diverge -> reset. */
function Descent({ onTelemetry }) {
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [path, setPath] = useState([SURFACE.startPos]);
  const [diverged, setDiverged] = useState(false);
  const acc = useRef(0);
  const holding = useRef(0);
  const group = useRef();

  useFrame((state, delta) => {
    // Slow orbit so the surface reads as 3D even between steps.
    if (group.current && !reduced) {
      group.current.rotation.y += delta * 0.1;
    }

    if (reduced) return;

    if (holding.current > 0) {
      holding.current -= delta;
      if (holding.current <= 0) {
        setPath([SURFACE.startPos]);
        setDiverged(false);
        onTelemetry({
          epoch: 0,
          loss: SURFACE.evaluate(...SURFACE.startPos),
          lr: SAFE_LR,
          diverged: false,
        });
      }
      return;
    }

    acc.current += delta;
    if (acc.current < 1 / STEPS_PER_SEC) return;
    acc.current = 0;

    setPath((prev) => {
      const [x, y] = prev[prev.length - 1];

      // Past the descent phase the rate goes unstable — this is the
      // "break it on purpose" the headline promises.
      const inBlowup = prev.length > DESCEND_STEPS;
      const lr = inBlowup ? BLOWUP_LR : SAFE_LR;

      const [gx, gy] = SURFACE.gradient(x, y);
      const nx = x - lr * gx;
      const ny = y - lr * gy;

      // Same finite guard the lab uses — a NaN must never poison the loop.
      if (!Number.isFinite(nx) || !Number.isFinite(ny)) {
        holding.current = HOLD_SECONDS;
        setDiverged(true);
        return prev;
      }

      // Only meaningful once the rate has gone unstable. The start
      // position (1.8, 1.8) already sits at hypot 2.55, so checking this
      // during the descent would halt the run on its very first step.
      const escaped = inBlowup && Math.hypot(nx, ny) > ESCAPE_RADIUS;
      onTelemetry({
        epoch: prev.length,
        loss: SURFACE.evaluate(nx, ny),
        lr,
        diverged: inBlowup,
      });
      if (inBlowup) setDiverged(true);
      if (escaped) holding.current = HOLD_SECONDS;

      return [...prev, [nx, ny]];
    });
  });

  const points = useMemo(
    () =>
      path.map(
        ([x, y]) =>
          new THREE.Vector3(x, SURFACE.evaluate(x, y) * SURFACE.zScale + 0.02, -y)
      ),
    [path]
  );
  const head = points[points.length - 1];

  return (
    <group ref={group}>
      <SurfaceMesh />
      {points.length > 1 && (
        <Line
          points={points}
          color={diverged ? "#f87171" : "#6ee7a8"}
          lineWidth={2.5}
        />
      )}
      {head && (
        <mesh position={head}>
          <sphereGeometry args={[0.075, 20, 20]} />
          <meshBasicMaterial color={diverged ? "#fecaca" : "#eafff3"} />
        </mesh>
      )}
    </group>
  );
}

export default function HeroLossSurface() {
  const [tel, setTel] = useState({
    epoch: 0,
    loss: SURFACE.evaluate(...SURFACE.startPos),
    lr: SAFE_LR,
    diverged: false,
  });

  return (
    <div className="relative h-[380px] w-full sm:h-[440px] lg:h-[560px]">
      <Canvas
        camera={{ position: [3.6, 3.1, 3.6], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.8} />
        <Descent onTelemetry={setTel} />
      </Canvas>

      {/* Live readout. These numbers are genuinely being computed each
          step, and the lr visibly jumping is what explains the blow-up
          rather than leaving it as a mystery animation. */}
      <div
        className={`pointer-events-none absolute bottom-0 left-0 flex items-center gap-5 border bg-slate-950/80 px-3.5 py-2 font-mono text-[11px] backdrop-blur transition-colors duration-300 ${
          tel.diverged ? "border-red-900/70" : "border-slate-800"
        }`}
      >
        <span className="text-slate-500">
          lr{" "}
          <span className={tel.diverged ? "text-red-400" : "text-slate-200"}>
            {tel.lr}
          </span>
        </span>
        <span className="text-slate-500">
          epoch <span className="text-slate-200">{tel.epoch}</span>
        </span>
        <span className="text-slate-500">
          loss{" "}
          <span className={tel.diverged ? "text-red-400" : "text-emerald-400"}>
            {tel.loss > 9999 ? tel.loss.toExponential(2) : tel.loss.toFixed(4)}
          </span>
        </span>
        {tel.diverged && (
          <span className="uppercase tracking-wider text-red-400">diverged</span>
        )}
      </div>
    </div>
  );
}
