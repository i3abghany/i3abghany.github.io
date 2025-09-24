document.querySelectorAll('.toggle-btn').forEach(button => {
    button.addEventListener('click', () => {
        const details = button.nextElementSibling;
        details.style.display = details.style.display === 'block' ? 'none' : 'block';
    });
});

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