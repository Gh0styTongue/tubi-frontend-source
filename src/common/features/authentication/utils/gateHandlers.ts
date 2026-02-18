import type { GateHandlers } from 'common/features/authentication/types/gateHandler';

let handlers: GateHandlers;

if (__WEBPLATFORM__ === 'WEB') {
  handlers = require('web/features/authentication/utils/gateHandlers').gateHandlers;
} else {
  handlers = require('ott/features/authentication/utils/gateHandlers').gateHandlers;
}

export const gateHandlers = handlers;
