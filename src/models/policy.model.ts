export interface PolicyBaseData {
	id: string;
	label: string;
	stances: PolicyStance[];
}

export interface PolicyStance {
	id: string;
	effects: {stat: string; amount: number}[];
}

export interface PolicyState {
	id: string;
	stance: string;
}
