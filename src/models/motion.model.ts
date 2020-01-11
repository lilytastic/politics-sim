export interface Motion {
	id: string;
	name: string;
	costToTable: number;
	effects: { stat: string, amount: number }[];
}
