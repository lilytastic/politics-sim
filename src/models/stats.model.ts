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
  'purpose': {
    label: 'Purpose',
    opposed: 'dignity',
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
  'oppression': {
    label: 'Oppression',
    opposed: 'freedom',
    icon: 'link',
    color: 'grey'
  },
  'vigilance': {
    label: 'Vigilance',
    opposed: 'threat',
    icon: 'shield-alt',
    color: 'ROYALBLUE'
  },
  'dignity': {
    label: 'Dignity',
    color: 'INDIANRED',
    opposed: 'purpose',
    description: `Our people are empowered, free-thinking, and disobedient.`,
    icon: 'fist-raised'
  },
  'poverty': {
    label: 'Squalor',
    color: 'darkgoldenrod',
    opposed: 'joy',
    description: `The people wallow in poverty and debt, easy prey for criminals and slavers.`,
    icon: 'balance-scale-right'
  },
  'ignorance': {
    label: 'Ignorance',
    color: 'silver',
    opposed: 'education',
    description: `People have given themselves over to lies, stubbornness, and outright stupidity.`,
    icon: 'eye-slash'
  },
  'threat': {
    label: 'Danger',
    color: '#CA2E2E',
    opposed: 'vigilance',
    description: `Our enemies are gathering, inside and out.`,
    icon: 'crosshairs'
  },
  'votes': {
    label: 'Votes',
    color: 'royalblue',
    icon: 'vote-yea'
  }
}
