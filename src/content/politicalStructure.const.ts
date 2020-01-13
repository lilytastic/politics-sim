import { PoliticalStructure } from "../models/politicalOffice.model";
import { OFFICE_CHIEFTAIN, OFFICE_ELDER, OFFICE_ADMINISTRATOR, OFFICE_DEFENSE_SECRETARY, OFFICE_EDUCATION_SECRETARY } from "./offices.const";

export const POLITICAL_STRUCTURE_TRIBAL: PoliticalStructure = {
  name: 'Tribal',
  offices: {
    'chieftain': OFFICE_CHIEFTAIN,
    'elder': OFFICE_ELDER,
    'admin': { ...OFFICE_ADMINISTRATOR, name: { basic: 'Advisor' } },
    'defense_sec': { ...OFFICE_DEFENSE_SECRETARY, name: { basic: 'Warlord' } },
    'education_sec': { ...OFFICE_EDUCATION_SECRETARY, name: { basic: 'Guru' } }
  },
  standardPositions: [
    {name: {basic: 'Outsider'}, cost: 0, voteWeight: 0, softCapitalPerCycle: 0, softCapitalCap: 0},
    {name: {basic: 'Friend'}, cost: 1000, voteWeight: 1, softCapitalPerCycle: 100, softCapitalCap: 500},
    {name: {basic: 'Initiate'}, cost: 5000, voteWeight: 2, softCapitalPerCycle: 250, softCapitalCap: 800},
    {name: {masculine: 'Tribesman', feminine: 'Tribesman', basic: 'Tribe Member'}, cost: 10000, voteWeight: 3, softCapitalPerCycle: 400, softCapitalCap: 1500},
    {name: {masculine: 'Honoured Tribesman', feminine: 'Honoured Tribesman', basic: 'Honoured Tribe Member'}, cost: 25000, voteWeight: 5, softCapitalPerCycle: 800, softCapitalCap: 3500},
  ]
}

/*
[
    {name: {basic: 'Outsider'}, voteWeight: 1, softCapitalPerCycle: 0, softCapitalCap: 0},
    {name: {basic: 'Familiar'}, voteWeight: 1, softCapitalPerCycle: 100, softCapitalCap: 500},
    {name: {basic: 'Associate'}, voteWeight: 2, softCapitalPerCycle: 250, softCapitalCap: 800},
    {name: {basic: 'Official'}, voteWeight: 3, softCapitalPerCycle: 400, softCapitalCap: 1500},
    {name: {basic: 'Celebrity'}, voteWeight: 5, softCapitalPerCycle: 800, softCapitalCap: 3500},
  ]
*/
