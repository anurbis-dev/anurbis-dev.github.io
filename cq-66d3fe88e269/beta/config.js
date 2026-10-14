/* The feedback worker's address (beta/worker): the beta page's button sends to it, fb.html reads snapshots from it.
   ?fbapi=<url> on the game page (or ?api= on fb.html) overrides it, e.g. http://localhost:8787 for `wrangler dev` */
window.CUBE_FB_API = 'https://cube-feedback.alexey-borzykh.workers.dev';
