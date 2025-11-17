export interface HNStory {
  id: number;
  type: 'story';
  by: string;
  time: number;
  kids?: number[];
  url: string;
  score: number;
  title: string;
  descendants: number;
  deleted?: boolean;
  dead?: boolean;
}


export interface GraphNode {
  id: string;
  group: number; // 1 for story, 2 for author, 3 for domain
  title: string;
  hnUrl?: string; // URL to the item or user on news.ycombinator.com
  articleUrl?: string; // External URL for stories
  
  // d3 properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
