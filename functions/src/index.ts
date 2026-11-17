import { setGlobalOptions } from "firebase-functions/v2";
import { onCall } from "firebase-functions/v2/https";
import { handleHello } from "./callables/hello";
import { REGION } from "./config";
import { systemClock } from "./domain/clock";

setGlobalOptions({ region: REGION, maxInstances: 10 });

export const hello = onCall<unknown>((request) =>
  handleHello(request.data, { clock: systemClock }),
);