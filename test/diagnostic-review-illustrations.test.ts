import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Session} from '../src/session.js';
import {diagnosticReviewIllustrations} from '../src/diagnostic-review-illustrations.js';
import {validateGameReview,formatGameReview} from '../src/game-review.js';
import {ModelDiagnostics} from '../src/model-diagnostics.js';

test('export includes the original historical FEN and actual stored learning arrows, no invented annotations',()=>{
 const s=new Session();
 assert.deepEqual(diagnosticReviewIllustrations(s.snapshot()),[]);
 for(const san of ['f3','e5','g4','Qh4#'])s.play(san);
 const moves=['f3','e5','g4','Qh4#'],rootFen=s.snapshot().nodes[0]!.fen;
 const candidate={
  summary:'Weiß schwächt den eigenen König.',
  moments:[
   {ply:1,played:'f3',explanation:'Der f-Bauer rückt und öffnet die Königsstellung.',alternative:'e4',reason:'Ein zentraler Bauernplan.',
    marks:[{from:'f2',to:'f3',kind:'arrow' as const,color:'green' as const}],
    steps:[{text:'Bauer f2 spielt vor.',marks:[{from:'f2',to:'f3',kind:'arrow' as const,color:'green' as const}]}]},
   {ply:3,played:'g4',explanation:'Die schwarze Dame droht auf h4.',alternative:'g3',reason:'Die Diagonale h4–e1 genauer prüfen.',
    marks:[{from:'d8',to:'h4',kind:'arrow' as const,color:'red' as const}]}
  ],
  lesson:'Vor jedem Bauernzug die gegnerischen Schachgebote betrachten.'
 };
 const review=validateGameReview(candidate,{rootFen,moves,truncated:false});
 s.annotate({nodeId:'n4',kind:'dialogue',source:'model',text:formatGameReview(review,{rootFen,moves}),gameReview:review,hypothesis:true,openQuestions:[]});
 const reloaded=Session.import(s.export());
 reloaded.select('n0'); // The diagnostic must not silently bind arrows to the selected final position.
 const report=new ModelDiagnostics().export({current:{reviewIllustrations:diagnosticReviewIllustrations(reloaded.snapshot())}});
 const result=report.extra.current.reviewIllustrations;
 assert.equal(report.requests.length,0);
 assert.equal(result.length,1);
 assert.equal(result[0].momentCount,2);
 assert.equal(result[0].moments[0].beforeNodeId,'n0');
 assert.equal(result[0].moments[0].beforeFen,rootFen);
 assert.deepEqual(result[0].moments[0].steps,review.moments[0]!.steps);
 assert.equal(result[0].moments[1].beforeNodeId,'n2');
 assert.equal(result[0].moments[1].beforeFen,reloaded.snapshot().nodes[2]!.fen);
 assert.equal(result[0].moments[1].marks[0].from,'d8');
});
