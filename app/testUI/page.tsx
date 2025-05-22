'use client';
import { useState, useEffect, useRef } from 'react';
import {
    Home as IoHomeOutline,
    User as IoPersonOutline,
    Settings as IoSettingsOutline,
    Palette as IoColorPalette,
    X as IoClose,
    Pause as IoPause,
    Play as IoPlay,
    Search as IoSearch,
    Check as IoCheckmarkSharp,
  } from 'lucide-react';
  

/**
 * Neumorphic UI showcase built with Tailwind CSS.
 * Everything lives in a single page component so you can drop it straight
 * into /app/page.tsx (or /pages/index.tsx) inside your Next 13 project.
 *
 * NB: For true neumorphic shadows you may want to extend your Tailwind
 * box-shadow palette, but inline styles are used here to keep the file
 * self-contained.
 */
export default function NeumorphicPage() {
  /* ——————————————————————————————————— STATES —————————————————————————————————— */
  const [switch1, setSwitch1] = useState(false);
  const [switch2, setSwitch2] = useState(true);

  const [checkbox1, setCheckbox1] = useState(false);
  const [checkbox2, setCheckbox2] = useState(true);

  const [radio, setRadio] = useState<'1' | '2'>('2');
  const [tab, setTab] = useState<1 | 2 | 3>(1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);

  /* —————————————————————————————— CLOCK LOGIC —————————————————————————————— */
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hoursDeg = ((time.getHours() % 12) + time.getMinutes() / 60) * 30;
  const minutesDeg = time.getMinutes() * 6;
  const secondsDeg = time.getSeconds() * 6;

  /* ————————————————————————————— SLIDER LOGIC ————————————————————————————— */
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const positionToPercent = (x: number, rect: DOMRect) => {
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;
    return Math.round((x / rect.width) * 100);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!draggingRef.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = positionToPercent(e.clientX - rect.left, rect);
    setSliderValue(percent);
  };

  const startDrag = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    draggingRef.current = true;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = positionToPercent(e.clientX - rect.left, rect);
    setSliderValue(percent);
  };

  useEffect(() => {
    const stop = () => (draggingRef.current = false);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stop);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stop);
    };
  });

  /* —————————————————————————————— PALETTE ——————————————————————————————— */
  const c = {
    primaryLight: '#8abdff',
    primary: '#6d5dfc',
    primaryDark: '#5b0eeb',
    white: '#ffffff',
    greyLight1: '#E4EBF5',
    greyLight2: '#c8d0e7',
    greyLight3: '#bec8e4',
    greyDark: '#9baacf',
  } as const;

  const shadow = '0.3rem 0.3rem 0.6rem ' + c.greyLight2 + ', -0.2rem -0.2rem 0.5rem ' + c.white;
  const inner =
    'inset 0.2rem 0.2rem 0.5rem ' + c.greyLight2 + ', inset -0.2rem -0.2rem 0.5rem ' + c.white;

  /* —————————————————————————————— JSX ————————————————————————————————————— */
  return (
    <div
      className="min-h-screen flex items-center justify-center font-[Poppins]"
      style={{ background: c.greyLight1 }}
    >
      <div
        className="grid p-16 gap-y-10 gap-x-20 rounded-3xl"
        style={{
          width: '75rem',
          height: '40rem',
          gridTemplateColumns: '17.6rem 19rem 20.4rem',
          boxShadow: '.8rem .8rem 1.4rem ' + c.greyLight2 + ', -0.2rem -0.2rem 1.8rem ' + c.white,
        }}
      >
        {/* ————————— SWITCHES ————————— */}
        <div className="flex gap-12 justify-center">
          {[switch1, switch2].map((state, idx) => (
            <button
              key={idx}
              onClick={() => (idx ? setSwitch2(!switch2) : setSwitch1(!switch1))}
              className="relative w-24 h-12 rounded-full"
              style={{
                boxShadow: shadow,
                background: state
                  ? `linear-gradient(330deg, ${c.primaryDark} 0%, ${c.primary} 50%, ${c.primaryLight} 100%)`
                  : 'transparent',
              }}
            >
              <span
                className="absolute top-1 left-1 w-9 h-9 rounded-full transition-all"
                style={{
                  background: state ? c.greyLight1 : c.greyDark,
                  transform: state ? 'translateX(57%)' : 'translateX(0)',
                }}
              />
            </button>
          ))}
        </div>

        {/* ————————— CHECKBOXES ————————— */}
        <div className="flex gap-12 justify-center">
          {[checkbox1, checkbox2].map((state, idx) => (
            <button
              key={idx}
              onClick={() => (idx ? setCheckbox2(!checkbox2) : setCheckbox1(!checkbox1))}
              className="flex items-center justify-center w-12 h-12 rounded-lg"
              style={{ boxShadow: state ? inner : shadow }}
            >
              <IoCheckmarkSharp
                className="text-xl transition-colors"
                style={{ color: state ? c.primary : c.greyDark }}
              />
            </button>
          ))}
        </div>

        {/* ————————— RADIOS ————————— */}
        <div className="flex gap-12 justify-center">
          {['1', '2'].map((val) => (
            <button
              key={val}
              onClick={() => setRadio(val as '1' | '2')}
              className="relative flex items-center justify-center w-12 h-12 rounded-full"
              style={{ boxShadow: radio === val ? inner : shadow }}
            >
              <span
                className="w-6 h-6 rounded-full"
                style={{ background: radio === val ? c.primary : c.greyDark }}
              />
            </button>
          ))}
        </div>

        {/* ————————— PRIMARY BUTTON ————————— */}
        <button
          className="self-center justify-self-center w-60 h-16 rounded-xl text-lg"
          style={{
            color: c.greyLight1,
            background: c.primary,
            boxShadow: `inset .2rem .2rem 1rem ${c.primaryLight}, inset -.2rem -.2rem 1rem ${c.primaryDark}, ${shadow}`,
          }}
        >
          Button
        </button>

        {/* ————————— SECONDARY BUTTON ————————— */}
        <button
          className="self-center justify-self-center w-60 h-16 rounded-xl text-lg"
          style={{ color: c.greyDark, boxShadow: shadow }}
        >
          Button
        </button>

        {/* ————————— CLOCK ————————— */}
        <div className="flex items-center justify-center">
          <div
            className="relative flex items-center justify-center rounded-full"
            style={{ width: '12rem', height: '12rem', boxShadow: shadow }}
          >
            {/* hands */}
            <div
              className="absolute"
              style={{
                width: '.4rem',
                height: '3.2rem',
                background: c.greyLight3,
                bottom: '6rem',
                transformOrigin: 'bottom',
                transform: `rotate(${hoursDeg}deg)`,
              }}
            />
            <div
              className="absolute"
              style={{
                width: '.4rem',
                height: '4.6rem',
                background: c.greyDark,
                bottom: '6rem',
                transformOrigin: 'bottom',
                transform: `rotate(${minutesDeg}deg)`,
              }}
            />
            <div
              className="absolute"
              style={{
                width: '.2rem',
                height: '5.2rem',
                background: c.primary,
                bottom: '6rem',
                transformOrigin: 'bottom',
                transform: `rotate(${secondsDeg}deg)`,
              }}
            />
            <div className="absolute w-3 h-3 rounded-full" style={{ background: c.primary }} />
            <div
              className="relative flex items-center justify-center rounded-full"
              style={{ width: '95%', height: '95%', boxShadow: inner }}
            >
              {/* simple 12-3-6-9 markers */}
              <span className="absolute w-[2px] h-2 bg-current top-1 left-1/2 -translate-x-1/2" />
              <span className="absolute w-[2px] h-2 bg-current bottom-1 left-1/2 -translate-x-1/2" />
              <span className="absolute h-[2px] w-2 bg-current left-1 top-1/2 -translate-y-1/2" />
              <span className="absolute h-[2px] w-2 bg-current right-1 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* ————————— CHIP ————————— */}
        <div
          className="flex items-center justify-between w-72 h-16 rounded-xl px-2"
          style={{ boxShadow: shadow }}
        >
          <div
            className="w-12 h-12 flex items-center justify-center rounded-xl text-2xl"
            style={{ color: c.primary }}
          >
            <IoColorPalette />
          </div>
          <p className="text-xs" style={{ color: c.greyDark }}>
            Neumorphic Design
          </p>
          <button className="text-xl" style={{ color: c.greyLight3 }}>
            <IoClose />
          </button>
        </div>

        {/* ————————— PLAY BUTTON ————————— */}
        <div className="grid place-items-center">
          <div
            className={`relative grid place-items-center rounded-full w-24 h-24 select-none cursor-pointer`}
            style={{
              background: c.greyLight1,
              boxShadow: isPlaying ? inner : shadow,
            }}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <IoPause className="text-4xl" color={c.primary} />
            ) : (
              <IoPlay className="text-4xl ml-[3px]" color={c.primary} />
            )}
            {/* waves */}
            <span
              className="absolute rounded-full w-24 h-24 -z-10 blur-sm"
              style={{
                boxShadow: '.4rem .4rem .8rem ' + c.greyLight2 + ', -.4rem -.4rem .8rem ' + c.white,
                background: `linear-gradient(to bottom right, ${c.greyLight2} 0%, #fff 100%)`,
                animation: 'waves 4s linear infinite',
                animationPlayState: isPlaying ? 'running' : 'paused',
              }}
            />
            <span
              className="absolute rounded-full w-24 h-24 -z-20 blur-sm"
              style={{
                boxShadow: '.4rem .4rem .8rem ' + c.greyLight2 + ', -.4rem -.4rem .8rem ' + c.white,
                animation: 'waves 4s linear 2s infinite',
                animationPlayState: isPlaying ? 'running' : 'paused',
              }}
            />
          </div>
        </div>

        {/* ————————— FORM INPUT ————————— */}
        <div>
          <input
            type="text"
            placeholder="Type anything..."
            className="w-80 h-16 rounded-xl pl-6 text-base focus:outline-none"
            style={{ background: 'none', color: c.greyDark, boxShadow: inner }}
          />
        </div>

        {/* ————————— SEARCH ————————— */}
        <div className="relative flex items-center">
          <IoSearch className="absolute text-2xl ml-4" style={{ color: c.greyDark }} />
          <input
            type="text"
            placeholder="Search..."
            className="w-80 h-16 rounded-xl pl-12 text-base focus:outline-none"
            style={{ background: 'none', color: c.greyDark, boxShadow: inner }}
          />
        </div>

        {/* ————————— SEGMENTED CONTROL ————————— */}
        <div className="relative flex items-center w-80 h-16 rounded-xl" style={{ boxShadow: shadow }}>
          <div
            className="absolute h-14 w-[6.2rem] rounded-lg transition-transform"
            style={{ marginLeft: '.3rem', transform: `translateX(${(tab - 1) * 6.8}rem)`, boxShadow: inner }}
          />
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              className="flex items-center justify-center w-[6.8rem] h-14 text-base"
              style={{ color: tab === n ? c.primary : c.greyDark }}
              onClick={() => setTab(n as 1 | 2 | 3)}
            >
              Tab {n}
            </button>
          ))}
        </div>

        {/* ————————— ICONS ————————— */}
        <div className="flex justify-between w-80">
          {[IoHomeOutline, IoPersonOutline, IoSettingsOutline].map((Icon, i) => (
            <button
              key={i}
              className="flex items-center justify-center w-16 h-16 rounded-full text-2xl"
              style={{ boxShadow: shadow, color: c.greyDark }}
            >
              <Icon />
            </button>
          ))}
        </div>

        {/* ————————— SLIDER ————————— */}
        <div className="flex flex-col justify-center">
          <div
            ref={trackRef}
            onPointerDown={startDrag}
            className="relative w-80 h-4 rounded-full"
            style={{ boxShadow: inner, cursor: 'pointer' }}
          >
            <span
              className="absolute h-full rounded-full"
              style={{
                width: `${sliderValue}%`,
                background: `linear-gradient(-1deg, ${c.primaryDark} 0%, ${c.primary} 50%, ${c.primaryLight} 100%)`,
              }}
            />
            {/* knob */}
            <span
              className="absolute -top-3 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                left: `calc(${sliderValue}% - 16px)`,
                background: c.white,
                boxShadow: '0 .1rem .3rem 0 ' + c.greyLight3,
                cursor: 'grab',
              }}
              onPointerDown={startDrag}
            >
              <span className="absolute w-3 h-3 rounded-full" style={{ boxShadow: inner }} />
            </span>
            {/* tooltip */}
            <span
              className="absolute top-10 w-12 h-10 rounded-lg flex items-center justify-center text-sm select-none"
              style={{
                left: `calc(${sliderValue}% - 24px)`,
                background: c.greyLight1,
                boxShadow: shadow,
                color: c.primary,
              }}
            >
              {sliderValue}%
            </span>
          </div>
        </div>
      </div>

      {/* ————————— GLOBAL STYLES ————————— */}
      <style jsx global>{`
        @keyframes waves {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
