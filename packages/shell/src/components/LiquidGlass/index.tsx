// Ported from liquid-glass-react (MIT) — adapted for React 18, no Tailwind
// GlassPanel: simplified glass effect for layout-integrated elements (Dock, menus)
import {
  type CSSProperties,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { ShaderDisplacementGenerator, fragmentShaders } from './shader-utils'
import { displacementMap, polarDisplacementMap, prominentDisplacementMap } from './utils'

const generateShaderDisplacementMap = (width: number, height: number): string => {
  const generator = new ShaderDisplacementGenerator({
    width,
    height,
    fragment: fragmentShaders.liquidGlass,
  })
  const dataUrl = generator.updateShader()
  generator.destroy()
  return dataUrl
}

const getMap = (
  mode: 'standard' | 'polar' | 'prominent' | 'shader',
  shaderMapUrl?: string,
): string => {
  switch (mode) {
    case 'standard':
      return displacementMap
    case 'polar':
      return polarDisplacementMap
    case 'prominent':
      return prominentDisplacementMap
    case 'shader':
      return shaderMapUrl || displacementMap
    default:
      throw new Error(`Invalid mode: ${mode}`)
  }
}

/* ---------- SVG filter (edge-only displacement) ---------- */
const GlassFilter: React.FC<{
  id: string
  displacementScale: number
  aberrationIntensity: number
  width: number
  height: number
  mode: 'standard' | 'polar' | 'prominent' | 'shader'
  shaderMapUrl?: string
}> = ({ id, displacementScale, aberrationIntensity, width, height, mode, shaderMapUrl }) => (
  <svg style={{ position: 'absolute', width, height }} aria-hidden="true">
    <defs>
      <radialGradient id={`${id}-edge-mask`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="black" stopOpacity="0" />
        <stop
          offset={`${Math.max(30, 80 - aberrationIntensity * 2)}%`}
          stopColor="black"
          stopOpacity="0"
        />
        <stop offset="100%" stopColor="white" stopOpacity="1" />
      </radialGradient>
      <filter
        id={id}
        x="-35%"
        y="-35%"
        width="170%"
        height="170%"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          id="feimage"
          x="0"
          y="0"
          width="100%"
          height="100%"
          result="DISPLACEMENT_MAP"
          href={getMap(mode, shaderMapUrl)}
          preserveAspectRatio="xMidYMid slice"
        />
        <feColorMatrix
          in="DISPLACEMENT_MAP"
          type="matrix"
          values="0.3 0.3 0.3 0 0
                 0.3 0.3 0.3 0 0
                 0.3 0.3 0.3 0 0
                 0 0 0 1 0"
          result="EDGE_INTENSITY"
        />
        <feComponentTransfer in="EDGE_INTENSITY" result="EDGE_MASK">
          <feFuncA type="discrete" tableValues={`0 ${aberrationIntensity * 0.05} 1`} />
        </feComponentTransfer>
        <feOffset in="SourceGraphic" dx="0" dy="0" result="CENTER_ORIGINAL" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="DISPLACEMENT_MAP"
          scale={displacementScale * (mode === 'shader' ? 1 : -1)}
          xChannelSelector="R"
          yChannelSelector="B"
          result="RED_DISPLACED"
        />
        <feColorMatrix
          in="RED_DISPLACED"
          type="matrix"
          values="1 0 0 0 0
                 0 0 0 0 0
                 0 0 0 0 0
                 0 0 0 1 0"
          result="RED_CHANNEL"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="DISPLACEMENT_MAP"
          scale={
            displacementScale * ((mode === 'shader' ? 1 : -1) - aberrationIntensity * 0.05)
          }
          xChannelSelector="R"
          yChannelSelector="B"
          result="GREEN_DISPLACED"
        />
        <feColorMatrix
          in="GREEN_DISPLACED"
          type="matrix"
          values="0 0 0 0 0
                 0 1 0 0 0
                 0 0 0 0 0
                 0 0 0 1 0"
          result="GREEN_CHANNEL"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="DISPLACEMENT_MAP"
          scale={
            displacementScale * ((mode === 'shader' ? 1 : -1) - aberrationIntensity * 0.1)
          }
          xChannelSelector="R"
          yChannelSelector="B"
          result="BLUE_DISPLACED"
        />
        <feColorMatrix
          in="BLUE_DISPLACED"
          type="matrix"
          values="0 0 0 0 0
                 0 0 0 0 0
                 0 0 1 0 0
                 0 0 0 1 0"
          result="BLUE_CHANNEL"
        />
        <feBlend in="GREEN_CHANNEL" in2="BLUE_CHANNEL" mode="screen" result="GB_COMBINED" />
        <feBlend in="RED_CHANNEL" in2="GB_COMBINED" mode="screen" result="RGB_COMBINED" />
        <feGaussianBlur
          in="RGB_COMBINED"
          stdDeviation={Math.max(0.1, 0.5 - aberrationIntensity * 0.1)}
          result="ABERRATED_BLURRED"
        />
        <feComposite
          in="ABERRATED_BLURRED"
          in2="EDGE_MASK"
          operator="in"
          result="EDGE_ABERRATION"
        />
        <feComponentTransfer in="EDGE_MASK" result="INVERTED_MASK">
          <feFuncA type="table" tableValues="1 0" />
        </feComponentTransfer>
        <feComposite
          in="CENTER_ORIGINAL"
          in2="INVERTED_MASK"
          operator="in"
          result="CENTER_CLEAN"
        />
        <feComposite in="EDGE_ABERRATION" in2="CENTER_CLEAN" operator="over" />
      </filter>
    </defs>
  </svg>
)

/* ---------- inner glass container ---------- */
const GlassContainer = forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<{
    style?: CSSProperties
    displacementScale?: number
    blurAmount?: number
    saturation?: number
    aberrationIntensity?: number
    mouseOffset?: { x: number; y: number }
    onMouseLeave?: () => void
    onMouseEnter?: () => void
    onMouseDown?: () => void
    onMouseUp?: () => void
    active?: boolean
    overLight?: boolean
    cornerRadius?: number
    padding?: string
    glassSize?: { width: number; height: number }
    onClick?: () => void
    mode?: 'standard' | 'polar' | 'prominent' | 'shader'
  }>
>(
  (
    {
      children,
      style,
      displacementScale = 25,
      blurAmount = 12,
      saturation = 180,
      aberrationIntensity = 2,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      overLight = false,
      cornerRadius = 999,
      padding = '24px 32px',
      glassSize = { width: 270, height: 69 },
      onClick,
      mode = 'standard',
    },
    ref,
  ) => {
    const filterId = useId()
    const [shaderMapUrl, setShaderMapUrl] = useState<string>('')

    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')

    useEffect(() => {
      if (mode === 'shader') {
        const url = generateShaderDisplacementMap(glassSize.width, glassSize.height)
        setShaderMapUrl(url)
      }
    }, [mode, glassSize.width, glassSize.height])

    const backdropStyle: CSSProperties = {
      filter: isFirefox ? undefined : `url(#${filterId})`,
      backdropFilter: `blur(${(overLight ? 12 : 4) + blurAmount * 32}px) saturate(${saturation}%)`,
    }

    return (
      <div
        ref={ref}
        style={{ position: 'relative', cursor: onClick ? 'pointer' : undefined, ...style }}
        onClick={onClick}
      >
        <GlassFilter
          mode={mode}
          id={filterId}
          displacementScale={displacementScale}
          aberrationIntensity={aberrationIntensity}
          width={glassSize.width}
          height={glassSize.height}
          shaderMapUrl={shaderMapUrl}
        />
        <div
          style={{
            borderRadius: `${cornerRadius}px`,
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '24px',
            padding,
            overflow: 'hidden',
            transition: 'all 0.2s ease-in-out',
            boxShadow: overLight
              ? '0px 16px 70px rgba(0, 0, 0, 0.75)'
              : '0px 12px 40px rgba(0, 0, 0, 0.25)',
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
        >
          {/* backdrop warp layer */}
          <span
            style={
              {
                ...backdropStyle,
                position: 'absolute',
                inset: '0',
              } as CSSProperties
            }
          />
          {/* user content stays sharp */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              transition: 'all 150ms ease-in-out',
              color: 'white',
              textShadow: overLight
                ? '0px 2px 12px rgba(0, 0, 0, 0)'
                : '0px 2px 12px rgba(0, 0, 0, 0.4)',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    )
  },
)

GlassContainer.displayName = 'GlassContainer'

export interface LiquidGlassProps {
  children: React.ReactNode
  displacementScale?: number
  blurAmount?: number
  saturation?: number
  aberrationIntensity?: number
  elasticity?: number
  cornerRadius?: number
  globalMousePos?: { x: number; y: number }
  mouseOffset?: { x: number; y: number }
  mouseContainer?: React.RefObject<HTMLElement | null> | null
  className?: string
  padding?: string
  style?: CSSProperties
  overLight?: boolean
  mode?: 'standard' | 'polar' | 'prominent' | 'shader'
  onClick?: () => void
}

export default function LiquidGlass({
  children,
  displacementScale = 70,
  blurAmount = 0.0625,
  saturation = 140,
  aberrationIntensity = 2,
  elasticity = 0.15,
  cornerRadius = 999,
  globalMousePos: externalGlobalMousePos,
  mouseOffset: externalMouseOffset,
  mouseContainer = null,
  padding = '24px 32px',
  overLight = false,
  style = {},
  mode = 'standard',
  onClick,
}: LiquidGlassProps) {
  const glassRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [glassSize, setGlassSize] = useState({ width: 270, height: 69 })
  const [internalGlobalMousePos, setInternalGlobalMousePos] = useState({ x: 0, y: 0 })
  const [internalMouseOffset, setInternalMouseOffset] = useState({ x: 0, y: 0 })

  const globalMousePos = externalGlobalMousePos || internalGlobalMousePos
  const mouseOffset = externalMouseOffset || internalMouseOffset

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const container = mouseContainer?.current || glassRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      setInternalMouseOffset({
        x: ((e.clientX - centerX) / rect.width) * 100,
        y: ((e.clientY - centerY) / rect.height) * 100,
      })

      setInternalGlobalMousePos({ x: e.clientX, y: e.clientY })
    },
    [mouseContainer],
  )

  useEffect(() => {
    if (externalGlobalMousePos && externalMouseOffset) return

    const container = mouseContainer?.current || glassRef.current
    if (!container) return

    container.addEventListener('mousemove', handleMouseMove)
    return () => container.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove, mouseContainer, externalGlobalMousePos, externalMouseOffset])

  const calculateDirectionalScale = useCallback(() => {
    if (!globalMousePos.x || !globalMousePos.y || !glassRef.current) return 'scale(1)'

    const rect = glassRef.current.getBoundingClientRect()
    const pillCenterX = rect.left + rect.width / 2
    const pillCenterY = rect.top + rect.height / 2
    const pillWidth = glassSize.width
    const pillHeight = glassSize.height

    const deltaX = globalMousePos.x - pillCenterX
    const deltaY = globalMousePos.y - pillCenterY

    const edgeDistanceX = Math.max(0, Math.abs(deltaX) - pillWidth / 2)
    const edgeDistanceY = Math.max(0, Math.abs(deltaY) - pillHeight / 2)
    const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY)

    const activationZone = 200
    if (edgeDistance > activationZone) return 'scale(1)'

    const fadeInFactor = 1 - edgeDistance / activationZone
    const centerDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    if (centerDistance === 0) return 'scale(1)'

    const normalizedX = deltaX / centerDistance
    const normalizedY = deltaY / centerDistance
    const stretchIntensity = Math.min(centerDistance / 300, 1) * elasticity * fadeInFactor
    const scaleX =
      1 + Math.abs(normalizedX) * stretchIntensity * 0.3 - Math.abs(normalizedY) * stretchIntensity * 0.15
    const scaleY =
      1 + Math.abs(normalizedY) * stretchIntensity * 0.3 - Math.abs(normalizedX) * stretchIntensity * 0.15

    return `scaleX(${Math.max(0.8, scaleX)}) scaleY(${Math.max(0.8, scaleY)})`
  }, [globalMousePos, elasticity, glassSize])

  const calculateFadeInFactor = useCallback(() => {
    if (!globalMousePos.x || !globalMousePos.y || !glassRef.current) return 0

    const rect = glassRef.current.getBoundingClientRect()
    const pillWidth = glassSize.width
    const pillHeight = glassSize.height
    const pillCenterX = rect.left + rect.width / 2
    const pillCenterY = rect.top + rect.height / 2

    const edgeDistanceX = Math.max(0, Math.abs(globalMousePos.x - pillCenterX) - pillWidth / 2)
    const edgeDistanceY = Math.max(0, Math.abs(globalMousePos.y - pillCenterY) - pillHeight / 2)
    const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY)

    const activationZone = 200
    return edgeDistance > activationZone ? 0 : 1 - edgeDistance / activationZone
  }, [globalMousePos, glassSize])

  const calculateElasticTranslation = useCallback(() => {
    if (!glassRef.current) return { x: 0, y: 0 }

    const fadeInFactor = calculateFadeInFactor()
    const rect = glassRef.current.getBoundingClientRect()
    const pillCenterX = rect.left + rect.width / 2
    const pillCenterY = rect.top + rect.height / 2

    return {
      x: (globalMousePos.x - pillCenterX) * elasticity * 0.1 * fadeInFactor,
      y: (globalMousePos.y - pillCenterY) * elasticity * 0.1 * fadeInFactor,
    }
  }, [globalMousePos, elasticity, calculateFadeInFactor])

  useEffect(() => {
    const updateGlassSize = () => {
      if (glassRef.current) {
        const rect = glassRef.current.getBoundingClientRect()
        setGlassSize({ width: rect.width, height: rect.height })
      }
    }

    updateGlassSize()
    window.addEventListener('resize', updateGlassSize)
    return () => window.removeEventListener('resize', updateGlassSize)
  }, [])

  const translation = calculateElasticTranslation()
  const transformStyle = `translate(calc(-50% + ${translation.x}px), calc(-50% + ${translation.y}px)) ${isActive && Boolean(onClick) ? 'scale(0.96)' : calculateDirectionalScale()}`

  const baseStyle: CSSProperties = {
    ...style,
    transform: transformStyle,
    transition: 'all ease-out 0.2s',
  }

  const positionStyles: CSSProperties = {
    position: (baseStyle.position as CSSProperties['position']) || 'relative',
    top: baseStyle.top || '50%',
    left: baseStyle.left || '50%',
  }

  const borderGradient = (opacity1: number, opacity2: number) =>
    `linear-gradient(
      ${135 + mouseOffset.x * 1.2}deg,
      rgba(255, 255, 255, 0.0) 0%,
      rgba(255, 255, 255, ${opacity1 + Math.abs(mouseOffset.x) * 0.008}) ${Math.max(10, 33 + mouseOffset.y * 0.3)}%,
      rgba(255, 255, 255, ${opacity2 + Math.abs(mouseOffset.x) * 0.012}) ${Math.min(90, 66 + mouseOffset.y * 0.4)}%,
      rgba(255, 255, 255, 0.0) 100%
    )`

  const borderSpanBase: CSSProperties = {
    ...positionStyles,
    height: glassSize.height,
    width: glassSize.width,
    borderRadius: `${cornerRadius}px`,
    transform: baseStyle.transform,
    transition: baseStyle.transition,
    pointerEvents: 'none',
    padding: '1.5px',
    WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    boxShadow:
      '0 0 0 0.5px rgba(255, 255, 255, 0.5) inset, 0 1px 3px rgba(255, 255, 255, 0.25) inset, 0 1px 4px rgba(0, 0, 0, 0.35)',
  }

  return (
    <>
      {/* Over light effect overlays */}
      <div
        style={{
          ...positionStyles,
          height: glassSize.height,
          width: glassSize.width,
          borderRadius: `${cornerRadius}px`,
          transform: baseStyle.transform,
          transition: baseStyle.transition,
          pointerEvents: 'none',
          background: 'black',
          opacity: overLight ? 0.2 : 0,
        }}
      />
      <div
        style={{
          ...positionStyles,
          height: glassSize.height,
          width: glassSize.width,
          borderRadius: `${cornerRadius}px`,
          transform: baseStyle.transform,
          transition: baseStyle.transition,
          pointerEvents: 'none',
          background: 'black',
          mixBlendMode: 'overlay',
          opacity: overLight ? 1 : 0,
        }}
      />

      <GlassContainer
        ref={glassRef}
        style={baseStyle}
        cornerRadius={cornerRadius}
        displacementScale={overLight ? displacementScale * 0.5 : displacementScale}
        blurAmount={blurAmount}
        saturation={saturation}
        aberrationIntensity={aberrationIntensity}
        glassSize={glassSize}
        padding={padding}
        mouseOffset={mouseOffset}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsActive(true)}
        onMouseUp={() => setIsActive(false)}
        active={isActive}
        overLight={overLight}
        onClick={onClick}
        mode={mode}
      >
        {children}
      </GlassContainer>

      {/* Border highlight layer 1 — screen blend */}
      <span
        style={{
          ...borderSpanBase,
          mixBlendMode: 'screen',
          opacity: 0.2,
          background: borderGradient(0.12, 0.4),
        }}
      />

      {/* Border highlight layer 2 — overlay blend */}
      <span
        style={{
          ...borderSpanBase,
          mixBlendMode: 'overlay',
          background: borderGradient(0.32, 0.6),
        }}
      />

      {/* Hover / active glow effects */}
      {Boolean(onClick) && (
        <>
          <div
            style={{
              ...positionStyles,
              height: glassSize.height,
              width: glassSize.width + 1,
              borderRadius: `${cornerRadius}px`,
              transform: baseStyle.transform,
              pointerEvents: 'none',
              transition: 'all 0.2s ease-out',
              opacity: isHovered || isActive ? 0.5 : 0,
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 50%)',
              mixBlendMode: 'overlay',
            }}
          />
          <div
            style={{
              ...positionStyles,
              height: glassSize.height,
              width: glassSize.width + 1,
              borderRadius: `${cornerRadius}px`,
              transform: baseStyle.transform,
              pointerEvents: 'none',
              transition: 'all 0.2s ease-out',
              opacity: isActive ? 0.5 : 0,
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 80%)',
              mixBlendMode: 'overlay',
            }}
          />
          <div
            style={{
              ...baseStyle,
              height: glassSize.height,
              width: glassSize.width + 1,
              borderRadius: `${cornerRadius}px`,
              position: baseStyle.position,
              top: baseStyle.top,
              left: baseStyle.left,
              pointerEvents: 'none',
              transition: 'all 0.2s ease-out',
              opacity: isHovered ? 0.4 : isActive ? 0.8 : 0,
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)',
              mixBlendMode: 'overlay',
            }}
          />
        </>
      )}
    </>
  )
}

