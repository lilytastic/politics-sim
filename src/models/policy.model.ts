export interface PolicyBaseData {
	id: string;
	label: string;
	stances: {[id: string]: PolicyStance};
}

export interface PolicyStance {
	id: string;
	label: string;
	effects: {stat: string; amount: number}[];
}

export interface PolicyState {
	id: string;
	stance: string;
}
