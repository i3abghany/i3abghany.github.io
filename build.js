#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Static build step.

   The News, Experience and Publications sections used to be fetched as JSON and
   rendered in the browser, which meant the served HTML contained three empty
   <ul>s. Search engines other than Google do not run JavaScript, and neither do
   the link unfurlers behind LinkedIn, Slack or X, so the most valuable content
   on the page was invisible to all of them.

   The JSON files remain the single source of truth. This script renders them to
   HTML once, at build time, and splices the result into index.html between the
   BEGIN/END marker comments. It also derives the schema.org JSON-LD block and
   sitemap.xml from the same data, so those cannot drift out of sync.

   Run `node build.js` after editing any of the .json files, then commit the
   regenerated index.html and sitemap.xml.
   --------------------------------------------------------------------------- */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE_URL = 'https://i3abghany.github.io';
const AUTHOR = 'Mahmoud Abumandour';

const readJson = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, name), 'utf8'));

/* --- rendering helpers ---------------------------------------------------- */

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Mirrors parseInlineLinks() in index.js: [label](url) -> anchor. Applied after
// escaping, so a & inside a URL is already the &amp; an href wants.
function parseInlineLinks(text) {
    return text.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

const inline = (text) => parseInlineLinks(escapeHtml(text));

// Matches the browser's Intl output that index.js produced, e.g. "Sep 24, 2025".
function formatIsoDate(dateString) {
    return new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
    }).format(new Date(`${dateString}T00:00:00Z`));
}

const indent = (html, spaces) =>
    html
        .split('\n')
        .map((line) => (line.trim() ? ' '.repeat(spaces) + line : ''))
        .join('\n');

/* --- section renderers ---------------------------------------------------- */

function renderNews(entries) {
    return entries
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((entry) => {
            const title = entry.link
                ? `<a href="${escapeHtml(entry.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.title)}</a>`
                : escapeHtml(entry.title);

            return [
                '<li class="news-item">',
                `    <p class="news-date"><time datetime="${entry.date}">${formatIsoDate(entry.date)}</time></p>`,
                '    <div class="news-copy">',
                `        <h3 class="news-title">${title}</h3>`,
                `        <p class="news-desc">${inline(entry.description)}</p>`,
                '    </div>',
                '</li>'
            ].join('\n');
        })
        .join('\n');
}

function renderExperience(entries) {
    return entries
        .map((entry) => {
            const details = entry.details
                .map((d) => `        <li>${inline(d)}</li>`)
                .join('\n');

            return [
                '<li>',
                `    <button class="toggle-btn">${escapeHtml(entry.start)} - ${escapeHtml(entry.end)} / <strong>${escapeHtml(entry.title)}</strong>, ${escapeHtml(entry.organization)}</button>`,
                '    <ul class="hidden-details">',
                details,
                '    </ul>',
                '</li>'
            ].join('\n');
        })
        .join('\n');
}

const PUB_LINK_ORDER = [
    ['paper', 'Paper'],
    ['code', 'Code'],
    ['video', 'Video'],
    ['doi', 'DOI'],
    ['slides', 'Slides']
];

function renderPublications(publications) {
    return publications
        .map((publication) => {
            const authors = publication.authors
                .map((author) => (author === AUTHOR ? `<strong>${escapeHtml(author)}</strong>` : escapeHtml(author)))
                .join(', ');

            const links = PUB_LINK_ORDER.filter(([key]) => publication.links && publication.links[key])
                .map(
                    ([key, label]) =>
                        `        <a href="${escapeHtml(publication.links[key])}" target="_blank" rel="noopener noreferrer" class="pub-link">${label}</a>`
                )
                .join('\n');

            return [
                '<li class="publication-item">',
                `    <h3 class="pub-title">${escapeHtml(publication.title)}</h3>`,
                `    <p class="pub-meta">${authors}</p>`,
                `    <p class="pub-meta">${escapeHtml(publication.venue)}, ${publication.year}</p>`,
                ...(links ? ['    <div class="pub-links">', links, '    </div>'] : []),
                '</li>'
            ].join('\n');
        })
        .join('\n');
}

/* --- structured data ------------------------------------------------------ */

