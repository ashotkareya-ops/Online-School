import React from 'react';

const WaveLayout = ({ children }) => {
  const svgContent = (
    <>
      <path d="M 0,700 L 0,405 C 105.03,431.94 210.06,458.88 284,448 C 357.93,437.11 400.78,388.4 476,351 C 551.21,313.59 658.8,287.5 741,251 C 823.2,214.5 880.01,167.59 943,134 C 1005.98,100.4 1075.13,80.11 1159,65 C 1242.86,49.88 1341.43,39.94 1440,30 L 1440,700 L 0,700 Z" fill="#00d084" fillOpacity="0.265" />
      <path d="M 0,700 L 0,545 C 66.68,571.79 133.36,598.59 220,577 C 306.63,555.4 413.2,485.4 506,438 C 598.79,390.59 677.8,365.76 753,346 C 828.2,326.23 899.59,311.52 979,294 C 1058.4,276.47 1145.83,256.13 1224,235 C 1302.16,213.86 1371.08,191.93 1440,170 L 1440,700 L 0,700 Z" fill="#00d084" fillOpacity="0.4" />
      <path d="M 0,700 L 0,685 C 77.66,713.48 155.32,741.97 229,723 C 302.67,704.02 372.36,637.58 453,603 C 533.63,568.41 625.2,565.7 719,530 C 812.8,494.3 908.83,425.61 994,413 C 1079.16,400.38 1153.47,443.82 1226,436 C 1298.52,428.17 1369.26,369.08 1440,310 L 1440,700 L 0,700 Z" fill="#00d084" fillOpacity="0.53" />
      <path d="M 0,700 L 0,825 C 94.09,838.9 188.19,852.8 266,834 C 343.8,815.19 405.31,763.67 466,739 C 526.68,714.32 586.53,716.5 675,705 C 763.46,693.5 880.54,668.32 971,633 C 1061.45,597.67 1125.27,552.19 1199,520 C 1272.72,487.8 1356.36,468.9 1440,450 L 1440,700 L 0,700 Z" fill="#00d084" />
    </>
  );

  return (
    <div style={styles.wrapper}>
      
      <div style={{ ...styles.waveContainer, backgroundColor: 'white' }}>
        <svg 
          viewBox="0 0 1440 700" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ ...styles.svg, transform: 'rotate(180deg)' }}
        >
          {svgContent}
        </svg>
      </div>

      <main style={styles.main}>
        {children}
      </main>

      <div style={{ ...styles.waveContainer, backgroundColor: 'white' }}>
        <svg 
          viewBox="0 0 1440 700" 
          xmlns="http://www.w3.org/2000/svg" 
          style={styles.svg}
        >
          {svgContent}
        </svg>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    margin: 0,
    padding: 0,
    backgroundColor: 'white',
    overflowX: 'hidden',
  },
  waveContainer: {
    width: '100%',
    lineHeight: 0, 
    overflow: 'hidden',
    flexShrink: 0,
  },
  svg: {
    display: 'block',
    width: '100%',
    height: 'auto',
  },
  main: {
    flex: '1 0 auto', 
    width: '100%',
    margin: 0,
    padding: 0,
  }
};

export default WaveLayout;