export interface Phase {
	id: string;
	label: string;
	countdown: number;
	isRepeat: boolean;
}

export const PHASES = {
	TABLE: {id: 'table', label: 'Draft', countdown: 20, isRepeat: false},
	VOTE: {id: 'vote', label: 'Vote', countdown: 90, isRepeat: false},
	RESULTS: {id: 'results', label: 'Results', countdown: 20, isRepeat: false}
};
