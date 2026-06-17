export function SpaceStyle() {
  return (
    <style>{`
      @keyframes spaceFloat { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(0,-6px,0) scale(1.018)} }
      @keyframes spacePulse { 0%,100%{opacity:.03; transform:scale(.94)} 50%{opacity:.07; transform:scale(1.025)} }
      @keyframes spaceDrift { 0%{transform:translate3d(-.7%,-.45%,0) scale(1.015)} 50%{transform:translate3d(.7%,.45%,0) scale(1.03)} 100%{transform:translate3d(-.45%,.7%,0) scale(1.022)} }
      @keyframes spaceWave { 0%{opacity:.46; transform:translate(-50%,-50%) scale(.18)} 55%{opacity:.22} 100%{opacity:0; transform:translate(-50%,-50%) scale(2.25)} }
      @keyframes spaceMiniWave { 0%{opacity:.42; transform:scale(.72)} 100%{opacity:0; transform:scale(1.42)} }
      @keyframes spaceComet { 0%{transform:translate3d(-20vw,18vh,0) rotate(-12deg); opacity:0} 12%,70%{opacity:.32} 100%{transform:translate3d(120vw,-22vh,0) rotate(-12deg); opacity:0} }
      @keyframes spaceWhisper { 0%,75%,100%{opacity:0; transform:translateY(8px)} 82%,94%{opacity:1; transform:translateY(0)} }
      @keyframes spaceIntroCrawl { 0%{transform:rotateX(24deg) translateY(70%); opacity:0} 9%{opacity:1} 78%{opacity:1} 100%{transform:rotateX(24deg) translateY(-95%) scale(.72); opacity:0} }
      @keyframes spaceUfoStrike { 0%{opacity:0; transform:translate3d(-70px,-32px,0) rotate(-16deg) scale(.8)} 28%{opacity:1} 68%{opacity:1; transform:translate3d(4px,2px,0) rotate(8deg) scale(1)} 100%{opacity:0; transform:translate3d(42px,-26px,0) rotate(18deg) scale(.88)} }
      @keyframes spaceLaser { 0%,24%{opacity:0; transform:scaleX(.12)} 34%,70%{opacity:1; transform:scaleX(1)} 100%{opacity:0; transform:scaleX(.28)} }
      @keyframes spaceBoom { 0%,42%{opacity:0; transform:scale(.15)} 58%{opacity:.95; transform:scale(1)} 100%{opacity:0; transform:scale(1.9)} }
      .space-root, .space-stage { touch-action: none; overscroll-behavior: none; -webkit-user-select: none; user-select: none; }
      .space-stage { -webkit-overflow-scrolling: auto; }
      .space-stage:active { cursor: grabbing; }
    `}</style>
  );
}
