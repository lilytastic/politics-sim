export interface Stat {
  label: string;
  icon: string;
  color: string;
  opposed?: string;
  isNegative?: boolean;
  description?: string;
}

export const stats: {[id: string]: Stat} = {
  'capital': {
    label: 'Capital',
    icon: 'handshake',
    color: 'crimson'
  },
  'faith': {
    label: 'Purpose',
    opposed: 'disobedience',
    icon: 'praying-hands',
    color: 'MEDIUMPURPLE'
  },
  'joy': {
    label: 'Pleasure',
    opposed: 'poverty',
    icon: 'glass-cheers',
    color: 'darkorange'
  },
  'education': {
    label: 'Education',
    opposed: 'ignorance',
    icon: 'book',
    color: 'cadetblue'
  },
  'vigilance': {
    label: 'Vigilance',
    opposed: 'threat',
    icon: 'shield-alt',
    color: 'ROYALBLUE'
  },
  'disobedience': {
    label: 'Disobedience',
    color: 'INDIANRED',
    opposed: 'faith',
    description: `Our own people are secretly wishing for our fall.`,
    icon: 'fist-raised',
    isNegative: true,
  },
  'poverty': {
    label: 'Squalor',
    color: 'darkgoldenrod',
    opposed: 'joy',
    description: `The people wallow in poverty and debt, easy prey for criminals and slavers.`,
    icon: 'balance-scale-right',
    isNegative: true,
  },
  'ignorance': {
    label: 'Ignorance',
    color: 'silver',
    opposed: 'education',
    description: `People have given themselves over to lies, stubbornness, and outright stupidity.`,
    icon: 'eye-slash',
    isNegative: true,
  },
  'threat': {
    label: 'Danger',
    color: '#CA2E2E',
    opposed: 'vigilance',
    description: `Our enemies are gathering, inside and out.`,
    icon: 'crosshairs',
    isNegative: true,
  }
}
