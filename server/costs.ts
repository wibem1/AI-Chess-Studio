import {readLocalJson,writeLocalJson} from './local-json.js';
import {CostLedger} from '../src/costs.js';
export type {CostState} from '../src/costs.js';
export class CostControl extends CostLedger {
 constructor(path?:string){super(path?readLocalJson(path):null,path?next=>writeLocalJson(path,next):undefined);}
}
