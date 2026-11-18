import React from 'react';

function createIcon(name, renderPaths) {
  const IconComponent = ({ size, className = 'w-4 h-4', strokeWidth = 2, ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      data-carlog-icon={name}
      className={className}
      {...props}
    >
      {renderPaths()}
    </svg>
  );
  IconComponent.displayName = `CarLog${name}`;
  return IconComponent;
}

export const AlertCircle = createIcon('AlertCircle', () => (
  <>
    <polygon points="8,2 16,2 22,8 22,16 16,22 8,22 2,16 2,8" />
    <line x1="12" y1="7" x2="12" y2="13" />
    <rect x="11.2" y="16.2" width="1.6" height="1.6" fill="currentColor" stroke="none" />
  </>
));

export const AlertTriangle = createIcon('AlertTriangle', () => (
  <>
    <polygon points="12,3 22,20 2,20" />
    <line x1="12" y1="9.5" x2="12" y2="14.5" />
    <rect x="11.2" y="16.6" width="1.6" height="1.6" fill="currentColor" stroke="none" />
  </>
));

export const Aperture = createIcon('Aperture', () => (
  <>
    <circle cx="12" cy="12" r="9.5" />
    <polygon points="12,7 16.5,10 15,15.5 9,15.5 7.5,10" />
    <line x1="12" y1="2.5" x2="12" y2="7" />
    <line x1="21" y1="9" x2="16.5" y2="10" />
    <line x1="17.5" y1="19.5" x2="15" y2="15.5" />
    <line x1="6.5" y1="19.5" x2="9" y2="15.5" />
    <line x1="3" y1="9" x2="7.5" y2="10" />
  </>
));

export const ArrowRight = createIcon('ArrowRight', () => (
  <>
    <line x1="4" y1="12" x2="19" y2="12" />
    <polyline points="13,6 19.5,12 13,18" />
  </>
));

export const ArrowUpDown = createIcon('ArrowUpDown', () => (
  <>
    <line x1="8" y1="4" x2="8" y2="19" />
    <polyline points="4.5,7.5 8,4 11.5,7.5" />
    <line x1="16" y1="20" x2="16" y2="5" />
    <polyline points="12.5,16.5 16,20 19.5,16.5" />
  </>
));

export const ArrowUpRight = createIcon('ArrowUpRight', () => (
  <>
    <line x1="6" y1="18" x2="18" y2="6" />
    <polyline points="9,6 18,6 18,15" />
  </>
));

export const Award = createIcon('Award', () => (
  <>
    <polygon points="12,2.5 18.5,6.2 18.5,13.5 12,17.2 5.5,13.5 5.5,6.2" />
    <polyline points="8.5,15.5 7,21.5 12,19 17,21.5 15.5,15.5" />
  </>
));

export const BookOpen = createIcon('BookOpen', () => (
  <>
    <path d="M2 5h7.5l2.5 2 2.5-2H22v14h-7.5L12 21l-2.5-2H2z" />
    <line x1="12" y1="7" x2="12" y2="21" />
    <line x1="5.5" y1="10" x2="8.5" y2="10" />
    <line x1="15.5" y1="10" x2="18.5" y2="10" />
  </>
));

export const Box = createIcon('Box', () => (
  <>
    <polygon points="12,2.5 21,7.5 21,16.5 12,21.5 3,16.5 3,7.5" />
    <polyline points="3,7.5 12,12.5 21,7.5" />
    <line x1="12" y1="12.5" x2="12" y2="21.5" />
  </>
));

export const Calendar = createIcon('Calendar', () => (
  <>
    <rect x="3" y="4.5" width="18" height="16.5" />
    <line x1="3" y1="9.5" x2="21" y2="9.5" />
    <line x1="8" y1="2.5" x2="8" y2="6.5" />
    <line x1="16" y1="2.5" x2="16" y2="6.5" />
  </>
));

export const Camera = createIcon('Camera', () => (
  <>
    <polygon points="3,7 7.5,7 9.5,4 14.5,4 16.5,7 21,7 21,20 3,20" />
    <polygon points="12,9.5 15.5,11.5 15.5,15.5 12,17.5 8.5,15.5 8.5,11.5" />
    <rect x="17" y="9.5" width="1.5" height="1.5" fill="currentColor" stroke="none" />
  </>
));

export const Car = createIcon('Car', () => (
  <>
    <polygon points="4,12 6.5,6.5 17.5,6.5 20,12 21.5,13 21.5,17.5 2.5,17.5 2.5,13" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <rect x="5" y="17.5" width="3" height="2" />
    <rect x="16" y="17.5" width="3" height="2" />
    <line x1="5.5" y1="14.5" x2="8" y2="14.5" />
    <line x1="16" y1="14.5" x2="18.5" y2="14.5" />
  </>
));

export const Check = createIcon('Check', () => (
  <polyline points="4.5,12.5 9.5,17.5 19.5,6.5" />
));

export const CheckCircle2 = createIcon('CheckCircle2', () => (
  <>
    <polygon points="8,2.5 16,2.5 21.5,8 21.5,16 16,21.5 8,21.5 2.5,16 2.5,8" />
    <polyline points="7.5,12.5 10.5,15.5 16.5,9" />
  </>
));

export const ChevronLeft = createIcon('ChevronLeft', () => (
  <polyline points="15,5 8,12 15,19" />
));

export const ChevronRight = createIcon('ChevronRight', () => (
  <polyline points="9,5 16,12 9,19" />
));

export const Clock = createIcon('Clock', () => (
  <>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12,7 12,12.5 16,14.5" />
  </>
));

export const Cloud = createIcon('Cloud', () => (
  <polygon points="6.5,18.5 18,18.5 21,15.5 20.5,11.5 17,10.5 14.5,6 9,6 6.5,10 3.5,12 3.5,16" />
));

export const Compass = createIcon('Compass', () => (
  <>
    <circle cx="12" cy="12" r="9.5" />
    <polygon points="15.8,8.2 13.8,13.8 8.2,15.8 10.2,10.2" />
  </>
));

export const Cpu = createIcon('Cpu', () => (
  <>
    <rect x="6" y="6" width="12" height="12" />
    <rect x="10" y="10" width="4" height="4" />
    <line x1="9" y1="2.5" x2="9" y2="6" />
    <line x1="15" y1="2.5" x2="15" y2="6" />
    <line x1="9" y1="18" x2="9" y2="21.5" />
    <line x1="15" y1="18" x2="15" y2="21.5" />
    <line x1="2.5" y1="9" x2="6" y2="9" />
    <line x1="2.5" y1="15" x2="6" y2="15" />
    <line x1="18" y1="9" x2="21.5" y2="9" />
    <line x1="18" y1="15" x2="21.5" y2="15" />
  </>
));

export const Crown = createIcon('Crown', () => (
  <>
    <polygon points="3,18 3,8 8,12 12,5 16,12 21,8 21,18" />
    <line x1="3" y1="20.5" x2="21" y2="20.5" />
  </>
));

export const ExternalLink = createIcon('ExternalLink', () => (
  <>
    <polyline points="14,4 20,4 20,10" />
    <line x1="11" y1="13" x2="20" y2="4" />
    <polyline points="18,14 18,20 4,20 4,6 10,6" />
  </>
));

export const Eye = createIcon('Eye', () => (
  <>
    <polygon points="2,12 7,6.5 17,6.5 22,12 17,17.5 7,17.5" />
    <circle cx="12" cy="12" r="2.8" />
  </>
));

export const Filter = createIcon('Filter', () => (
  <polygon points="3,4.5 21,4.5 14,13 14,19.5 10,17.5 10,13" />
));

export const Flame = createIcon('Flame', () => (
  <>
    <polygon points="12,2.5 18.5,10 17.5,17.5 12,21.5 6.5,17.5 5.5,11 9.5,13 10.5,7.5" />
    <polyline points="10.5,17.5 12,14 14,17.5" />
  </>
));

export const Fuel = createIcon('Fuel', () => (
  <>
    <rect x="4" y="4" width="10" height="16" />
    <line x1="4" y1="10" x2="14" y2="10" />
    <polyline points="14,9 18,9 19.5,11 19.5,18 17.5,18" />
    <line x1="2.5" y1="20" x2="15.5" y2="20" />
  </>
));

export const Gauge = createIcon('Gauge', () => (
  <>
    <path d="M3.5 16.5A9.5 9.5 0 1 1 20.5 16.5" />
    <line x1="12" y1="14" x2="16.5" y2="9.5" />
    <rect x="10.8" y="12.8" width="2.4" height="2.4" />
    <line x1="5" y1="16.5" x2="19" y2="16.5" />
  </>
));

export const Globe = createIcon('Globe', () => (
  <>
    <circle cx="12" cy="12" r="9.5" />
    <ellipse cx="12" cy="12" rx="4.2" ry="9.5" />
    <line x1="2.5" y1="12" x2="21.5" y2="12" />
  </>
));

export const HardDrive = createIcon('HardDrive', () => (
  <>
    <polygon points="5,5 19,5 21,14 3,14" />
    <rect x="3" y="14" width="18" height="5" />
    <line x1="15" y1="16.5" x2="18" y2="16.5" />
  </>
));

export const Heart = createIcon('Heart', () => (
  <polygon points="12,20.5 3.5,12 3.5,6.5 7.5,4 12,7.5 16.5,4 20.5,6.5 20.5,12" />
));

export const Image = createIcon('Image', () => (
  <>
    <rect x="3" y="4" width="18" height="16" />
    <polyline points="4.5,17 9.5,11.5 13.5,15 16.5,12.5 19.5,17" />
    <rect x="7.5" y="7.5" width="2.2" height="2.2" />
  </>
));

export const Info = createIcon('Info', () => (
  <>
    <polygon points="8,2.5 16,2.5 21.5,8 21.5,16 16,21.5 8,21.5 2.5,16 2.5,8" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <rect x="11.2" y="7.2" width="1.6" height="1.6" fill="currentColor" stroke="none" />
  </>
));

export const Key = createIcon('Key', () => (
  <>
    <polygon points="7.5,7.5 11.5,11.5 7.5,15.5 3.5,11.5" />
    <line x1="11.5" y1="11.5" x2="20.5" y2="11.5" />
    <line x1="17" y1="11.5" x2="17" y2="15" />
    <line x1="20" y1="11.5" x2="20" y2="14.5" />
  </>
));

export const Laptop = createIcon('Laptop', () => (
  <>
    <rect x="4" y="4.5" width="16" height="11" />
    <polygon points="2,18.5 4,15.5 20,15.5 22,18.5" />
  </>
));

export const Layers = createIcon('Layers', () => (
  <>
    <polygon points="12,3 21,8 12,13 3,8" />
    <polyline points="3,12.5 12,17.5 21,12.5" />
    <polyline points="3,16.5 12,21.5 21,16.5" />
  </>
));

export const LayoutGrid = createIcon('LayoutGrid', () => (
  <>
    <rect x="3.5" y="3.5" width="7" height="7" />
    <rect x="13.5" y="3.5" width="7" height="7" />
    <rect x="3.5" y="13.5" width="7" height="7" />
    <rect x="13.5" y="13.5" width="7" height="7" />
  </>
));

export const LocateFixed = createIcon('LocateFixed', () => (
  <>
    <circle cx="12" cy="12" r="6.5" />
    <rect x="10.5" y="10.5" width="3" height="3" fill="currentColor" stroke="none" />
    <line x1="12" y1="2.5" x2="12" y2="5.5" />
    <line x1="12" y1="18.5" x2="12" y2="21.5" />
    <line x1="2.5" y1="12" x2="5.5" y2="12" />
    <line x1="18.5" y1="12" x2="21.5" y2="12" />
  </>
));

export const Lock = createIcon('Lock', () => (
  <>
    <rect x="4.5" y="10.5" width="15" height="10" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    <line x1="12" y1="14.5" x2="12" y2="16.8" />
  </>
));

export const LogOut = createIcon('LogOut', () => (
  <>
    <polyline points="10,4 4,4 4,20 10,20" />
    <line x1="9" y1="12" x2="20" y2="12" />
    <polyline points="15.5,7.5 20,12 15.5,16.5" />
  </>
));

export const Mail = createIcon('Mail', () => (
  <>
    <rect x="3" y="5" width="18" height="14" />
    <polyline points="3,6.5 12,13 21,6.5" />
  </>
));

export const MapPin = createIcon('MapPin', () => (
  <>
    <polygon points="12,21.5 5.5,12.5 5.5,7 9,3.5 15,3.5 18.5,7 18.5,12.5" />
    <rect x="10.2" y="7.8" width="3.6" height="3.6" />
  </>
));

export const Monitor = createIcon('Monitor', () => (
  <>
    <rect x="3" y="4" width="18" height="12.5" />
    <line x1="12" y1="16.5" x2="12" y2="20" />
    <line x1="8" y1="20" x2="16" y2="20" />
  </>
));

export const Moon = createIcon('Moon', () => (
  <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8.2 8.2 0 1 0 10 10z" />
));

export const Navigation = createIcon('Navigation', () => (
  <polygon points="3.5,11 20.5,3.5 13,20.5 11,13" />
));

export const Palette = createIcon('Palette', () => (
  <>
    <polygon points="12,3 20,7 21,14 16,20.5 9,20 3.5,14.5 4.5,7" />
    <rect x="8" y="8" width="2" height="2" fill="currentColor" stroke="none" />
    <rect x="13.5" y="7.5" width="2" height="2" fill="currentColor" stroke="none" />
    <rect x="15.5" y="12.5" width="2" height="2" fill="currentColor" stroke="none" />
    <rect x="8.5" y="14" width="3" height="3" />
  </>
));

export const Plus = createIcon('Plus', () => (
  <>
    <line x1="12" y1="4.5" x2="12" y2="19.5" />
    <line x1="4.5" y1="12" x2="19.5" y2="12" />
  </>
));

export const QrCode = createIcon('QrCode', () => (
  <>
    <rect x="3.5" y="3.5" width="6.5" height="6.5" />
    <rect x="14" y="3.5" width="6.5" height="6.5" />
    <rect x="3.5" y="14" width="6.5" height="6.5" />
    <polyline points="14,14 17.5,14 17.5,17.5 20.5,17.5 20.5,20.5 14,20.5" />
  </>
));

export const Radio = createIcon('Radio', () => (
  <>
    <rect x="10.2" y="10.2" width="3.6" height="3.6" />
    <polyline points="7,7 4.5,9.5 4.5,14.5 7,17" />
    <polyline points="17,7 19.5,9.5 19.5,14.5 17,17" />
    <line x1="12" y1="14" x2="12" y2="21" />
  </>
));

export const RefreshCw = createIcon('RefreshCw', () => (
  <>
    <polyline points="20,4.5 20,9.5 15,9.5" />
    <path d="M20 9.5A8.5 8.5 0 0 0 5.5 6.5" />
    <polyline points="4,19.5 4,14.5 9,14.5" />
    <path d="M4 14.5A8.5 8.5 0 0 0 18.5 17.5" />
  </>
));

export const RotateCw = createIcon('RotateCw', () => (
  <>
    <polyline points="20,4.5 20,10 14.5,10" />
    <path d="M20 10A8.5 8.5 0 1 0 17.8 18" />
  </>
));

export const Rows3 = createIcon('Rows3', () => (
  <>
    <rect x="3.5" y="4" width="17" height="4" />
    <rect x="3.5" y="10" width="17" height="4" />
    <rect x="3.5" y="16" width="17" height="4" />
  </>
));

export const ScanLine = createIcon('ScanLine', () => (
  <>
    <polyline points="3.5,8 3.5,4 7.5,4" />
    <polyline points="16.5,4 20.5,4 20.5,8" />
    <polyline points="3.5,16 3.5,20 7.5,20" />
    <polyline points="16.5,20 20.5,20 20.5,16" />
    <line x1="4.5" y1="12" x2="19.5" y2="12" />
  </>
));

export const Search = createIcon('Search', () => (
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="15.5" y1="15.5" x2="20.5" y2="20.5" />
  </>
));

export const Settings = createIcon('Settings', () => (
  <>
    <polygon points="9.5,3 14.5,3 16,6 19.5,7 21,11.5 18.5,14.5 19,18 15,20.5 12,19 9,20.5 5,18 5.5,14.5 3,11.5 4.5,7 8,6" />
    <circle cx="12" cy="12" r="3" />
  </>
));

export const Shield = createIcon('Shield', () => (
  <polygon points="12,2.5 20,5.5 19,14 12,21.5 5,14 4,5.5" />
));

export const ShieldAlert = createIcon('ShieldAlert', () => (
  <>
    <polygon points="12,2.5 20,5.5 19,14 12,21.5 5,14 4,5.5" />
    <line x1="12" y1="7.5" x2="12" y2="13" />
    <rect x="11.2" y="15.5" width="1.6" height="1.6" fill="currentColor" stroke="none" />
  </>
));

export const ShieldCheck = createIcon('ShieldCheck', () => (
  <>
    <polygon points="12,2.5 20,5.5 19,14 12,21.5 5,14 4,5.5" />
    <polyline points="8.5,12 11,14.5 16,9.5" />
  </>
));

export const Sliders = createIcon('Sliders', () => (
  <>
    <line x1="5" y1="4" x2="5" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
    <line x1="19" y1="4" x2="19" y2="20" />
    <line x1="3" y1="14" x2="7" y2="14" />
    <line x1="10" y1="8.5" x2="14" y2="8.5" />
    <line x1="17" y1="15.5" x2="21" y2="15.5" />
  </>
));

export const SlidersHorizontal = createIcon('SlidersHorizontal', () => (
  <>
    <line x1="4" y1="6.5" x2="20" y2="6.5" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17.5" x2="20" y2="17.5" />
    <line x1="14" y1="4" x2="14" y2="9" />
    <line x1="8" y1="9.5" x2="8" y2="14.5" />
    <line x1="15" y1="15" x2="15" y2="20" />
  </>
));

export const Smartphone = createIcon('Smartphone', () => (
  <>
    <rect x="6.5" y="2.5" width="11" height="19" />
    <line x1="10.5" y1="18" x2="13.5" y2="18" />
  </>
));

export const Sparkles = createIcon('Sparkles', () => (
  <>
    <polygon points="12,3 14,9.5 20.5,11.5 14,13.5 12,20 10,13.5 3.5,11.5 10,9.5" />
  </>
));

export const Star = createIcon('Star', () => (
  <polygon points="12,3 14.8,9 21.2,9.8 16.5,14.2 17.8,20.5 12,17.4 6.2,20.5 7.5,14.2 2.8,9.8 9.2,9" />
));

export const Sun = createIcon('Sun', () => (
  <>
    <circle cx="12" cy="12" r="4.2" />
    <line x1="12" y1="2.5" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="21.5" />
    <line x1="2.5" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="21.5" y2="12" />
    <line x1="5.2" y1="5.2" x2="7" y2="7" />
    <line x1="17" y1="17" x2="18.8" y2="18.8" />
    <line x1="18.8" y1="5.2" x2="17" y2="7" />
    <line x1="7" y1="17" x2="5.2" y2="18.8" />
  </>
));

export const Tablet = createIcon('Tablet', () => (
  <>
    <rect x="4.5" y="2.5" width="15" height="19" />
    <line x1="10.5" y1="18" x2="13.5" y2="18" />
  </>
));

export const Target = createIcon('Target', () => (
  <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" />
    <rect x="11" y="11" width="2" height="2" fill="currentColor" stroke="none" />
  </>
));

export const Trash2 = createIcon('Trash2', () => (
  <>
    <line x1="4" y1="6" x2="20" y2="6" />
    <polyline points="9,6 9,3.5 15,3.5 15,6" />
    <polygon points="6,6 18,6 17,20.5 7,20.5" />
    <line x1="10" y1="10" x2="10" y2="16.5" />
    <line x1="14" y1="10" x2="14" y2="16.5" />
  </>
));

export const Trophy = createIcon('Trophy', () => (
  <>
    <polygon points="6,4 18,4 16.5,12.5 12,15 7.5,12.5" />
    <polyline points="6,6 3,6 3,10.5 6.8,11.5" />
    <polyline points="18,6 21,6 21,10.5 17.2,11.5" />
    <line x1="12" y1="15" x2="12" y2="19.5" />
    <line x1="7.5" y1="20" x2="16.5" y2="20" />
  </>
));

export const Upload = createIcon('Upload', () => (
  <>
    <line x1="12" y1="15.5" x2="12" y2="4.5" />
    <polyline points="7,9.5 12,4.5 17,9.5" />
    <polyline points="4,15.5 4,19.5 20,19.5 20,15.5" />
  </>
));

export const User = createIcon('User', () => (
  <>
    <polygon points="12,3.5 15.5,5.5 15.5,9.5 12,11.5 8.5,9.5 8.5,5.5" />
    <polygon points="5,20.5 6.5,15 17.5,15 19,20.5" />
  </>
));

export const UserCheck = createIcon('UserCheck', () => (
  <>
    <polygon points="9.5,4 12.5,6 12.5,9.5 9.5,11.5 6.5,9.5 6.5,6" />
    <polygon points="3.5,20 4.8,15 14.2,15 15.5,20" />
    <polyline points="16,11.5 18,13.5 21.5,9.5" />
  </>
));

export const Volume2 = createIcon('Volume2', () => (
  <>
    <polygon points="3.5,9.5 8,9.5 13,5 13,19 8,14.5 3.5,14.5" />
    <polyline points="16.5,8.5 18.5,10.5 18.5,13.5 16.5,15.5" />
    <polyline points="19,6 21.5,8.5 21.5,15.5 19,18" />
  </>
));

export const Warehouse = createIcon('Warehouse', () => (
  <>
    <polygon points="2.5,9.5 12,4 21.5,9.5 21.5,20 2.5,20" />
    <polyline points="7,20 7,12 17,12 17,20" />
    <line x1="7" y1="15.5" x2="17" y2="15.5" />
  </>
));

export const Wind = createIcon('Wind', () => (
  <>
    <polyline points="3,9 17.5,9 19.5,7 17.5,5 15.5,7" />
    <line x1="3" y1="13" x2="21" y2="13" />
    <polyline points="3,17 15,17 16.5,18.5 15,20 13.5,18.5" />
  </>
));

export const Wrench = createIcon('Wrench', () => (
  <>
    <polygon points="15.5,3.5 19,4.5 16.5,7 17.5,8.5 20,6 21,9.5 17.5,13 13.5,12 6,19.5 3.5,17 11,9.5 10,5.5 13.5,2.5" />
  </>
));

export const X = createIcon('X', () => (
  <>
    <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
    <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" />
  </>
));

export const Zap = createIcon('Zap', () => (
  <polygon points="13.5,2.5 5,13 11.5,13 10.5,21.5 19,11 12.5,11" />
));
