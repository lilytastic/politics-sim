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
  }
}
