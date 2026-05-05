export async function getTehilim(chapitre) {
  try {
    const res = await fetch(
      `https://www.sefaria.org/api/texts/Psalms.${chapitre}?lang=he&commentary=0&context=0`
    );
    const data = await res.json();
    const he = Array.isArray(data.he) ? data.he.join(' ') : '';
    return { he };
  } catch (e) {
    return { he: '' };
  }
}