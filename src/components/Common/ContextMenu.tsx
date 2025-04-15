import dynamic from 'next/dynamic';

const ContextMenuTrigger = dynamic(() => import('rctx-contextmenu').then(c => c.ContextMenuTrigger), {
  ssr: false,
});
const ContextMenu = dynamic(() => import('rctx-contextmenu').then(c => c.ContextMenu), {
  ssr: false,
});
const ContextMenuItem = dynamic(() => import('rctx-contextmenu').then(c => c.ContextMenuItem), {
  ssr: false,
});

export { ContextMenu, ContextMenuItem, ContextMenuTrigger };
