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
    description: 'Positive: Something to live for, Negative: Less importance for the individual',
    icon: 'praying-hands',
    color: 'MEDIUMPURPLE'
  },
  'joy': {
    label: 'Pleasure',
    opposed: 'charity',
    description: 'Positive: Happiness, Negative: Degeneracy and excess',
    icon: 'glass-cheers',
    color: 'darkorange'
  },
  'education': {
    label: 'Education',
    opposed: 'creativity',
    description: 'Positive: Knows facts, Negative: Does not know love',
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
    opposed: 'openness',
    description: 'Your people are disciplined and ready to defend their nation. They may also be jumpy, or focus their zeal on the wrong target.',
    icon: 'shield-alt',
    color: 'ROYALBLUE'
  },
  'dignity': {
    label: 'Dignity',
    color: 'INDIANRED',
    description: 'Positive: Empowered and free, Negative: May disobey',
    opposed: 'purpose',
    icon: 'fist-raised'
  },
  'charity': {
    label: 'Charity',
    color: 'goldenrod',
    description: 'Positive: Able to take care of the less fortunate, Negative: May be exploited',
    opposed: 'joy',
    icon: 'hands-helping'
  },
  'creativity': {
    label: 'Creativity',
    color: 'sandybrown',
    description: 'Positive: Able to come up with new ideas and works of art, Negative: Suggestible, inappropriate, and prone to flights of fancy.',
    opposed: 'education',
    icon: 'palette'
  },
  'openness': {
    label: 'Openness',
    color: 'grey',
    description: 'Positive: Make friends, Negative: Vulnerable',
    opposed: 'vigilance',
    icon: 'dove'
  },
  'votes': {
    label: 'Votes',
    color: 'royalblue',
    icon: 'vote-yea'
  }
}
