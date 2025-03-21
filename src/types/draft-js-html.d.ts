declare module 'draftjs-to-html' {
  import { RawDraftContentState } from 'draft-js';
  export default function draftToHtml(rawContentState: RawDraftContentState): string;
}

declare module 'html-to-draftjs' {
  import { ContentBlock, EntityMap } from 'draft-js';
  export default function htmlToDraft(html: string): {
    contentBlocks: ContentBlock[];
    entityMap: EntityMap;
  };
}