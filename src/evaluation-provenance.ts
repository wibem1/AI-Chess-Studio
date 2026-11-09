/** Extract an app-generated, human-readable receipt from a saved model answer.
 * This is application text, not a cryptographic provider attestation.
 * Never infer model identity from surrounding prose when the receipt is absent.
 */
export interface RecordedModelAnswer {
 response:string;
 model?:string;
 thinkingLevel?:string;
 receiptPresent:boolean;
}
export function recordedModelAnswer(text:string):RecordedModelAnswer {
 if(typeof text!=='string'||!text.trim())throw new Error('Gespeicherte Modellantwort fehlt.');
 // Annotations may have a separate technical attachment after the displayed answer.
 const visible=text.split('\n\nAnalyse-Details:')[0]!.trim();
 const marker='Modellnachweis (App): ';
 if(!visible.startsWith(marker))return {response:visible,receiptPresent:false};
 const boundary=visible.indexOf('\n\n');
 if(boundary<0)return {response:visible,receiptPresent:false};
 const receipt=visible.slice(marker.length,boundary).trim();
 const sections=receipt.split(' · ');
 // provider · model · Denken effort · N Aufruf(e) · cost
 if(sections.length!==5||!sections[0]||!sections[1]||!sections[2]?.startsWith('Denken ')||
    !/^\d+ Aufruf\(e\)$/.test(sections[3]!)||!sections[4]!.endsWith('.'))
  return {response:visible,receiptPresent:false};
 const model=sections[1]!.trim(),thinkingLevel=sections[2]!.slice('Denken '.length).trim();
 if(!model||model.length>160||!thinkingLevel||thinkingLevel.length>80)
  return {response:visible,receiptPresent:false};
 const response=visible.slice(boundary+2).trim();
 if(!response)return {response:visible,receiptPresent:false};
 return {response,model,thinkingLevel,receiptPresent:true};
}
