export default function Icon({ name, size = 18, strokeWidth = 1.8, style }) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
    style,
  }
  const paths = {
    drop:     <path d="M12 2.5 C 12 2.5, 5 10, 5 15 a 7 7 0 0 0 14 0 c 0 -5 -7 -12.5 -7 -12.5 z" />,
    cow:      <><path d="M5 10 C 5 6, 8 4, 12 4 s 7 2, 7 6 v 6 a 4 4 0 0 1 -4 4 H 9 a 4 4 0 0 1 -4 -4 z" /><circle cx="9" cy="11" r=".7" fill="currentColor" /><circle cx="15" cy="11" r=".7" fill="currentColor" /><path d="M10 16 h 4" /></>,
    bolt:     <path d="M13 2 L 4 14 h 7 l -1 8 l 9 -12 h -7 z" />,
    leaf:     <><path d="M11 20 A 8 8 0 0 1 3 12 C 3 7, 7 3, 12 3 c 4 0, 8 0, 9 1 c 1 5 -2 16 -10 16 z" /><path d="M11 20 V 10" /></>,
    flask:    <><path d="M9 3 v 5 L 4 19 a 2 2 0 0 0 1.7 3 h 12.6 a 2 2 0 0 0 1.7 -3 L 15 8 V 3" /><path d="M8 3 h 8" /></>,
    wheat:    <><path d="M12 22 V 8" /><path d="M12 12 c -3 0 -5 -2 -5 -5 c 3 0 5 2 5 5 z" /><path d="M12 12 c 3 0 5 -2 5 -5 c -3 0 -5 2 -5 5 z" /><path d="M12 17 c -3 0 -5 -2 -5 -5 c 3 0 5 2 5 5 z" /><path d="M12 17 c 3 0 5 -2 5 -5 c -3 0 -5 2 -5 5 z" /></>,
    layers:   <><path d="M12 3 L 22 8 L 12 13 L 2 8 z" /><path d="M2 13 L 12 18 L 22 13" /><path d="M2 18 L 12 23 L 22 18" /></>,
    milk:     <><path d="M9 3 h 6 v 4 l 2 4 v 9 a 2 2 0 0 1 -2 2 H 9 a 2 2 0 0 1 -2 -2 v -9 l 2 -4 z" /><path d="M7 11 h 10" /></>,
    home:     <><path d="M3 11 L 12 3 l 9 8" /><path d="M5 10 v 10 a 1 1 0 0 0 1 1 h 4 v -7 h 4 v 7 h 4 a 1 1 0 0 0 1 -1 v -10" /></>,
    chart:    <><path d="M3 3 v 18 h 18" /><path d="M7 14 l 4 -5 l 3 3 l 5 -7" /></>,
    bar:      <><rect x="4" y="12" width="3" height="8" rx="1" /><rect x="10" y="6" width="3" height="14" rx="1" /><rect x="16" y="9" width="3" height="11" rx="1" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10 h 18" /><path d="M8 3 v 4" /><path d="M16 3 v 4" /></>,
    book:     <><path d="M4 4 a 2 2 0 0 1 2 -2 h 13 v 18 H 6 a 2 2 0 0 0 -2 2 z" /><path d="M4 4 v 18" /></>,
    table:    <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M3 10 h 18" /><path d="M3 15 h 18" /><path d="M9 5 v 14" /></>,
    history:  <><path d="M3 12 a 9 9 0 1 0 3 -6.7" /><path d="M3 4 v 5 h 5" /><path d="M12 7 v 5 l 3 2" /></>,
    upload:   <><path d="M12 3 v 12" /><path d="M7 8 l 5 -5 l 5 5" /><path d="M3 17 v 2 a 2 2 0 0 0 2 2 h 14 a 2 2 0 0 0 2 -2 v -2" /></>,
    download: <><path d="M12 3 v 12" /><path d="M7 10 l 5 5 l 5 -5" /><path d="M3 17 v 2 a 2 2 0 0 0 2 2 h 14 a 2 2 0 0 0 2 -2 v -2" /></>,
    refresh:  <><path d="M21 12 a 9 9 0 1 1 -3 -6.7" /><path d="M21 4 v 5 h -5" /></>,
    arrowUp:  <><path d="M12 19 V 5" /><path d="M5 12 l 7 -7 l 7 7" /></>,
    arrowDown:<><path d="M12 5 V 19" /><path d="M5 12 l 7 7 l 7 -7" /></>,
    search:   <><circle cx="11" cy="11" r="7" /><path d="M21 21 l -5 -5" /></>,
    info:     <><circle cx="12" cy="12" r="9" /><path d="M12 8 v 0.5" /><path d="M12 11 v 5" /></>,
    barn:     <><path d="M3 21 V 10 L 12 3 l 9 7 V 21" /><path d="M3 14 h 18" /><rect x="9" y="14" width="6" height="7" /></>,
    grass:    <><path d="M3 21 h 18" /><path d="M5 21 c 0 -4 1 -8 3 -10" /><path d="M9 21 c 0 -5 2 -10 4 -12" /><path d="M13 21 c 0 -4 2 -7 4 -9" /><path d="M17 21 c 0 -3 1 -5 2 -7" /></>,
    chevDown: <path d="M6 9 l 6 6 l 6 -6" />,
    chevRight:<path d="M9 6 l 6 6 l -6 6" />,
    plus:     <><path d="M12 5 v 14" /><path d="M5 12 h 14" /></>,
  }
  return <svg {...props}>{paths[name] || null}</svg>
}
