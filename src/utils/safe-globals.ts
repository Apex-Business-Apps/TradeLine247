declare global { var process: any | undefined; var Buffer: any | undefined; }
;(globalThis as any).process = (globalThis as any).process ?? { env: {} };
(function exposeBuffer(){ if(!(globalThis as any).Buffer){ try{ import('buffer').then((m:any)=>{ if(m?.Buffer && !(globalThis as any).Buffer){ (globalThis as any).Buffer = m.Buffer; } }).catch(()=>{});}catch{}} })();
export {};
