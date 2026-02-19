document.querySelectorAll('.toggle-btn').forEach(button => {
    button.addEventListener('click', () => {
        const details = button.nextElementSibling;
        const isVisible = details.classList.contains('show');

        button.classList.toggle('active');

        if (isVisible) {
            details.classList.remove('show');
            setTimeout(() => details.style.display = 'none', 300); // Wait for animation
        } else {
            details.style.display = 'block';
            setTimeout(() => details.classList.add('show'), 10);
        }
    });
});

const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

document.head.appendChild(style);

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const header = document.querySelector('header');
    if (header) {
        header.style.transform = `translateY(${scrollTop * 0.3}px)`;
        header.style.opacity = Math.max(0.7, 1 - scrollTop / 500);
    }
    lastScrollTop = scrollTop;
}, { passive: true });

const toggleButton = document.getElementById('dark-mode-toggle');

if (localStorage.getItem('dark-mode') === 'enabled') {
    document.body.classList.add('dark-mode');
    toggleButton.textContent = '☀️';
}

toggleButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('dark-mode', 'enabled');
        toggleButton.textContent = '☀️';
    } else {
        localStorage.setItem('dark-mode', 'disabled');
        toggleButton.textContent = '🌙';
    }
});

fetch('news.json')
    .then(response => response.json())
    .then(newsEntries => {
        const newsList = document.getElementById('news-list');
        if (!newsList) return;
        newsEntries.sort((a, b) => b.date.localeCompare(a.date));
        newsEntries.forEach(entry => {
            const li = document.createElement('li');
            li.className = 'news-item';

            function parseInlineLinks(text) {
                const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                return text.replace(linkRegex, '<a href="$2" target="_blank">$1</a>');
            }

            const parsedDescription = parseInlineLinks(entry.description);

            const titleContent = entry.link
                ? `<a href="${entry.link}" target="_blank">${entry.title}</a>`
                : entry.title;

            li.innerHTML = `<span class="news-date">${entry.date}</span>: <strong>${titleContent}</strong><br><span class="news-desc">${parsedDescription}</span>`;
            newsList.appendChild(li);
        });
    })
    .catch(err => {
        console.error('Error loading news:', err);
    });

fetch('publications.json')
    .then(response => response.json())
    .then(publications => {
        const publicationsList = document.getElementById('publications-list');
        if (!publicationsList) return;

        publications.forEach(pub => {
            const li = document.createElement('li');
            li.className = 'publication-item';

            const formattedAuthors = pub.authors.map(author => {
                if (author === 'Mahmoud Abumandour') {
                    return `<strong>${author}</strong>`;
                }
                return author;
            }).join(', ');

            let linksHtml = '';
            if (pub.links) {
                const linkButtons = [];
                if (pub.links.paper) {
                    linkButtons.push(`<a href="${pub.links.paper}" target="_blank" class="pub-link">[PDF]</a>`);
                }
                if (pub.links.code) {
                    linkButtons.push(`<a href="${pub.links.code}" target="_blank" class="pub-link">[Code]</a>`);
                }
                if (pub.links.video) {
                    linkButtons.push(`<a href="${pub.links.video}" target="_blank" class="pub-link">[Video]</a>`);
                }
                if (pub.links.doi) {
                    linkButtons.push(`<a href="${pub.links.doi}" target="_blank" class="pub-link">[DOI]</a>`);
                }
                if (pub.links.slides) {
                    linkButtons.push(`<a href="${pub.links.slides}" target="_blank" class="pub-link">[Slides]</a>`);
                }
                linksHtml = linkButtons.join(' ');
            }

            li.innerHTML = `
                <div class="pub-title">${pub.title}</div>
                <div class="pub-authors">${formattedAuthors}</div>
                <div class="pub-venue">${pub.venue}, ${pub.year}</div>
                ${linksHtml ? `<div class="pub-links">${linksHtml}</div>` : ''}
            `;

            publicationsList.appendChild(li);
        });
    })
    .catch(err => {
        console.error('Error loading publications:', err);
    });
