export interface VoteData {
	purchaseAgreement?: {purchasedBy: string, amountSpent: number},
	vote: string;
	reason: string;
}

export interface Vote extends VoteData {
	actorId: string,
	motionId: string,
}
