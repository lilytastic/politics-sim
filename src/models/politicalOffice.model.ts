export interface PoliticalStructure {
	name: string;
	offices: {[id: string]: PoliticalOffice};	// Can be merged with offices of the faction and region (if ruled by that faction)
	standardPositions: PoliticalOffice[];
}

export interface PoliticalOffice {
	name: {basic: string; masculine?: string, feminine?: string};
	cost?: number;					// Cost to earn this rank. If -1, this position cannot be bought.
	voteWeight: number;
	softCapitalPerCycle: number;	// Capital given per turn
	softCapitalCap: number;			// Max amount of capital that can be gained passively
}
