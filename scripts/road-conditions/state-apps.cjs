// state-apps.cjs — each state's official DOT road conditions app, for the "Official source"
// card on /road-conditions/<state>/ (gen-road-conditions-pages.js). Written 2026-10-16 from
// the app repo's docs/content/state-dot-apps-2026-10-16.csv (App Store and Play research).
//
// `app` = the app's name; the page says "<State>'s official road conditions app is <app>."
// `line` = the whole line for a state without a DOT app of its own: where the DOT points
// drivers instead, and any other agency's app (NJ, TN). One fact. No ratings, no judgment
// of the app, no claims about which store carries what. No store links until the App Store /
// Play URL is verified. ChatGPT review 2026-10-16 corrected NJ, HI and MI.
module.exports = {
  AL: { app: 'ALGO Traffic' },
  AK: { app: '511 Alaska' },
  AZ: { app: '511 Arizona' },
  AR: { app: 'IDrive Arkansas' },
  CA: { app: 'Caltrans QuickMap' },
  CO: { app: 'COtrip Planner' },
  CT: { line: 'Connecticut has no official road conditions app. CTDOT points drivers to the CTroads.org website.' },
  DE: { app: 'DelDOT' },
  FL: { app: 'Florida 511' },
  GA: { app: '511 Georgia' },
  HI: { line: 'Hawaii has no official road conditions app. HDOT points drivers to the GoAkamai.org website.' },
  ID: { app: 'Idaho 511' },
  IL: { line: 'Illinois has no official road conditions app. IDOT points drivers to the GettingAroundIllinois.com website.' },
  IN: { app: 'INDOT Trafficwise' },
  IA: { app: 'Iowa 511' },
  KS: { app: 'KanDrive' },
  KY: { line: 'Kentucky has had no official road conditions app since 2016. KYTC points drivers to the GoKY website and Waze.' },
  LA: { app: 'Louisiana 511' },
  ME: { line: 'Maine has no official road conditions app. MaineDOT points drivers to the New England 511 website.' },
  MD: { line: 'Maryland has no official road conditions app. The state points drivers to the CHART website.' },
  MA: { app: 'Mass511' },
  MI: { line: 'Michigan has no official road conditions app. MDOT points drivers to the Mi Drive website.' },
  MN: { app: 'Minnesota 511' },
  MS: { app: 'MDOT Traffic' },
  MO: { app: 'MoDOT Traveler Information' },
  MT: { app: 'MDT 511 Travel Info' },
  NE: { app: 'Nebraska 511' },
  NV: { app: 'Nevada 511' },
  NH: { line: 'New Hampshire has no official road conditions app. NHDOT points drivers to the New England 511 website.' },
  NJ: { line: 'NJDOT points drivers to the 511NJ website. The New Jersey Turnpike Authority also offers the SafeTripNJ app, with traffic alerts, a traffic map and cameras.' }, // njta.gov/travel-resources/safetripnj-app, read 2026-10-16
  NM: { app: 'NMRoads' },
  NY: { app: '511NY' },
  NC: { app: 'DriveNC' },
  ND: { app: 'NDRoads' },
  OH: { app: 'OHGO' },
  OK: { app: 'Drive Oklahoma' },
  OR: { line: 'Oregon has no official road conditions app. ODOT points drivers to TripCheck.com and 511 by phone.' },
  PA: { app: '511PA' },
  RI: { line: 'Rhode Island has no official road conditions app. RIDOT points drivers to its dot.ri.gov/travel website.' },
  SC: { app: '511 South Carolina Traffic' },
  SD: { app: 'SDDOT 511' },
  TN: { line: 'Tennessee has no standalone road conditions app. Traffic is a section of the state\'s MyTN app, and TDOT points drivers to the SmartWay website.' },
  TX: { app: 'DriveTexas' },
  UT: { app: 'UDOT Traffic' },
  VT: { line: 'Vermont has no official road conditions app. VTrans points drivers to the New England 511 website.' },
  VA: { app: 'VDOT 511 Virginia Traffic' },
  WA: { app: 'WSDOT' },
  WV: { app: 'WV 511 Drive Safe' },
  WI: { app: '511 Wisconsin' },
  WY: { app: 'Wyoming 511' },
};
