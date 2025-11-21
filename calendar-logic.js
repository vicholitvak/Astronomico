// ===== DATE PICKER (FULLCALENDAR) =====
function initDatePicker() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    // Check if FullCalendar is loaded
    if (typeof FullCalendar === 'undefined') {
        console.warn('FullCalendar not loaded yet. Retrying in 100ms...');
        setTimeout(initDatePicker, 100);
        return;
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        firstDay: 1, // Monday
        headerToolbar: {
            left: 'prev',
            center: 'title',
            right: 'next'
        },
        selectable: true,
        selectMirror: true,
        validRange: {
            start: new Date().toISOString().split('T')[0] // Disable past dates
        },
        dateClick: function (info) {
            // Remove previous selection
            const prevSelected = document.querySelectorAll('.fc-daygrid-day.selected-date');
            prevSelected.forEach(el => el.classList.remove('selected-date'));

            // Add selection class to clicked day
            if (info.dayEl) {
                info.dayEl.classList.add('selected-date');
            }

            // Update hidden input
            const dateInput = document.getElementById('selected-date');
            if (dateInput) {
                dateInput.value = info.dateStr;
                // Trigger change event for validation
                dateInput.dispatchEvent(new Event('change'));
            }

            // Update visual feedback
            const selectedDateDisplay = document.querySelector('.selected-date-display');
            if (selectedDateDisplay) {
                const date = new Date(info.dateStr + 'T00:00:00');
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                selectedDateDisplay.textContent = date.toLocaleDateString('es-ES', options);
                selectedDateDisplay.classList.add('has-date');
            }
        },
        events: [
            // Example availability (can be dynamic)
            {
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days
                display: 'background',
                color: 'rgba(76, 175, 80, 0.1)',
                classNames: ['available-day']
            }
        ]
    });

    calendar.render();

    // Expose calendar instance if needed
    window.calendarInstance = calendar;
}
