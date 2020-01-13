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
    opposed: 'charity',
    icon: 'glass-cheers',
    color: 'darkorange'
  },
  'education': {
    label: 'Education',
    opposed: 'creativity',
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
    icon: 'shield-alt',
    color: 'ROYALBLUE'
  },
  'dignity': {
    label: 'Dignity',
    color: 'INDIANRED',
    opposed: 'purpose',
    icon: 'fist-raised'
  },
  'charity': {
    label: 'Charity',
    color: 'goldenrod',
    opposed: 'joy',
    icon: 'hands-helping'
  },
  'creativity': {
    label: 'Creativity',
    color: 'sandybrown',
    opposed: 'education',
    icon: 'palette'
  },
  'openness': {
    label: 'Openness',
    color: 'grey',
    opposed: 'vigilance',
    icon: 'dove'
  },
  'votes': {
    label: 'Votes',
    color: 'royalblue',
    icon: 'vote-yea'
  }
}
