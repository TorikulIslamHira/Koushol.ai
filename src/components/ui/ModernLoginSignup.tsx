import { useEffect, useRef, useState, type FormEvent } from 'react'
import * as THREE from 'three'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface ModernLoginSignupProps {
  mode: 'login' | 'signup'
}

const inputClasses =
  'w-full rounded-lg border border-brand-green-light/20 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-colors duration-150 focus:border-brand-green-light'

/**
 * WebGL animated-dot-grid card handling real email/password sign-in and sign-up (via
 * `useAuth`), themed to Koushol's brand palette (see `src/styles/globals.css`'s
 * `@theme` block). Dot colors and the dark card use `brand-green`/`brand-gold`; there's no
 * OAuth in this app (email/password only, see `useAuth`), so the reference design's
 * Google/GitHub/Apple buttons were dropped rather than left as non-functional decoration.
 */
export function ModernLoginSignup({ mode }: ModernLoginSignupProps) {
  const isLogin = mode === 'login'
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return
    const canvas = canvasRef.current
    const container = containerRef.current

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    // Brand palette, 0-1 normalized: brand-green, brand-green-light, brand-gold, brand-gold-light
    const uniforms = {
      u_time: { value: 0 },
      u_resolution: {
        value: new THREE.Vector2(container.clientWidth * 2, container.clientHeight * 2),
      },
      u_opacities: { value: [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1.0] },
      u_colors: {
        value: [
          new THREE.Vector3(0.047, 0.541, 0.294), // brand-green
          new THREE.Vector3(0.071, 0.659, 0.361), // brand-green-light
          new THREE.Vector3(0.831, 0.627, 0.09), // brand-gold
          new THREE.Vector3(0.902, 0.725, 0.227), // brand-gold-light
          new THREE.Vector3(0.047, 0.541, 0.294),
          new THREE.Vector3(0.831, 0.627, 0.09),
        ],
      },
      u_total_size: { value: 20.0 },
      u_dot_size: { value: 6.0 },
    }

    const material = new THREE.ShaderMaterial({
      vertexShader: `
        precision mediump float;
        uniform vec2 u_resolution;
        out vec2 fragCoord;
        void main() {
          gl_Position = vec4(position, 1.0);
          fragCoord = (position.xy + 1.0) * 0.5 * u_resolution;
          fragCoord.y = u_resolution.y - fragCoord.y;
        }
      `,
      fragmentShader: `
        precision mediump float;
        in vec2 fragCoord;

        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;

        out vec4 fragColor;

        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }

        void main() {
            vec2 st = fragCoord.xy;
            st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
            st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

            float opacity = step(0.0, st.x) * step(0.0, st.y);

            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

            float frequency = 5.0;
            float show_offset = random(st2);
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
            opacity *= u_opacities[int(rand * 10.0)];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

            vec3 color = u_colors[int(show_offset * 6.0)];

            float animation_speed_factor = 3.0;
            vec2 center_grid = u_resolution / 2.0 / u_total_size;
            float dist_from_center = distance(center_grid, st2);

            float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);

            float current_timing_offset = timing_offset_intro;
            opacity *= step(current_timing_offset, u_time * animation_speed_factor);
            opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);

            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a;
        }
      `,
      uniforms,
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
      transparent: true,
    })

    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const startTime = performance.now()
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      uniforms.u_time.value = (performance.now() - startTime) / 1000.0
      renderer.render(scene, camera)
    }
    animate()

    // Sized to the card's own container, not the viewport — this component sits inside
    // Koushol's normal page chrome (header/footer via Layout), not a full-bleed page.
    const resizeObserver = new ResizeObserver(() => {
      renderer.setSize(container.clientWidth, container.clientHeight)
      uniforms.u_resolution.value.set(container.clientWidth * 2, container.clientHeight * 2)
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(animationId)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = isLogin ? await signIn(email, password) : await signUp(email, password, name)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/courses')
  }

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[640px] w-full items-center justify-center overflow-hidden rounded-2xl bg-brand-ink"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(11,18,16,0.75) 0%, rgba(11,18,16,0) 100%)',
        }}
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-xl border border-white/10 bg-black/40 p-8 text-center backdrop-blur-sm">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-brand-green-light/30 bg-brand-green font-display text-lg font-bold text-white">
          K
        </div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-white">
          {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
        </h1>
        <p className="mb-5 mt-1 text-sm text-white/60">
          {isLogin ? t('auth.signInSubtitle') : t('auth.createAccountSubtitle')}
        </p>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 text-left">
          {!isLogin && (
            <input
              className={inputClasses}
              type="text"
              required
              placeholder={t('auth.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            className={inputClasses}
            type="email"
            required
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={inputClasses}
            type="password"
            required
            minLength={isLogin ? undefined : 6}
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full rounded-lg bg-brand-green px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? isLogin
                ? t('auth.signingIn')
                : t('auth.creatingAccount')
              : isLogin
                ? t('nav.signIn')
                : t('auth.createAccount')}
          </button>
        </form>

        <div className="mt-5 text-sm text-white/60">
          {isLogin ? t('auth.noAccount') : t('auth.alreadyHaveAccount')}{' '}
          <Link to={isLogin ? '/signup' : '/login'} className="font-medium text-white hover:underline">
            {isLogin ? t('nav.signUp') : t('nav.signIn')}
          </Link>
        </div>

        <div className="mt-4 text-xs leading-relaxed text-white/40">
          <Link to="/terms" className="hover:text-white/70">
            {t('footer.terms')}
          </Link>{' '}
          &middot;{' '}
          <Link to="/privacy" className="hover:text-white/70">
            {t('footer.privacy')}
          </Link>
        </div>
      </div>
    </div>
  )
}
