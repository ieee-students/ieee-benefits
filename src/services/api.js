export const fetchBenefits = async (onUpdate) => {
  try {
    // 1. Prioritize Google Apps Script endpoint first
    const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL || import.meta.env.APP_SCRIPT_URL;
    if (scriptUrl) {
      try {
        const remote = await fetch(`${scriptUrl}?verified=true`);
        if (remote.ok) {
          const remoteData = await remote.json();
          if (Array.isArray(remoteData)) {
            if (onUpdate) onUpdate(remoteData);
            return remoteData;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch remote benefits data:", err);
      }
    }

    // 2. If API fails or is not configured, fall back to static data.json
    const primary = await fetch('/data.json');
    const pType = primary.headers.get('content-type');
    if (primary.ok && pType && pType.includes('application/json')) {
      const localData = await primary.json();
      if (onUpdate) onUpdate(localData);
      return localData;
    } 
    
    // 3. Fallback to example data if data.json is missing too
    const fallback = await fetch('/data.example.json');
    const fType = fallback.headers.get('content-type');
    if (fallback.ok && fType && fType.includes('application/json')) {
      const exampleData = await fallback.json();
      if (onUpdate) onUpdate(exampleData);
      return exampleData;
    }

  } catch (error) {
    console.error("Failed to fetch benefits:", error);
  }

  // Return empty array if all approaches fail
  if (onUpdate) onUpdate([]);
  return [];
};

export const fetchOUs = async () => {
  try {
    const response = await fetch('/spos.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch OUs:", error);
    return [];
  }
};

export const fetchCategories = async () => {
  try {
    const response = await fetch('/categories.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch Categories:", error);
    return [];
  }
};

let _spoInfoCache = null;

export const fetchSpoInfo = async () => {
  if (_spoInfoCache) return _spoInfoCache;
  try {
    const response = await fetch('/spoinfo.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    _spoInfoCache = await response.json();
    return _spoInfoCache;
  } catch (error) {
    console.error("Failed to fetch SpoInfo:", error);
    return {};
  }
};

export const submitContribution = async (payload) => {
  const url = import.meta.env.VITE_APP_SCRIPT_URL || import.meta.env.APP_SCRIPT_URL;
  if (!url) {
    throw new Error("Apps script URL not configured in .env");
  }

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    }
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Submission failed');
  }
  return result;
};
