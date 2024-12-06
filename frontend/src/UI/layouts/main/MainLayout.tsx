import { Loader, Header, Footer } from '@components/index'
import React, { Suspense, useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { throttle } from 'lodash'

const MainLayout = () => {
  const linesRef = useRef<HTMLDivElement[]>([])
  const [showDot, setShowDot] = useState<{
    visible: boolean
    x: number
    y: number
    rotate: number
  }>({
    visible: false,
    x: 0,
    y: 0,
    rotate: 0,
  })

  // Функция для генерации случайного значения от 10 до 70 vh
  const getRandomTop = () => {
    return `${Math.random() * (100 - 0) + 10}vh`
  }

  useEffect(() => {
    linesRef.current.forEach((line) => {
      const initialRotate = parseFloat(line.dataset.rotate || '0')
      const randomOffset = Math.random() * 4 - 1 // Случайный сдвиг от -2 до 2 градусов
      const randomAngle = initialRotate + randomOffset // Комбинируем начальный поворот со случайным сдвигом
      const randomTop = getRandomTop() // Генерируем случайное значение для top

      line.style.setProperty('--initial-rotate', `${initialRotate}deg`)
      line.style.setProperty('--random-offset', `${randomOffset}deg`)
      line.style.setProperty('top', randomTop) // Устанавливаем случайный top
      line.dataset.rotate = `${randomAngle}` // Обновляем атрибут data-rotate
      line.style.transform = `rotate(${randomAngle}deg)` // Применяем поворот к линии
    })
  }, [])

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, rotate: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setShowDot({ visible: true, x: rect.left, y: rect.top, rotate })
  }

  const handleMouseMove = throttle((e: React.MouseEvent<HTMLDivElement>, rotate: number) => {
    const { clientX, clientY } = e
    setShowDot((prev) => ({ ...prev, x: clientX, y: clientY, rotate }))
  }, 100)

  const handleMouseLeave = () => {
    setShowDot({ visible: false, x: 0, y: 0, rotate: 0 })
  }

  return (
    <div className="relative bg-black min-h-screen flex flex-col overflow-hidden md:pointer-events-none md:[&_*]:pointer-events-none">
      <div className="w-full h-full absolute top-0 left-0">
        {showDot.visible && (
          <div
            className="w-[.5713rem] h-[.5713rem] bg-[#90e38c] rounded-full blur-[.0938rem] absolute z-30 dot"
            style={{
              top: showDot.y - 6.5,
              left: showDot.x - 6.5,
              transform: `rotate(${showDot.rotate}deg)`,
            }}
          >
            <div className="w-[4.8344rem] h-[4.8344rem] bg-[#63d45d] rounded-full blur-[3.75rem] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          </div>
        )}

        {/* Lines */}
        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[170vw] h-[0.9px] left-0 absolute origin-top-left rotate-line hover-area"
          data-rotate="-17.62"
          onMouseEnter={(e) => handleMouseEnter(e, -17.62)}
          onMouseMove={(e) => handleMouseMove(e, -17.62)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 left-0"></div>
        </div>

        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[170vw] h-[0.9px] left-0 absolute origin-top-left rotate-line hover-area"
          data-rotate="-6.96"
          onMouseEnter={(e) => handleMouseEnter(e, -6.96)}
          onMouseMove={(e) => handleMouseMove(e, -6.96)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 left-0"></div>
        </div>

        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[170vw] h-[0.9px] left-0 absolute origin-top-left rotate-line hover-area"
          data-rotate="37.45"
          onMouseEnter={(e) => handleMouseEnter(e, 37.45)}
          onMouseMove={(e) => handleMouseMove(e, 37.45)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 left-0"></div>
        </div>

        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[170vw] h-[0.9px] left-0 absolute origin-top-left rotate-line hover-area"
          data-rotate="-7.18"
          onMouseEnter={(e) => handleMouseEnter(e, -7.18)}
          onMouseMove={(e) => handleMouseMove(e, -7.18)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 left-0"></div>
        </div>

        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[170vw] h-[0.9px] left-0 absolute origin-top-left rotate-line hover-area"
          data-rotate="2.23"
          onMouseEnter={(e) => handleMouseEnter(e, 2.23)}
          onMouseMove={(e) => handleMouseMove(e, 2.23)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 left-0"></div>
        </div>
        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[170vw] h-[0.9px] left-0 absolute origin-top-left rotate-line hover-area"
          data-rotate="12.23"
          onMouseEnter={(e) => handleMouseEnter(e, 12.23)}
          onMouseMove={(e) => handleMouseMove(e, 12.23)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 left-0"></div>
        </div>
        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[170vw] h-[0.9px] right-0 absolute origin-top-right rotate-line hover-area"
          data-rotate="-2.23"
          onMouseEnter={(e) => handleMouseEnter(e, -2.23)}
          onMouseMove={(e) => handleMouseMove(e, -2.23)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 right-0"></div>
        </div>
        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[170vw] h-[0.9px] right-0 absolute origin-top-right rotate-line hover-area"
          data-rotate="22.23"
          onMouseEnter={(e) => handleMouseEnter(e, 22.23)}
          onMouseMove={(e) => handleMouseMove(e, 22.23)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 right-0"></div>
        </div>
        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[170vw] h-[0.9px] right-0 absolute origin-top-right rotate-line hover-area"
          data-rotate="0"
          onMouseEnter={(e) => handleMouseEnter(e, 0)}
          onMouseMove={(e) => handleMouseMove(e, 0)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 right-0"></div>
        </div>
        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[170vw] h-[0.9px] right-0 absolute origin-top-right rotate-line hover-area"
          data-rotate="14.23"
          onMouseEnter={(e) => handleMouseEnter(e, 14.23)}
          onMouseMove={(e) => handleMouseMove(e, 14.23)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 right-0"></div>
        </div>
      </div>
      <Suspense fallback={<Loader />}>
        <Header />
        <main className="relative z-20">
          <Outlet />
        </main>
        <Footer />
      </Suspense>
    </div>
  )
}

export default MainLayout
