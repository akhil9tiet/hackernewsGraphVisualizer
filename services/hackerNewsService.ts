import type { HNStory, GraphData, GraphNode, GraphLink } from '../types';

const API_BASE = 'https://hacker-news.firebaseio.com/v0';
const ITEM_URL_BASE = 'https://news.ycombinator.com/item?id=';
const USER_URL_BASE = 'https://news.ycombinator.com/user?id=';

const fetchTopStoryIds = async (limit: number): Promise<number[]> => {
  const response = await fetch(`${API_BASE}/topstories.json`);
  if (!response.ok) {
    throw new Error('Failed to fetch top story IDs');
  }
  const allIds: number[] = await response.json();
  return allIds.slice(0, limit);
};

const fetchItemDetails = async (id: number): Promise<HNStory | null> => {
  try {
    const response = await fetch(`${API_BASE}/item/${id}.json`);
    if (!response.ok) {
        console.warn(`Failed to fetch item details for id: ${id}`);
        return null;
    }
    const item: HNStory = await response.json();
    // Ensure item is a story and not dead/deleted
    if (item && item.type === 'story' && !item.dead && !item.deleted) {
      return item;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching item ${id}:`, error);
    return null;
  }
};

const extractDomain = (urlString: string): string | null => {
    if (!urlString) return null;
    try {
        const url = new URL(urlString);
        return url.hostname.replace(/^www\./, '');
    } catch (e) {
        console.warn(`Invalid URL string: ${urlString}`);
        return null;
    }
};


export const getGraphData = async (storyCount: number): Promise<GraphData> => {
  const topStoryIds = await fetchTopStoryIds(storyCount);
  const storyPromises = topStoryIds.map(fetchItemDetails);
  const stories = (await Promise.all(storyPromises)).filter(Boolean) as HNStory[];

  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  
  // Node Groups: 1=Story, 2=Author, 3=Domain
  const STORY_GROUP = 1;
  const AUTHOR_GROUP = 2;
  const DOMAIN_GROUP = 3;

  for (const story of stories) {
    if (!story || !story.by || !story.url) continue;
    
    const domain = extractDomain(story.url);
    if (!domain) continue;

    const storyId = story.id.toString();
    const authorId = story.by;
    const domainId = domain;

    // Add Story Node
    nodes.set(storyId, {
      id: storyId,
      group: STORY_GROUP,
      title: story.title,
      hnUrl: `${ITEM_URL_BASE}${story.id}`,
      articleUrl: story.url,
    });
    
    // Add Author Node if it doesn't exist
    if (!nodes.has(authorId)) {
      nodes.set(authorId, {
        id: authorId,
        group: AUTHOR_GROUP,
        title: `Author: ${authorId}`,
        hnUrl: `${USER_URL_BASE}${authorId}`,
      });
    }

    // Add Domain Node if it doesn't exist
    if (!nodes.has(domainId)) {
      nodes.set(domainId, {
        id: domainId,
        group: DOMAIN_GROUP,
        title: `Domain: ${domainId}`,
        articleUrl: `http://${domainId}`,
      });
    }

    // Add links
    links.push({ source: authorId, target: storyId, value: 1 });
    links.push({ source: storyId, target: domainId, value: 1 });
  }

  return { nodes: Array.from(nodes.values()), links };
};
