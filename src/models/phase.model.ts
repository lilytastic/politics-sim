export interface Phase {
	id: string;
	label: string;
	countdown: number;
}

export const PHASES = {
	TABLE: {id: 'table', label: 'Draft', countdown: 20},
	VOTE: {id: 'vote', label: 'Vote', countdown: 90},
	RESULTS: {id: 'results', label: 'Results', countdown: 20}
};
