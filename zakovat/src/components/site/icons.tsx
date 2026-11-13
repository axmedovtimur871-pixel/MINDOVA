// Small inline icon set (stroke icons) – avoids an icon dependency.
type P = { className?: string };
const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const IconArrowRight = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const IconShield = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>);
export const IconQr = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><rect x="3.5" y="3.5" width="6" height="6" rx="1" /><rect x="14.5" y="3.5" width="6" height="6" rx="1" /><rect x="3.5" y="14.5" width="6" height="6" rx="1" /><path d="M14.5 14.5h2.5v2.5M20.5 14.5v.01M14.5 20.5h.01M17.5 20.5h3v-3" /></svg>);
export const IconCalendar = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>);
export const IconPin = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0113 0c0 5.3-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>);
export const IconPhone = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 005.3 5.3l1.4-2.2L19 14.5V18a2 2 0 01-2 2A14 14 0 013 6a2 2 0 012-2z" /></svg>);
export const IconMail = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="M4 7l8 6 8-6" /></svg>);
export const IconClock = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>);
export const IconMenu = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const IconClose = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const IconDownload = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M12 4v11M7 10l5 5 5-5M5 19.5h14" /></svg>);
export const IconCheck = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>);
export const IconX = IconClose;
export const IconSearch = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>);
export const IconCamera = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M4 8.5A1.5 1.5 0 015.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0120 8.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17.5v-9z" /><circle cx="12" cy="13" r="3.5" /></svg>);
export const IconAlert = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M12 4l9 16H3l9-16z" /><path d="M12 10v4M12 17v.01" /></svg>);
export const IconExternal = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /></svg>);

export const IconTelegram = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M21.4 4.2L2.9 11.3c-1.3.5-1.3 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.2-2.1 4.6 3.4c.8.5 1.4.2 1.6-.8l3-14.2c.3-1.3-.5-1.8-1.3-1.4zM8.3 14l9.7-6.1c.5-.3.9-.1.5.2l-8.1 7.3-.3 3.4L8.3 14z" /></svg>);
export const IconInstagram = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} {...s}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.2 6.8v.01" /></svg>);
export const IconYoutube = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M21.6 7.2a2.5 2.5 0 00-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 002.4 7.2 26 26 0 002 12a26 26 0 00.4 4.8 2.5 2.5 0 001.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 001.8-1.8A26 26 0 0022 12a26 26 0 00-.4-4.8zM10 15V9l5.2 3L10 15z" /></svg>);
export const IconFacebook = ({ className }: P) => (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" /></svg>);