/* ---------- GlassPanel: layout-integrated glass (Dock, ContextMenu) ----------
 * Unlike LiquidGlass (which floats at top:50% left:50%), GlassPanel renders
 * in-flow and applies the SVG displacement filter + backdrop-filter.
 * Use this when the element participates in normal layout.
 */
export interface GlassPanelProps {
  children: React.ReactNode
  cornerRadius?: number
  padding?: string
  displacementScale?: number
  blurAmount?: number
  saturation?: number
  aberrationIntensity?: number
  style?: CSSProperties
  className?: string
  mode?: 'standard' | 'polar' | 'prominent' | 'shader'
}

export function GlassPanel({
  children,
  cornerRadius = 20,
  padding = '8px',
  displacementScale = 30,
  blurAmount = 0.25,
  saturation = 180,
  aberrationIntensity = 1.5,
  style,
  className,
  mode = 'standard',
}: GlassPanelProps) {
  const filterId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [shaderMapUrl, setShaderMapUrl] = useState<string>('')

  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')

  useEffect(() => {
    if (mode === 'shader') {
      const url = generateShaderDisplacementMap(size.width || 200, size.height || 60)
      setShaderMapUrl(url)
    }
  }, [mode, size.width, size.height])

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setSize({ width: rect.width, height: rect.height })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const blurPx = 4 + blurAmount * 32

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        borderRadius: `${cornerRadius}px`,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* SVG filter — absolutely positioned, 0 size in layout */}
      {size.width > 0 && (
        <svg
          style={{ position: 'absolute', width: size.width, height: size.height, pointerEvents: 'none', zIndex: 0 }}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={`${filterId}-edge-mask`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="black" stopOpacity="0" />
              <stop
                offset={`${Math.max(30, 80 - aberrationIntensity * 2)}%`}
                stopColor="black"
                stopOpacity="0"
              />
              <stop offset="100%" stopColor="white" stopOpacity="1" />
            </radialGradient>
            <filter
              id={filterId}
              x="-35%"
              y="-35%"
              width="170%"
              height="170%"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                x="0"
                y="0"
                width="100%"
                height="100%"
                result="DISPLACEMENT_MAP"
                href={getMap(mode, shaderMapUrl)}
                preserveAspectRatio="xMidYMid slice"
              />
              <feColorMatrix
                in="DISPLACEMENT_MAP"
                type="matrix"
                values="0.3 0.3 0.3 0 0 0.3 0.3 0.3 0 0 0.3 0.3 0.3 0 0 0 0 0 1 0"
                result="EDGE_INTENSITY"
              />
              <feComponentTransfer in="EDGE_INTENSITY" result="EDGE_MASK">
                <feFuncA type="discrete" tableValues={`0 ${aberrationIntensity * 0.05} 1`} />
              </feComponentTransfer>
              <feOffset in="SourceGraphic" dx="0" dy="0" result="CENTER_ORIGINAL" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="DISPLACEMENT_MAP"
                scale={displacementScale * -1}
                xChannelSelector="R"
                yChannelSelector="B"
                result="RED_DISPLACED"
              />
              <feColorMatrix
                in="RED_DISPLACED"
                type="matrix"
                values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
                result="RED_CHANNEL"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="DISPLACEMENT_MAP"
                scale={displacementScale * (-1 - aberrationIntensity * 0.05)}
                xChannelSelector="R"
                yChannelSelector="B"
                result="GREEN_DISPLACED"
              />
              <feColorMatrix
                in="GREEN_DISPLACED"
                type="matrix"
                values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
                result="GREEN_CHANNEL"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="DISPLACEMENT_MAP"
                scale={displacementScale * (-1 - aberrationIntensity * 0.1)}
                xChannelSelector="R"
                yChannelSelector="B"
                result="BLUE_DISPLACED"
              />
              <feColorMatrix
                in="BLUE_DISPLACED"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"
                result="BLUE_CHANNEL"
              />
              <feBlend in="GREEN_CHANNEL" in2="BLUE_CHANNEL" mode="screen" result="GB_COMBINED" />
              <feBlend in="RED_CHANNEL" in2="GB_COMBINED" mode="screen" result="RGB_COMBINED" />
              <feGaussianBlur
                in="RGB_COMBINED"
                stdDeviation={Math.max(0.1, 0.5 - aberrationIntensity * 0.1)}
                result="ABERRATED_BLURRED"
              />
              <feComposite in="ABERRATED_BLURRED" in2="EDGE_MASK" operator="in" result="EDGE_ABERRATION" />
              <feComponentTransfer in="EDGE_MASK" result="INVERTED_MASK">
                <feFuncA type="table" tableValues="1 0" />
              </feComponentTransfer>
              <feComposite in="CENTER_ORIGINAL" in2="INVERTED_MASK" operator="in" result="CENTER_CLEAN" />
              <feComposite in="EDGE_ABERRATION" in2="CENTER_CLEAN" operator="over" />
            </filter>
          </defs>
        </svg>
      )}

      {/* Warp + backdrop layer */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          filter: isFirefox || size.width === 0 ? undefined : `url(#${filterId})`,
          backdropFilter: `blur(${blurPx}px) saturate(${saturation}%)`,
          WebkitBackdropFilter: `blur(${blurPx}px) saturate(${saturation}%)`,
          zIndex: 0,
        } as CSSProperties}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, padding }}>
        {children}
      </div>
    </div>
  )
}

