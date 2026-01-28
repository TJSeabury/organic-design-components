import { useState, useEffect, useRef } from 'react'
import './RadialLayout.css'

export type RadialLayoutElement = React.ReactNode

interface RadialLayoutProps {
  elements: RadialLayoutElement[]
  children?: React.ReactNode
}

export const RadialLayout = ({ elements, children }: RadialLayoutProps) => {
  const [radius, setRadius] = useState<number>(100)
  const [contentWidth, setContentWidth] = useState<number>(1280)
  const containerRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const TAU = 2 * Math.PI
  const [offset, setOffset] = useState<number>(TAU / 4)

  useEffect(() => {
    setOffset(TAU / 4)
  }, [elements])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateRadius = () => {
      const width = container.offsetWidth
      // Radius is half the width for a circle
      setRadius(width / 2)
    }

    // Initial measurement
    updateRadius()

    // Use ResizeObserver to watch for size changes
    const resizeObserver = new ResizeObserver(updateRadius)
    resizeObserver.observe(container)

    const center = centerRef.current
    if (!center) return

    const updateCenter = () => {
      const width = center.getBoundingClientRect().width * 1.25
      setContentWidth(width)
    }

    const centerResizeObserver = new ResizeObserver(updateCenter)
    centerResizeObserver.observe(center)

    return () => {
      resizeObserver.disconnect()
      centerResizeObserver.disconnect()
    }
  }, [])

  return <div ref={containerRef} className="radial-layout w-full h-full before:content-[''] before:block before:pt-[100%]" style={{
    position: 'relative',
    width: '100%',
    height: '100%',
    maxWidth: `${contentWidth}px`,
    maxHeight: `${contentWidth}px`,
    border: '1px solid white',
    borderRadius: '50%',
    margin: '0 auto',
  }}>
    {elements.map((element, index) => (
      <div key={index} className="radial-layout-item absolute" style={{
        '--translate-x': `calc(cos(${(TAU * (index / elements.length)) - offset}) * ${radius}px)`,
        '--translate-y': `calc(sin(${(TAU * (index / elements.length)) - offset}) * ${radius}px)`,
        transform: 'translate(var(--translate-x), var(--translate-y))',
        transformOrigin: 'center',
        top: 'calc(50% - 50px)',
        left: 'calc(50% - 50px)',
        color: 'black',
        backgroundColor: '#242424',
        width: '100px',
        height: '100px',
        border: '1px solid white',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      } as React.CSSProperties & Record<string, string>}>
        {element}
      </div>
    ))}
    {children && (
      <div ref={centerRef} className="radial-layout-center absolute flex items-center justify-center flex-col" style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'absolute',
        minWidth: '400px',
        minHeight: '400px',
      }}>
        {children}
      </div>
    )}
  </div>
}