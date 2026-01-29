import type { HNItem, GraphData, GraphNode, GraphLink } from '../types';

const API_BASE = 'https://hacker-news.firebaseio.com/v0';
const ITEM_URL_BASE = 'https://news.ycombinator.com/item?id=';

// Configuration
const MAX_DEPTH = 2; // How deep to traverse comments (0 = story only, 1 = direct comments, 2 = replies to comments, etc.)
const MAX_KIDS_PER_ITEM = 5; // Limit kids per item to avoid explosion

const fetchTopStoryIds = async (limit: number): Promise<number[]> => {
  const response = await fetch(`${API_BASE}/topstories.json`);
  if (!response.ok) {
    throw new Error('Failed to fetch top story IDs');
  }
  const allIds: number[] = await response.json();
  return allIds.slice(0, limit);
};

const fetchItemDetails = async (id: number): Promise<HNItem | null> => {
  try {
    const response = await fetch(`${API_BASE}/item/${id}.json`);
    if (!response.ok) {
      console.warn(`Failed to fetch item details for id: ${id}`);
      return null;
    }
    const item: HNItem = await response.json();
    if (item && !item.dead && !item.deleted) {
      return item;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching item ${id}:`, error);
    return null;
  }
};

const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  // Remove HTML tags for cleaner display
  const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.substring(0, maxLength) + '...';
};

// Recursively fetch an item and its kids up to maxDepth
const fetchItemWithKids = async (
  id: number,
  depth: number,
  nodes: Map<string, GraphNode>,
  links: GraphLink[],
  parentId: string | null
): Promise<void> => {
  const item = await fetchItemDetails(id);
  if (!item) return;

  const itemId = item.id.toString();
  
  // Determine node properties based on type
  const isStory = item.type === 'story';
  let title: string;
  
  if (isStory) {
    title = item.title || 'Untitled Story';
  } else {
    title = truncateText(item.text || 'Comment', 80);
  }

  // Add node if not already present
  if (!nodes.has(itemId)) {
    nodes.set(itemId, {
      id: itemId,
      group: isStory ? 1 : 2, // 1 = story, 2 = comment
      depth: depth,
      title: title,
      author: item.by,
      hnUrl: `${ITEM_URL_BASE}${item.id}`,
      articleUrl: isStory ? item.url : undefined,
    });
  }

  // Add link to parent if exists
  if (parentId) {
    links.push({ source: parentId, target: itemId, value: 1 });
  }

  // Fetch kids if we haven't reached max depth
  if (depth < MAX_DEPTH && item.kids && item.kids.length > 0) {
    const kidsToFetch = item.kids.slice(0, MAX_KIDS_PER_ITEM);
    
    // Fetch kids in parallel
    await Promise.all(
      kidsToFetch.map(kidId => 
        fetchItemWithKids(kidId, depth + 1, nodes, links, itemId)
      )
    );
  }
};

export const getGraphData = async (storyCount: number): Promise<GraphData> => {
  const topStoryIds = await fetchTopStoryIds(storyCount);
  
  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  // Process stories in parallel
  await Promise.all(
    topStoryIds.map(storyId => 
      fetchItemWithKids(storyId, 0, nodes, links, null)
    )
  );

  return { nodes: Array.from(nodes.values()), links };
};
