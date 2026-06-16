export function SpaceStyle() {
  return (
    <style>{`
      @keyframes spaceFloat { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(0,-10px,0) scale(1.035)} }
      @keyframes spacePulse { 0%,100%{opacity:.045; transform:scale(.90)} 50%{opacity:.12; transform:scale(1.04)} }
      @keyframes spaceDrift { 0%{transform:translate3d(-1%,-.7%,0) scale(1.02)} 50%{transform:translate3d(1%,.7%,0) scale(1.045)} 100%{transform:translate3d(-.7%,1%,0) scale(1.035)} }
      @keyframes spaceWave { 0%{opacity:.30; transform:translate(-50%,-50%) scale(.25)} 100%{opacity:0; transform:translate(-50%,-50%) scale(3.1)} }
      @keyframes spaceComet { 0%{transform:translate3d(-20vw,18vh,0) rotate(-12deg); opacity:0} 12%,70%{opacity:.38} 100%{transform:translate3d(120vw,-22vh,0) rotate(-12deg); opacity:0} }
      @keyframes spaceWhisper { 0%,75%,100%{opacity:0; transform:translateY(8px)} 82%,94%{opacity:1; transform:translateY(0)} }
      @keyframes spaceIntroCrawl { 0%{transform:rotateX(24deg) translateY(70%); opacity:0} 9%{opacity:1} 78%{opacity:1} 100%{transform:rotateX(24deg) translateY(-95%) scale(.72); opacity:0} }
      .space-root, .space-stage { touch-action: none; overscroll-behavior: none; -webkit-user-select: none; user-select: none; }
      .space-stage { -webkit-overflow-scrolling: auto; }
      .space-stage:active { cursor: grabbing; }
    `}</style>
  );
}
