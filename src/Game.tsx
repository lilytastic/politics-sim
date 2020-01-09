import React from 'react';
import { connect } from 'react-redux'

interface Politician {
  name: string;
  positions: PoliticalPosition[];
}

interface PoliticalPosition {
  stat: string;
  attitude: string;
  passion: number;
}

let Game = ({ phase }: any) => {
  return (
    <div className="p-5">
      <div className="mb-4">
        Current Phase: {phase.name} ({phase.countdown}s)
      </div>
      <div className="row">
        <div className="col">
          {politicians.map((x, i) => (
            <div className="mb-2" key={i}>
              <div>{i+1}. {x.name}</div>
              {x.positions.map((position, ii) => (
                <i style={{color: position.attitude !== 'raise' ? 'red' : 'initial'}} key={ii} className={'fas fa-fw fa-' + stats[position.stat]?.icon || 'star'}></i>
              ))}
            </div>
          ))}
        </div>
        <div className="col">
          
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: any) => {
  return {
    phase: state.phases[state.currentPhase || 0],
    screen: state.screen
  }
};
const mapDispatchToProps = { }

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Game);


const politicians: Politician[] = [
  {
    name: 'Ananth',
    positions: []
  },
  {
    name: 'Guy 1',
    positions: [
      {
        stat: 'education',
        attitude: 'raise',
        passion: 50
      },
      {
        stat: 'faith',
        attitude: 'lower',
        passion: 50
      }
    ]
  },
  {
    name: 'Guy 2',
    positions: [
      {
        stat: 'vigilance',
        attitude: 'raise',
        passion: 50
      },
      {
        stat: 'joy',
        attitude: 'lower',
        passion: 50
      }
    ]
  },
  {
    name: 'Guy 3',
    positions: [
      {
        stat: 'education',
        attitude: 'lower',
        passion: 50
      },
      {
        stat: 'vigilance',
        attitude: 'raise',
        passion: 50
      }
    ]
  },
  {
    name: 'Guy 4',
    positions: [
      {
        stat: 'vigilance',
        attitude: 'lower',
        passion: 50
      },
      {
        stat: 'faith',
        attitude: 'raise',
        passion: 50
      }
    ]
  },
  {
    name: 'Guy 5',
    positions: [
      {
        stat: 'faith',
        attitude: 'lower',
        passion: 50
      },
      {
        stat: 'joy',
        attitude: 'raise',
        passion: 50
      }
    ]
  },
  {
    name: 'Guy 6',
    positions: [
      {
        stat: 'joy',
        attitude: 'lower',
        passion: 50
      },
      {
        stat: 'education',
        attitude: 'raise',
        passion: 50
      }
    ]
  }
];

const stats: {[id: string]: any} = {
  faith: {
    label: 'Purpose',
    icon: 'pray',
    color: 'silver'
  },
  joy: {
    label: 'Pleasure',
    icon: 'glass-cheers',
    color: 'darkorange'
  },
  education: {
    label: 'Education',
    icon: 'book',
    color: 'cadetblue'
  },
  vigilance: {
    label: 'Vigilance',
    icon: 'shield-alt',
    color: 'blue'
  }
}
