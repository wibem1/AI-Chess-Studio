import type {SessionData} from './session.js';

/**
 * Lossless move-history evidence for a locally exported diagnostic.
 * Every position node is included, so replay branches and loaded games remain
 * reconstructible even if no AI provider request was made.
 */
export function diagnosticGameHistory(session:SessionData){
 const byId=new Map(session.nodes.map(node=>[node.id,node]));
 const activeLine:typeof session.nodes=[];
 const visited=new Set<string>();
 let id:string|null=session.activeNodeId;
 while(id!==null){
  if(visited.has(id))throw new Error('Zyklischer Partieverlauf in der Diagnose.');
  visited.add(id);
  const node=byId.get(id);
  if(!node)throw new Error('Unvollständiger Partieverlauf in der Diagnose.');
  activeLine.unshift(node);
  id=node.parentId;
 }
 return {
  rootFen:session.nodes[0]?.fen??null,
  activeNodeId:session.activeNodeId,
  activeLine:activeLine.slice(1).map((node,index)=>({ply:index+1,nodeId:node.id,san:node.san,fenAfter:node.fen})),
  nodes:session.nodes.map(node=>({id:node.id,parentId:node.parentId,san:node.san,fen:node.fen})),
  ...(session.review?.pgn?{importedPgn:session.review.pgn}:{}),
 };
}
