const NOTION_AUTH_TOKEN = process.env.REACT_APP_NOTION_AUTH_TOKEN;

export async function fetchNotionData() {
  // const url = `${NOTION_URL_BASE}/${NOTION_DATA_SOURCE_ID}/query`;
  const url = "http://localhost:5000/api/notion-data";

  const headers = {
    Authorization: `Bearer ${NOTION_AUTH_TOKEN}`,
    "Notion-Version": "2026-03-11",
    "Content-Type": "application/json",
  };
  console.log(url);
  const response = await fetch(url, {
    method: "GET",
    headers,
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Notion data: ${response.statusText}`);
  }

  return response.json();
}
