import tehilimFr from './tehilimFr';

function nettoyerHTML(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export async function getTehilim(chapitre, avecFr = false) {
  try {
    const res = await fetch(
      `https://www.sefaria.org/api/texts/Psalms.${chapitre}?lang=he&commentary=0&context=0`
    );
    const data = await res.json();
    const he = Array.isArray(data.he)
      ? data.he.map(v => nettoyerHTML(v)).join(' ')
      : '';

    const fr = avecFr ? (tehilimFr[chapitre] || null) : null;
    return { he, fr };
  } catch (e) {
    return { he: '', fr: null };
  }
}