export const stats: {[id: string]: any} = {
  'capital': {
    label: 'Capital',
    icon: 'handshake',
    color: 'crimson'
  },
  'faith': {
    label: 'Purpose',
    icon: 'praying-hands',
    color: 'MEDIUMPURPLE'
  },
  'joy': {
    label: 'Pleasure',
    icon: 'glass-cheers',
    color: 'darkorange'
  },
  'education': {
    label: 'Education',
    icon: 'book',
    color: 'cadetblue'
  },
  'vigilance': {
    label: 'Vigilance',
    icon: 'shield-alt',
    color: 'ROYALBLUE'
  },
  'disobedience': {
    name: 'Disobedience',
    color: 'INDIANRED',
    description: `Our own people are secretly wishing for our fall.`,
    icon: 'fist-raised',
    type: 'level',
    isNegative: true,
    isLoose: false
  },
  'poverty': {
    name: 'Squalor',
    color: 'darkgoldenrod',
    description: `The people wallow in poverty and debt, easy prey for criminals and slavers.`,
    icon: 'balance-scale-right',
    isNegative: true,
  },
  'ignorance': {
    name: 'Ignorance',
    color: 'silver',
    description: `People have given themselves over to lies, stubbornness, and outright stupidity.`,
    icon: 'eye-slash',
    isNegative: true,
  },
  'threat': {
    name: 'Danger',
    color: '#CA2E2E',
    description: `Our enemies are gathering, inside and out.`,
    icon: 'crosshairs',
    isNegative: true,
  }
}
