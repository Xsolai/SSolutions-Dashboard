// Einheitliche Stil-Definitionen für alle Dashboards
export const dashboardStyles = {
  // Schriftarten
  fonts: {
    book: 'font-nexa-book',
    black: 'font-nexa-black'
  },
  
  // Text-Größen
  textSizes: {
    // Überschriften
    pageTitle: 'text-[42px] leading-[54px]',    // Haupttitel der Seite
    sectionTitle: 'text-[26px] leading-[36px]', // Abschnittstitel
    cardTitle: 'text-[20px] leading-[30px]',    // Chart-Karten Titel
    statTitle: 'text-[16px] leading-[26px]',    // StatCard Titel
    
    // Werte
    statValue: 'text-[30px] leading-[38px]',    // Große Zahlen in StatCards
    chartLabel: 'text-[14px] leading-[24px]',   // Chart Beschriftungen
    
    // Beschreibungen
    body: 'text-[17px] leading-[27px]',         // Normaler Text
    description: 'text-[14px] leading-[24px]',  // Beschreibungen
    small: 'text-[12px] leading-[20px]',        // Kleine Texte
    
    // Badges/Tags
    badge: 'text-xs',                            // Badges und Tags
  },
  
  // Farben
  colors: {
    primary: '#F0B72F',      // SolaGelb
    secondary: '#001E4A',    // SolaBlau
    tertiary: '#E6E2DF',     // SolaGrau
    text: {
      primary: '#001E4A',
      secondary: '#001E4A/70',
      tertiary: '#001E4A/50'
    }
  },
  
  // Komponenten-Stile
  components: {
    statCard: {
      container: 'group bg-white p-6 rounded-2xl border border-[#E6E2DF] hover:border-[#F0B72F] transition-all duration-500 hover:shadow-2xl hover:shadow-[#F0B72F]/15 hover:-translate-y-2 transform-gpu',
      title: 'text-[16px] leading-[26px] font-nexa-black text-[#001E4A] group-hover:text-[#F0B72F] transition-colors duration-300 tracking-tight',
      value: 'text-[30px] leading-[38px] font-nexa-black text-[#001E4A] tracking-tight',
      description: 'text-[14px] leading-[24px] font-nexa-book text-[#001E4A]/70',
      icon: 'p-3 bg-gradient-to-br from-[#F0B72F]/15 via-[#F0B72F]/8 to-[#F0B72F]/5 rounded-xl group-hover:from-[#F0B72F]/25 group-hover:to-[#F0B72F]/10 transition-all duration-500 shadow-lg shadow-[#F0B72F]/10 group-hover:shadow-xl group-hover:shadow-[#F0B72F]/20',
      badge: 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-nexa-black transition-all duration-300 shadow-sm'
    },
    
    chartCard: {
      container: 'bg-white rounded-2xl border border-[#E6E2DF] hover:border-[#F0B72F] transition-all duration-500 hover:shadow-2xl hover:shadow-[#F0B72F]/20 p-4 sm:p-6',
      title: 'text-[20px] leading-[30px] font-nexa-black text-[#001E4A] tracking-tight',
      icon: 'p-3 bg-gradient-to-br from-[#F0B72F]/15 to-[#F0B72F]/5 rounded-xl transition-all duration-500 shadow-lg shadow-[#F0B72F]/10'
    },
    
    tooltip: {
      container: 'bg-white/95 backdrop-blur-sm border border-[#E6E2DF] rounded-xl shadow-lg p-4 min-w-[200px]',
      title: 'font-nexa-black text-[#001E4A] mb-3 text-base border-b border-[#E6E2DF] pb-2',
      label: 'text-[#001E4A]/70 font-nexa-book text-sm',
      value: 'text-[#001E4A] font-nexa-black text-sm'
    }
  }
};

// Export für Chart-Konfiguration
export const chartConfig = {
  xAxis: {
    tick: {
      fill: '#001E4A',
      fontSize: '12px',
      fontFamily: 'Nexa-Book'
    },
    axisLine: { stroke: '#E6E2DF' }
  },
  yAxis: {
    tick: {
      fill: '#001E4A',
      fontSize: '12px',
      fontFamily: 'Nexa-Book'
    },
    axisLine: { stroke: '#E6E2DF' },
    grid: { stroke: '#E6E2DF', strokeDasharray: '3 3' }
  },
  legend: {
    wrapperStyle: {
      fontFamily: 'Nexa-Book',
      fontSize: '14px',
      color: '#001E4A'
    }
  }
}; 