// SEC-10: isolated, opt-in composition of existing review and publication Workers.
// No candidate-ingress route. Not wired into any deployed entrypoint.
import { createCloudflareReviewWorker } from './cloudflare-review-worker.mjs';
import { createCloudflarePublicationWorker } from './cloudflare-publication-worker.mjs';

const reviewPaths=new Set(['/api/review/decisions','/api/review/approvals','/api/review/levels/decisions']);
const publishPaths=new Set(['/api/questions/publish','/api/levels/publish']);
const reject=(status,error)=>Response.json({error},{status,headers:{'cache-control':'no-store'}});

export function createCloudflareIntegratedWorker({
  reviewWorker=createCloudflareReviewWorker(),
  publicationWorker=createCloudflarePublicationWorker(),
}={}) {
  if(typeof reviewWorker?.fetch!=='function'||typeof publicationWorker?.fetch!=='function')
    throw new TypeError('both protected worker handlers required');
  return {
    async fetch(request,env,ctx) {
      const pathname=new URL(request.url).pathname;
      // Routing is exact; a caller cannot choose a handler with a body field.
      if(reviewPaths.has(pathname)) return reviewWorker.fetch(request,env,ctx);
      if(publishPaths.has(pathname)) return publicationWorker.fetch(request,env,ctx);
      return reject(404,'not_found');
    },
  };
}
export default createCloudflareIntegratedWorker();
