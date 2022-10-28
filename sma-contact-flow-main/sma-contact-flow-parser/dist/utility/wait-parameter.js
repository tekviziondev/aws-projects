"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWaitTimeParameter = void 0;
function getWaitTimeParameter(action) {
    let rv;
    if (action.TimeLimitSeconds !== null) {
        let seconds;
        const timeLimitSeconds = Number.parseInt(action.Parameters.TimeLimitSeconds);
        rv = String(timeLimitSeconds * 1000);
    }
    console.log("Wait Parameter : " + rv);
    return rv;
}
exports.getWaitTimeParameter = getWaitTimeParameter;
