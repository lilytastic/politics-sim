export interface Motion {
	id: string;
	name: string;
	change: {type: string; payload: any};
	costToTable: number;
	rewardForPassing: number;
	effects: { stat: string, amount: number }[];
}
