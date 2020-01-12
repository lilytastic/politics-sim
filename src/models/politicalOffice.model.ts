export interface PoliticalStructure {
	name: string;
	offices: {[id: string]: PoliticalOffice}
}

export interface PoliticalOffice {
	name: {basic: string; masculine?: string, feminine?: string};
	voteWeight: number;
	softCapitalPerCycle: number;	// Capital given per turn
	softCapitalCap: number;			// Max amount of capital that can be gained passively
}
