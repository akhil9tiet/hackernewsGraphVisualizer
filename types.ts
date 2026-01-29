export interface HNItem {
  id: number;
  type: 'story' | 'comment' | 'job' | 'poll' | 'pollopt';
  by?: string;
  time: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  text?: string;
  parent?: number;
  descendants?: number;
  deleted?: boolean;
  dead?: boolean;
}


export interface GraphNode {
  id: string;
  group: number; // 1 for story, 2 for comment (depth based coloring)
  depth: number; // 0 for story, 1+ for comments
  title: string;
  author?: string;
  hnUrl?: string; // URL to the item on news.ycombinator.com
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
