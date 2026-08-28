/* Colour-theme toggle, shared by index.html and privacy.html.
 *
 * The stored value is a single string, 'dark' or 'light'. It is written only in
 * response to the visitor clicking the toggle, it never leaves the browser, and it
 * is not used to identify or track anyone - so it is exempt from consent under the
 * "strictly necessary for a service explicitly requested by the user" carve-out in
 * Article 5(3) of the ePrivacy Directive. Keep it that way: do not add anything
 * here that persists an identifier or reports to a server. */

const toggleButton = document.getElementById('dark-mode-toggle');
const storedTheme = localStorage.getItem('theme');

if (storedTheme === 'dark') {
    document.body.classList.add('dark-mode');
}

if (toggleButton) {
    toggleButton.textContent = document.body.classList.contains('dark-mode') ? 'Day' : 'Moon';

    toggleButton.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        toggleButton.textContent = isDark ? 'Day' : 'Moon';
    });
}
