import { useEffect, useRef, useState, type FormEvent } from 'react'
import * as THREE from 'three'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ModernLoginSignupProps {
  mode: 'login' | 'signup'
}

/**
 * Login/signup card matching Koushol's actual light `Card` styling (white, slate-200
 * border — see `src/components/ui/Card.tsx`), with a WebGL animated-dot-grid (`three`)
 * confined to a short banner strip that fades to white at its base, rather than a full
 * dark card — this app's site chrome is light, so a full black card read as a foreign
 * floating box (see the folder README's git history for the earlier dark version this
 * replaced). Dots are tinted brand-green/brand-gold (`src/styles/globals.css`'s `@theme`).
 * Handles real Supabase email/password auth via `useAuth` — no OAuth in this app.
 */
export function ModernLoginSignup({ mode }: ModernLoginSignupProps) {
  const isLogin = mode === 'login'
  const bannerRef = useRef<HTMLDivElement>(null)
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
    if (!canvasRef.current || !bannerRef.current) return
    const canvas = canvasRef.current
    const container = bannerRef.current

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
      u_total_size: { value: 16.0 },
      u_dot_size: { value: 5.0 },
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

            fragColor = vec4(color, opacity * 0.6);
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

    // Sized to the banner strip, not the viewport — this is a decorative accent inside a
    // normal light Card, not a full-bleed page.
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
    navigate('/dashboard')
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div ref={bannerRef} className="relative h-24 w-full bg-brand-green/5">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0) 40%, rgba(255,255,255,1) 100%)' }}
        />
        <div className="absolute bottom-0 left-1/2 z-10 flex h-12 w-12 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-brand-green font-display text-lg font-bold text-white shadow-sm">
          K
        </div>
      </div>

      <div className="flex flex-col items-center px-8 pb-8 pt-9 text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-brand-ink">
          {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
        </h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          {isLogin ? t('auth.signInSubtitle') : t('auth.createAccountSubtitle')}
        </p>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3.5 text-left">
          {!isLogin && (
            <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink">
              {t('auth.name')}
              <Input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink">
            {t('auth.email')}
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-brand-ink">
            {t('auth.password')}
            <Input
              type="password"
              required
              minLength={isLogin ? undefined : 6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting
              ? isLogin
                ? t('auth.signingIn')
                : t('auth.creatingAccount')
              : isLogin
                ? t('nav.signIn')
                : t('auth.createAccount')}
          </Button>
        </form>

        <div className="mt-5 text-sm text-slate-500">
          {isLogin ? t('auth.noAccount') : t('auth.alreadyHaveAccount')}{' '}
          <Link to={isLogin ? '/signup' : '/login'} className="font-medium text-brand-green hover:underline">
            {isLogin ? t('nav.signUp') : t('nav.signIn')}
          </Link>
        </div>

        <div className="mt-4 text-xs leading-relaxed text-slate-400">
          <Link to="/terms" className="hover:text-brand-green">
            {t('footer.terms')}
          </Link>{' '}
          &middot;{' '}
          <Link to="/privacy" className="hover:text-brand-green">
            {t('footer.privacy')}
          </Link>
        </div>
      </div>
    </div>
  )
}
