import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {germanSan,germanMoveLabel,germanMoveFromFen,germanPositionFromFen,germanVariation} from '../src/german-notation.js';

test('German SAN changes only the displayed piece symbols, never file names or legal SAN',()=>{
 for(const [san,want] of [['Nf3','Sf3'],['Nbd7','Sbd7'],['Rae1','Tae1'],['Rxe7+','Txe7+'],['Qxd4','Dxd4'],['Bf4','Lf4'],['Kf2','Kf2'],['axb8=Q+','axb8=D+'],['b1=N#','b1=S#'],['e4','e4'],['exd4','exd4'],['O-O','O-O'],['O-O-O','O-O-O']])
  assert.equal(germanSan(san),want);
 assert.equal(germanMoveLabel(94,'Nxg7'),'47… Sxg7');
 assert.equal(germanMoveLabel(93,'Rxg7'),'47. Txg7');
 assert.equal(germanPositionLabel(94,'Nxg7'),'nach 47… Sxg7');
 assert.equal(germanPositionLabel(0,null),'Ausgangsstellung');
});

test('move numbers match pre-move FEN, including imported games starting at fullmove 47',()=>{
 const before='8/6R1/4k2p/5n2/8/8/5K2/8 b - - 0 47';
 assert.equal(germanMoveFromFen(before,'Nxg7'),'47… Sxg7');
 assert.equal(germanPositionFromFen(before,'Nxg7'),'nach 47… Sxg7');
 assert.equal(germanPositionFromFen(undefined,null),'Ausgangsstellung');
 const custom=new Chess('8/7k/8/8/8/8/4K3/7R w - - 0 61');
 const fen=custom.fen(),san='Rh7+';
 assert.ok(custom.moves().includes(san));
 assert.equal(germanMoveFromFen(fen,san),'61. Th7+');
 assert.equal(germanVariation(fen,[san]),'61. Th7+');
});
