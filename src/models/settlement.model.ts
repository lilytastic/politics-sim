export interface SettlementBaseData {
	id: string;
}

export interface PoliticalOffice {
	name: {basic: string; masculine?: string, feminine?: string};
	voteWeight: number;
	softCapitalPerCycle: number;	// Capital given per turn
	softCapitalCap: number;			// Max amount of capital that can be gained passively
}

export interface SettlementState {
	policies: {[id: string]: string};
	offices: {[id: string]: PoliticalOffice};
	officeOccupants: {[id: string]: string};
}
