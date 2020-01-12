import { PoliticalOffice } from "./politicalOffice.model";

export interface SettlementBaseData {
	id: string;
}

export interface SettlementState {
	policies: {[id: string]: string};
	offices: {[id: string]: PoliticalOffice};
	officeOccupants: {[id: string]: string};
}
