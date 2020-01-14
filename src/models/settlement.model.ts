import { PoliticalOffice } from "./politicalOffice.model";
import { ActorPoliticalStatus } from "./actor.model";
import { Vote } from "./vote.model";
import { Motion } from "./motion.model";
import { Phase } from "./phase.model";

export interface SettlementBaseData {
	id: string;
	name: string;
}

export interface SettlementState {
	policies: {[id: string]: string};
	history: {}[];   // A list of policy decisions in chronological order -- for use in cooldown on issues and story events requiring a policy be in place for a certain length of time
	offices: {[id: string]: PoliticalOffice};
	actorPositions: {[actorId: string]: ActorPoliticalStatus}
	standardPositions: PoliticalOffice[];
	availableMotions: Motion[];
	motionsTabled: {id: string; tabledBy: string}[];
	currentVoteOffers: {[actorId: string]: Vote[]};
	motionVotes: {[motionId: string]: {[actorId: string]: {vote: string, purchaseAgreement?: {purchasedBy: string, amountSpent: number}, reason: string}}};
	currentPhase: Phase;
	currentPhaseCountdown: number;
	officeOccupants: {[id: string]: string};
}

export interface SettlementWithState extends SettlementBaseData {
	state: SettlementState;
}

