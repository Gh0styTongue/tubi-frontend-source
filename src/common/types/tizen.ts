export interface CWHistory {
  contentId: string;
  position?: number;
}

export const enum DeeplinkContentType {
  VOD = 'vod',
  LINEAR = 'linear'
}

export interface PreviewTile {
  content_id: string,
  title: string,
  image_ratio: string,
  image_url: string,
  action_data: string,
  is_playable: true,
  position: number,
}

interface PreviewSection {
  title: string;
  position?: number;
  tiles: PreviewTile[];
}

export interface PreviewData {
  sections: PreviewSection[];
}
