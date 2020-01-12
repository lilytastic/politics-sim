import { PoliticalOffice } from "../models/politicalOffice.model"

export const OFFICE_CHIEF: PoliticalOffice = {
  name: { basic: 'Chief', feminine: 'Chieftess' },
  voteWeight: 5,
  softCapitalPerCycle: 1000,
  softCapitalCap: 5000
}
export const OFFICE_ROYAL_ADMINISTRATOR: PoliticalOffice = {
  name: { basic: 'Royal Administrator' },
  voteWeight: 3,
  softCapitalPerCycle: 500,
  softCapitalCap: 3000
}
export const OFFICE_ELDER: PoliticalOffice = {
  name: { basic: 'Elder' },
  voteWeight: 3,
  softCapitalPerCycle: 500,
  softCapitalCap: 2000
}

export const OFFICE_CHIEFTAIN: PoliticalOffice = {
  name: { basic: 'Chieftain' },
  voteWeight: 3,
  softCapitalPerCycle: 500,
  softCapitalCap: 2500
}
export const OFFICE_ADMINISTRATOR: PoliticalOffice = {
  name: { basic: 'Administrator' },
  voteWeight: 2,
  softCapitalPerCycle: 200,
  softCapitalCap: 1000
}
export const OFFICE_DEFENSE_SECRETARY: PoliticalOffice = {
  name: { basic: 'Secretary of Defense' },
  voteWeight: 2,
  softCapitalPerCycle: 200,
  softCapitalCap: 1000
}

export const OFFICE_EDUCATION_SECRETARY: PoliticalOffice = {
  name: { basic: 'Secretary of Education' },
  voteWeight: 2,
  softCapitalPerCycle: 150,
  softCapitalCap: 800
}
export const OFFICE_TREASURER: PoliticalOffice = {
  name: { basic: 'Treasurer' },
  voteWeight: 2,
  softCapitalPerCycle: 150,
  softCapitalCap: 800
}
