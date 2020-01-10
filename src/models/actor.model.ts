
export interface Actor {
	id: number;
	name: string;
	positions: PoliticalPosition[];
	capital: number;
}

export interface PoliticalPosition {
	stat: string;
	attitude: string;
	passion: number;
}