// A @graph rather than a bare Person: it lets the publications be first-class
// ScholarlyArticle nodes that point back at the same Person node by @id, which
// is what search engines use to tie an author to a body of work.
function renderJsonLd(publications) {
    const personId = `${SITE_URL}/#person`;

    const person = {
        '@type': 'Person',
        '@id': personId,
        name: AUTHOR,
        givenName: 'Mahmoud',
        familyName: 'Abumandour',
        url: `${SITE_URL}/`,
        image: `${SITE_URL}/files/profile.jpg`,
        jobTitle: 'PhD Candidate',
        description:
            'PhD candidate at Simon Fraser University working on computer architecture, software systems, and the security and reliability of deep learning on edge devices.',
        email: 'mailto:mahmoud_abumandour@sfu.ca',
        affiliation: [
            {
                '@type': 'CollegeOrUniversity',
                name: 'Simon Fraser University',
                url: 'https://www.sfu.ca'
            },
            {
                '@type': 'ResearchOrganization',
                name: 'Max Planck Institute for Security and Privacy',
                url: 'https://www.mpi-sp.org'
            }
        ],
        alumniOf: [
            {
                '@type': 'CollegeOrUniversity',
                name: 'Simon Fraser University',
                url: 'https://www.sfu.ca'
            },
            {
                '@type': 'CollegeOrUniversity',
                name: 'Mansoura University',
                url: 'https://www.mans.edu.eg'
            }
        ],
        knowsAbout: [
            'Computer Architecture',
            'Hardware Security',
            'Fault Injection Attacks',
            'Deep Neural Network Reliability',
            'Bit-Flip Attacks',
            'Edge Computing',
            'Software Systems'
        ],
        sameAs: [
            'https://scholar.google.com/citations?user=p4UydOgAAAAJ&hl=en',
            'https://orcid.org/0009-0004-9188-1882',
            'https://www.linkedin.com/in/abumandour',
            'https://github.com/i3abghany'
        ]
    };

    const website = {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: `${AUTHOR} — Academic Homepage`,
        inLanguage: 'en',
        author: { '@id': personId },
        publisher: { '@id': personId }
    };

    const articles = publications.map((publication) => {
        const node = {
            '@type': 'ScholarlyArticle',
            headline: publication.title,
            name: publication.title,
            author: publication.authors.map((name) =>
                name === AUTHOR ? { '@id': personId } : { '@type': 'Person', name }
            ),
            datePublished: String(publication.year),
            isPartOf: {
                '@type': 'PublicationEvent',
                name: publication.venue
            }
        };

        if (publication.links && publication.links.doi) {
            node.sameAs = publication.links.doi;
        }
        if (publication.links && publication.links.paper) {
            node.url = publication.links.paper.startsWith('http')
                ? publication.links.paper
                : `${SITE_URL}/${publication.links.paper}`;
        }

        return node;
    });

    const graph = { '@context': 'https://schema.org', '@graph': [person, website, ...articles] };

    // </script> cannot appear literally inside a script element, and a lone "<"
    // ends the block in the HTML parser; escaping both keeps arbitrary JSON safe.
    const json = JSON.stringify(graph, null, 4).replace(/</g, '\\u003c');

    return `<script type="application/ld+json">\n${json}\n</script>`;
}

/* --- sitemap -------------------------------------------------------------- */

// lastmod is the newest news date rather than "today", so rebuilding without a
// content change does not tell crawlers the page moved.
function renderSitemap(news) {
    const latest = news.map((entry) => entry.date).sort().pop();

    const url = (loc, priority) =>
        [
            '    <url>',
            `        <loc>${loc}</loc>`,
            `        <lastmod>${latest}</lastmod>`,
            `        <priority>${priority}</priority>`,
            '    </url>'
        ].join('\n');

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        url(`${SITE_URL}/`, '1.0'),
        url(`${SITE_URL}/privacy.html`, '0.1'),
        '</urlset>',
        ''
    ].join('\n');
}

/* --- splice into index.html ----------------------------------------------- */

function replaceBlock(html, marker, body) {
    const begin = `<!-- BEGIN:${marker} -->`;
    const end = `<!-- END:${marker} -->`;
    const pattern = new RegExp(`([ \\t]*)${begin}[\\s\\S]*?${end}`);

    const match = html.match(pattern);
    if (!match) {
        throw new Error(`Marker "${marker}" not found in index.html. Expected ${begin} ... ${end}`);
    }

    const pad = match[1].length;
    const replacement = [
        `${' '.repeat(pad)}${begin}`,
        indent(body, pad),
        `${' '.repeat(pad)}${end}`
    ].join('\n');

    return html.replace(pattern, () => replacement);
}

function main() {
    const news = readJson('news.json');
    const experience = readJson('experience.json');
    const publications = readJson('publications.json');

    let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    html = replaceBlock(html, 'jsonld', renderJsonLd(publications));
    html = replaceBlock(html, 'news', renderNews(news));
    html = replaceBlock(html, 'experience', renderExperience(experience));
    html = replaceBlock(html, 'publications', renderPublications(publications));

    fs.writeFileSync(path.join(ROOT, 'index.html'), html);
    fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), renderSitemap(news));

    console.log(
        `Built index.html (${news.length} news, ${experience.length} experience, ` +
            `${publications.length} publications) and sitemap.xml`
    );
}

main();
