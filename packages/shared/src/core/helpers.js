import { v4 as uuidv4 } from 'uuid';
export function newId() {
    return uuidv4();
}
export function nowIso() {
    return new Date().toISOString();
}
//# sourceMappingURL=helpers.js.map