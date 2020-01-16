import { ActorState } from "../models/actor.model";
import { Motion } from "../models/motion.model";
import { SettlementState, SettlementBaseData } from "../models/settlement.model";
import { Vote } from "../models/vote.model";

export interface SaveData {
	settlementState: {[id: string]: SettlementState};
	actorState: {[id: string]: ActorState};
	currentSettlement: string;
	inspectedMotion: string;
	timePassed: number;
	notifications: {type: string; text: string;}[];
}
