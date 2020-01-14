import { ActorWithStateAndOffices } from "../models/actor.model";

export const calculateActorCapitalWithAllowance = (actor: ActorWithStateAndOffices) => {
  const softCap = actor.offices.length ? Math.max(...actor.offices.map(x => x.softCapitalCap)) : 0;
  const allowance = actor.offices.length ? actor.offices.reduce((acc, curr) => acc + curr.softCapitalPerCycle, 0) : 0;
  const capital = Math.max(
	actor.state.capital,
	Math.min(softCap, actor.state.capital + Math.max(100, allowance))
  );
  return capital
}
