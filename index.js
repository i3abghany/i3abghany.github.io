function wireToggleButton(button) {
    const details = button.nextElementSibling;
    if (!details) return;

    button.setAttribute('aria-expanded', 'false');
    details.hidden = true;

    button.addEventListener('click', () => {
        const isOpen = button.classList.contains('active');
        button.classList.toggle('active', !isOpen);
        button.setAttribute('aria-expanded', String(!isOpen));
        details.classList.toggle('show', !isOpen);
        details.hidden = isOpen;
    });
}

document.querySelectorAll('.toggle-btn').forEach(wireToggleButton);

function parseInlineLinks(text) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    return text.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function formatIsoDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    return new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

fetch('news.json')
    .then((response) => response.json())
    .then((newsEntries) => {
        const newsList = document.getElementById('news-list');
        if (!newsList) {
            return;
        }

        newsEntries
            .sort((a, b) => b.date.localeCompare(a.date))
            .forEach((entry) => {
                const li = document.createElement('li');
                li.className = 'news-item';

                const titleContent = entry.link
                    ? `<a href="${entry.link}" target="_blank" rel="noopener noreferrer">${entry.title}</a>`
                    : entry.title;

                li.innerHTML = `
                    <p class="news-date">${formatIsoDate(entry.date)}</p>
                    <div class="news-copy">
                        <p class="news-title">${titleContent}</p>
                        <p class="news-desc">${parseInlineLinks(entry.description)}</p>
                    </div>
                `;

                newsList.appendChild(li);
            });
    })
    .catch((error) => {
        console.error('Error loading news:', error);
    });

fetch('experience.json')
    .then((response) => response.json())
    .then((entries) => {
        const list = document.getElementById('experience-list');
        if (!list) return;

        entries.forEach((entry) => {
            const li = document.createElement('li');

            const detailsHtml = entry.details
                .map((d) => `<li>${parseInlineLinks(d)}</li>`)
                .join('');

            li.innerHTML = `
                <button class="toggle-btn">${entry.start} - ${entry.end} / <strong>${entry.title}</strong>, ${entry.organization}</button>
                <ul class="hidden-details">${detailsHtml}</ul>
            `;

            list.appendChild(li);
            wireToggleButton(li.querySelector('.toggle-btn'));
        });
    })
    .catch((error) => {
        console.error('Error loading experience:', error);
    });

fetch('publications.json')
    .then((response) => response.json())
    .then((publications) => {
        const publicationsList = document.getElementById('publications-list');
        if (!publicationsList) {
            return;
        }

        publications.forEach((publication) => {
            const li = document.createElement('li');
            li.className = 'publication-item';

            const formattedAuthors = publication.authors
                .map((author) => (author === 'Mahmoud Abumandour' ? `<strong>${author}</strong>` : author))
                .join(', ');

            const linkOrder = [
                ['paper', 'Paper'],
                ['code', 'Code'],
                ['video', 'Video'],
                ['doi', 'DOI'],
                ['slides', 'Slides']
            ];

            const linksHtml = (publication.links ? linkOrder : [])
                .filter(([key]) => publication.links[key])
                .map(
                    ([key, label]) =>
                        `<a href="${publication.links[key]}" target="_blank" rel="noopener noreferrer" class="pub-link">${label}</a>`
                )
                .join('');

            li.innerHTML = `
                <p class="pub-title">${publication.title}</p>
                <p class="pub-meta">${formattedAuthors}</p>
                <p class="pub-meta">${publication.venue}, ${publication.year}</p>
                ${linksHtml ? `<div class="pub-links">${linksHtml}</div>` : ''}
            `;

            publicationsList.appendChild(li);
        });
    })
    .catch((error) => {
        console.error('Error loading publications:', error);
    });
