/* The News, Experience and Publications sections used to be fetched as JSON and
   rendered here. They are now rendered into index.html at build time by
   build.js, so the served markup contains them and crawlers that do not execute
   JavaScript can read them. That also removes three network round-trips from
   first paint.

   What remains is the collapse/expand behaviour, which is genuinely interactive
   and so belongs on the client. The details are marked hidden here rather than
   in the HTML so that the content stays in the markup and visible to anyone
   without JavaScript. */

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
