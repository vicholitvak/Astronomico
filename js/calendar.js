/* ============================================
   ATACAMA DARK SKY — Calendar Component
   Extracted from index-old.html (lines 1685-2226)
   Moon phases, blocked dates, astronomical events,
   date selection. Zero logic changes.
   ============================================ */

// Algoritmo preciso basado en porcentaje de iluminación lunar
function getMoonPhase(date) {
    // Referencia astronómica precisa: Luna nueva del 6 de enero 2000, 18:14 UTC
    const referenceNewMoon = new Date('2000-01-06T18:14:00Z');
    const lunarCycle = 29.530588853; // Período sinódico lunar en días

    // Calcular días desde la referencia
    const daysSinceReference = (date - referenceNewMoon) / (1000 * 60 * 60 * 24);

    // Obtener la fase actual en el ciclo (0 = luna nueva, 0.5 = luna llena)
    const phase = (daysSinceReference / lunarCycle) % 1;
    const normalizedPhase = phase < 0 ? phase + 1 : phase;

    // Calcular porcentaje de iluminación
    let illumination;
    if (normalizedPhase <= 0.5) {
        illumination = normalizedPhase * 2 * 100;
    } else {
        illumination = (2 - normalizedPhase * 2) * 100;
    }

    illumination = Math.round(illumination * 10) / 10;

    // Determinar disponibilidad basada en iluminación y fase
    let isNearFullMoon = false;
    if (normalizedPhase <= 0.5) {
        isNearFullMoon = illumination > 75;
    } else {
        isNearFullMoon = illumination > 90;
    }

    let daysFromFullMoon;
    if (normalizedPhase <= 0.5) {
        daysFromFullMoon = (0.5 - normalizedPhase) * lunarCycle;
    } else {
        daysFromFullMoon = (normalizedPhase - 0.5) * lunarCycle;
    }

    let phaseIndex, phaseName, emoji;

    if (illumination < 1) {
        phaseIndex = 0; phaseName = 'Nueva'; emoji = '🌑';
    } else if (illumination < 25) {
        phaseIndex = normalizedPhase < 0.5 ? 1 : 7;
        phaseName = normalizedPhase < 0.5 ? 'Creciente' : 'Menguante';
        emoji = normalizedPhase < 0.5 ? '🌒' : '🌘';
    } else if (illumination < 45) {
        phaseIndex = normalizedPhase < 0.5 ? 2 : 6;
        phaseName = normalizedPhase < 0.5 ? 'Cuarto Creciente' : 'Cuarto Menguante';
        emoji = normalizedPhase < 0.5 ? '🌓' : '🌗';
    } else if (illumination < 95) {
        phaseIndex = normalizedPhase < 0.5 ? 3 : 5;
        phaseName = normalizedPhase < 0.5 ? 'Gibosa Creciente' : 'Gibosa Menguante';
        emoji = normalizedPhase < 0.5 ? '🌔' : '🌖';
    } else {
        phaseIndex = 4; phaseName = 'Llena'; emoji = '🌕';
    }

    return {
        emoji: emoji,
        name: phaseName,
        illumination: illumination,
        isNearFullMoon: isNearFullMoon,
        daysFromFull: Math.round(daysFromFullMoon * 10) / 10,
        phase: normalizedPhase,
        isFullMoon: illumination > 95,
        isNewMoon: illumination < 5
    };
}

// Verificar si es fecha pasada
function isPastDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return checkDate <= yesterday;
}

// Verificar disponibilidad de fecha
function isDateAvailable(date) {
    if (isPastDate(date)) return false;
    const moonPhase = getMoonPhase(date);
    return !moonPhase.isNearFullMoon;
}

// Variables globales del calendario
let currentDate = new Date();
let selectedDate = null;

// Eventos astronómicos 2025-2026 visibles durante los tours
const astronomicalEvents = {
    '2025-12-13': { type: 'meteor', emoji: '☄️', es: 'Gemínidas', en: 'Geminids', pt: 'Geminídeas' },
    '2025-12-14': { type: 'meteor', emoji: '☄️', es: 'Gemínidas', en: 'Geminids', pt: 'Geminídeas' },
    '2026-01-03': { type: 'supermoon', emoji: '🌕', es: 'Superluna', en: 'Supermoon', pt: 'Superlua' },
    '2026-01-10': { type: 'planet', emoji: '🪐', es: 'Júpiter Oposición', en: 'Jupiter Opposition', pt: 'Júpiter Oposição' },
    '2026-03-03': { type: 'eclipse', emoji: '🌑', es: 'Eclipse Lunar Total', en: 'Total Lunar Eclipse', pt: 'Eclipse Lunar Total' },
    '2026-04-22': { type: 'meteor', emoji: '☄️', es: 'Líridas', en: 'Lyrids', pt: 'Líridas' },
    '2026-04-23': { type: 'meteor', emoji: '☄️', es: 'Líridas', en: 'Lyrids', pt: 'Líridas' },
    '2026-05-31': { type: 'special', emoji: '🔵', es: 'Luna Azul', en: 'Blue Moon', pt: 'Lua Azul' },
    '2026-06-21': { type: 'special', emoji: '🌌', es: 'Solsticio Invierno', en: 'Winter Solstice', pt: 'Solstício Inverno' },
    '2026-08-12': { type: 'meteor', emoji: '☄️', es: 'Perseidas ⭐', en: 'Perseids ⭐', pt: 'Perseidas ⭐' },
    '2026-08-13': { type: 'meteor', emoji: '☄️', es: 'Perseidas ⭐', en: 'Perseids ⭐', pt: 'Perseidas ⭐' },
    '2026-09-07': { type: 'eclipse', emoji: '🌗', es: 'Eclipse Lunar Parcial', en: 'Partial Lunar Eclipse', pt: 'Eclipse Lunar Parcial' },
    '2026-10-21': { type: 'meteor', emoji: '☄️', es: 'Oriónidas', en: 'Orionids', pt: 'Orionídeas' },
    '2026-10-22': { type: 'meteor', emoji: '☄️', es: 'Oriónidas', en: 'Orionids', pt: 'Orionídeas' },
    '2026-11-24': { type: 'supermoon', emoji: '🌕', es: 'Superluna', en: 'Supermoon', pt: 'Superlua' },
    '2026-12-13': { type: 'meteor', emoji: '☄️', es: 'Gemínidas', en: 'Geminids', pt: 'Geminídeas' },
    '2026-12-14': { type: 'meteor', emoji: '☄️', es: 'Gemínidas', en: 'Geminids', pt: 'Geminídeas' },
    '2026-12-23': { type: 'supermoon', emoji: '🌕', es: 'Superluna', en: 'Supermoon', pt: 'Superlua' }
};

function getAstronomicalEvent(date) {
    const dateStr = date.toISOString().split('T')[0];
    return astronomicalEvents[dateStr] || null;
}

function getCalendarText(key, lang) {
    const texts = {
        es: {
            available: 'Disponible - Condiciones óptimas',
            unavailable: 'No disponible - Luna muy brillante',
            info: '🌒 Creciente: bloqueado si >75% iluminación | 🌖 Menguante: bloqueado si >90% iluminación',
            dateSelected: 'Fecha Seleccionada',
            excellentConditions: 'Condiciones excelentes para observación estelar',
            notAvailableTitle: 'Fecha no disponible para tours.',
            crescentBright: 'La luna creciente está muy brillante',
            almostFull: 'La luna está casi llena',
            selectOther: 'Selecciona otra fecha con menos iluminación lunar.',
            availableOptimal: 'Disponible - Condiciones óptimas',
            crescentBlocked: 'No disponible - Luna creciente muy brillante (>75%)',
            fullBlocked: 'No disponible - Luna casi llena (>90%)'
        },
        en: {
            available: 'Available - Optimal conditions',
            unavailable: 'Not available - Moon too bright',
            info: '🌒 Waxing: blocked if >75% illumination | 🌖 Waning: blocked if >90% illumination',
            dateSelected: 'Date Selected',
            excellentConditions: 'Excellent conditions for stargazing',
            notAvailableTitle: 'Date not available for tours.',
            crescentBright: 'The waxing moon is very bright',
            almostFull: 'The moon is almost full',
            selectOther: 'Please select another date with less lunar illumination.',
            availableOptimal: 'Available - Optimal conditions',
            crescentBlocked: 'Not available - Waxing moon too bright (>75%)',
            fullBlocked: 'Not available - Moon almost full (>90%)'
        },
        pt: {
            available: 'Disponível - Condições ótimas',
            unavailable: 'Não disponível - Lua muito brilhante',
            info: '🌒 Crescente: bloqueado se >75% iluminação | 🌖 Minguante: bloqueado se >90% iluminação',
            dateSelected: 'Data Selecionada',
            excellentConditions: 'Condições excelentes para observação estelar',
            notAvailableTitle: 'Data não disponível para tours.',
            crescentBright: 'A lua crescente está muito brilhante',
            almostFull: 'A lua está quase cheia',
            selectOther: 'Selecione outra data com menos iluminação lunar.',
            availableOptimal: 'Disponível - Condições ótimas',
            crescentBlocked: 'Não disponível - Lua crescente muito brilhante (>75%)',
            fullBlocked: 'Não disponível - Lua quase cheia (>90%)'
        }
    };

    return texts[lang] && texts[lang][key] ? texts[lang][key] : texts['es'][key];
}

// Fechas bloqueadas desde el admin
let blockedDatesFromAdmin = [];
let blockedDatesData = {};

// Inicializar calendario cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    // Only init if the calendar container exists on this page
    if (document.getElementById('fullcalendar')) {
        loadBlockedDatesAndInitCalendar();
    }
});

async function loadBlockedDatesAndInitCalendar() {
    try {
        const response = await fetch('/api/admin-data?type=blocked');
        const data = await response.json();
        if (data.success && data.data) {
            blockedDatesFromAdmin = data.data.map(d => d.blocked_date.split('T')[0]);
            data.data.forEach(d => {
                const dateStr = d.blocked_date.split('T')[0];
                blockedDatesData[dateStr] = {
                    block_type: d.block_type || 'full',
                    reason: d.reason
                };
            });
        }
    } catch (error) {
        console.error('Error loading blocked dates:', error);
    }
    createCustomCalendar();
}

function createCustomCalendar() {
    const calendarEl = document.getElementById('fullcalendar');
    if (!calendarEl) return;
    renderCalendar();
}

function isBlockedByAdmin(date) {
    const dateStr = date.toISOString().split('T')[0];
    return blockedDatesFromAdmin.includes(dateStr);
}

function isLatePrivateOnly(date) {
    const dateStr = date.toISOString().split('T')[0];
    return blockedDatesData[dateStr]?.block_type === 'late_private_only';
}

function isFullyBlocked(date) {
    const dateStr = date.toISOString().split('T')[0];
    const data = blockedDatesData[dateStr];
    return data && data.block_type !== 'late_private_only';
}

function renderCalendar() {
    const calendarEl = document.getElementById('fullcalendar');
    if (!calendarEl) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const currentLang = localStorage.getItem('preferred-language') || 'es';

    const monthNames = {
        es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        en: ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'],
        pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    };

    const daysOfWeek = {
        es: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        pt: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
    };

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    let calendarHTML = `
        <div class="custom-calendar">
            <div class="calendar-header">
                <button class="nav-btn" onclick="changeMonth(-1)">&#8249;</button>
                <h3>${monthNames[currentLang][month]} ${year}</h3>
                <button class="nav-btn" onclick="changeMonth(1)">&#8250;</button>
            </div>

            <div class="calendar-weekdays">
                ${daysOfWeek[currentLang].map(day => `<div class="weekday">${day}</div>`).join('')}
            </div>

            <div class="calendar-days">
    `;

    for (let i = 0; i < startDay; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const moonPhase = getMoonPhase(date);
        const isPast = isPastDate(date);
        const isAvailable = isDateAvailable(date);
        const isCurrentDay = isToday(date);
        const isSelected = selectedDate && isSameDay(date, selectedDate);
        const isAdminBlocked = isBlockedByAdmin(date);
        const latePrivateOnly = isLatePrivateOnly(date);
        const fullyBlocked = isFullyBlocked(date);
        const astroEvent = getAstronomicalEvent(date);

        let dayClass = 'calendar-day';
        if (isPast) dayClass += ' past';
        else if (fullyBlocked) dayClass += ' sold-out';
        else if (latePrivateOnly) dayClass += ' late-private-only';
        else if (!isAvailable) dayClass += ' unavailable-moon';
        if (isCurrentDay) dayClass += ' today';
        if (isSelected) dayClass += ' selected';

        const pastTexts = { es: 'Fecha pasada', en: 'Past date', pt: 'Data passada' };

        let availabilityText;
        if (isPast) {
            availabilityText = pastTexts[currentLang];
        } else if (fullyBlocked) {
            availabilityText = currentLang === 'en' ? 'Sold out' : currentLang === 'pt' ? 'Esgotado' : 'Lleno';
        } else if (latePrivateOnly) {
            availabilityText = currentLang === 'en' ? '1st slot full - 2nd slot available (00:00)' : currentLang === 'pt' ? '1º turno cheio - 2º turno disponível (00:00)' : '1er turno lleno - 2do turno disponible (00:00)';
        } else if (isAvailable) {
            availabilityText = getCalendarText('availableOptimal', currentLang);
        } else {
            if (moonPhase.phase <= 0.5) {
                availabilityText = getCalendarText('crescentBlocked', currentLang);
            } else {
                availabilityText = getCalendarText('fullBlocked', currentLang);
            }
        }

        let statusLabel = '';
        const secondTurnTexts = { es: '2do turno', en: '2nd slot', pt: '2º turno' };
        if (fullyBlocked) {
            statusLabel = `<span class="sold-out-label">${currentLang === 'en' ? 'FULL' : currentLang === 'pt' ? 'CHEIO' : 'LLENO'}</span>`;
        } else if (latePrivateOnly) {
            statusLabel = `<span class="late-private-label">${secondTurnTexts[currentLang]}</span>`;
        }

        const clickAction = (fullyBlocked || isPast) ? '' : `selectDate(${year}, ${month}, ${day})`;

        let eventLabel = '';
        if (astroEvent && !isPast) {
            const eventName = astroEvent[currentLang] || astroEvent.en;
            eventLabel = `<span class="astro-event astro-event-${astroEvent.type}" title="${eventName}">${astroEvent.emoji}</span>`;
            dayClass += ' has-event';
        }

        calendarHTML += `
            <div class="${dayClass}" onclick="${clickAction}"
                 title="${moonPhase.name} ${moonPhase.emoji} - ${moonPhase.illumination}% iluminación - ${availabilityText}${astroEvent ? ' - ' + (astroEvent[currentLang] || astroEvent.en) : ''}">
                <span class="day-number">${day}</span>
                ${eventLabel}
                ${statusLabel}
                <span class="moon-emoji">${moonPhase.emoji}</span>
            </div>
        `;
    }

    const legendTexts = {
        es: {
            available: 'Disponible', full: 'Lleno', secondSlot: '2do turno disponible',
            unavailableMoon: 'No disponible por luna', past: 'Fecha pasada', selected: 'Seleccionado',
            meteor: 'Lluvia de estrellas', eclipse: 'Eclipse', supermoon: 'Superluna',
            planet: 'Evento planetario', special: 'Evento especial'
        },
        en: {
            available: 'Available', full: 'Sold out', secondSlot: '2nd slot available',
            unavailableMoon: 'Unavailable (moon)', past: 'Past date', selected: 'Selected',
            meteor: 'Meteor shower', eclipse: 'Eclipse', supermoon: 'Supermoon',
            planet: 'Planet event', special: 'Special event'
        },
        pt: {
            available: 'Disponível', full: 'Esgotado', secondSlot: '2º turno disponível',
            unavailableMoon: 'Indisponível (lua)', past: 'Data passada', selected: 'Selecionado',
            meteor: 'Chuva de meteoros', eclipse: 'Eclipse', supermoon: 'Superlua',
            planet: 'Evento planetário', special: 'Evento especial'
        }
    };
    const lt = legendTexts[currentLang];

    calendarHTML += `
                </div>
                <div class="calendar-legend">
                    <div class="legend-item"><span class="legend-dot available"></span><span>${lt.available}</span></div>
                    <div class="legend-item"><span class="legend-dot selected"></span><span>${lt.selected}</span></div>
                    <div class="legend-item"><span class="legend-dot late-private"></span><span>${lt.secondSlot}</span></div>
                    <div class="legend-item"><span class="legend-dot sold-out"></span><span>${lt.full}</span></div>
                    <div class="legend-item"><span class="legend-dot unavailable-moon"></span><span>${lt.unavailableMoon}</span></div>
                    <div class="legend-item"><span class="legend-dot past"></span><span>${lt.past}</span></div>
                </div>
                <div class="legend-events">
                    <div class="legend-event-item"><span class="event-icon">☄️</span><span>${lt.meteor}</span></div>
                    <div class="legend-event-item"><span class="event-icon">🌑</span><span>${lt.eclipse}</span></div>
                    <div class="legend-event-item"><span class="event-icon">🌕</span><span>${lt.supermoon}</span></div>
                    <div class="legend-event-item"><span class="event-icon">🪐</span><span>${lt.planet}</span></div>
                    <div class="legend-event-item"><span class="event-icon">🔵</span><span>${lt.special}</span></div>
                </div>
            </div>
    `;

    calendarEl.innerHTML = calendarHTML;
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

function selectDate(year, month, day) {
    const date = new Date(year, month, day);
    const isLatePrivate = isLatePrivateOnly(date);

    // Configurar opciones de tour según disponibilidad
    const tourTypeSelect = document.getElementById('tour-type');
    if (tourTypeSelect) {
        if (isLatePrivate) {
            const currentLang = localStorage.getItem('preferred-language') || 'es';
            const latePrivateTexts = {
                es: 'Tour Privado 2do Turno (00:00)',
                en: 'Private Tour 2nd Slot (00:00)',
                pt: 'Tour Privado 2º Turno (00:00)'
            };
            tourTypeSelect.innerHTML = `<option value="private_late">${latePrivateTexts[currentLang]}</option>`;
            tourTypeSelect.value = 'private_late';
            const infoMsg = {
                es: 'El primer turno (21:00) ya está reservado.\n\nDisponible: Tour Privado en segundo turno a medianoche (00:00).',
                en: 'The first slot (9:00 PM) is already booked.\n\nAvailable: Private Tour second slot at midnight (00:00).',
                pt: 'O primeiro turno (21:00) já está reservado.\n\nDisponível: Tour Privado no segundo turno à meia-noite (00:00).'
            };
            alert(infoMsg[currentLang]);
        } else {
            const currentLang = localStorage.getItem('preferred-language') || 'es';
            const tourOptions = {
                es: ['Selecciona tipo de tour', 'Expedición Privada a Vallecito'],
                en: ['Select tour type', 'Private Expedition to Vallecito'],
                pt: ['Selecione tipo de tour', 'Expedição Privada a Vallecito']
            };
            tourTypeSelect.innerHTML = `
                <option value="">${tourOptions[currentLang][0]}</option>
                <option value="private">${tourOptions[currentLang][1]}</option>
            `;
        }
    }

    if (!isDateAvailable(date) && !isLatePrivate) {
        const moonPhase = getMoonPhase(date);
        const currentLang = localStorage.getItem('preferred-language') || 'es';
        let reason;
        if (moonPhase.phase <= 0.5) {
            reason = `${getCalendarText('crescentBright', currentLang)} (${moonPhase.illumination}%)`;
        } else {
            reason = `${getCalendarText('almostFull', currentLang)} (${moonPhase.illumination}%)`;
        }
        alert(`${getCalendarText('notAvailableTitle', currentLang)}\n\n${moonPhase.name} ${moonPhase.emoji} - ${moonPhase.illumination}%\n\n${reason}\n\n${getCalendarText('selectOther', currentLang)}`);
        return;
    }

    selectedDate = date;
    renderCalendar();

    // Actualizar campo de fecha del formulario
    const dateInput = document.getElementById('selected-date');
    if (dateInput) {
        const dateStr = date.toISOString().split('T')[0];
        dateInput.value = dateStr;
        dateInput.dispatchEvent(new Event('change'));
    }

    // Update display
    const displayElement = document.getElementById('selected-date-display');
    if (displayElement) {
        const currentLang = localStorage.getItem('preferred-language') || 'es';
        const moonPhase = getMoonPhase(date);
        const dateStr = date.toLocaleDateString(currentLang === 'en' ? 'en-US' : currentLang === 'pt' ? 'pt-BR' : 'es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const illuminationLabel = currentLang === 'en' ? 'illumination' : currentLang === 'pt' ? 'iluminação' : 'iluminación';

        displayElement.innerHTML = `
            <div class="selected-datetime">
                <i class="fas fa-check-circle"></i>
                <h5>${currentLang === 'en' ? 'Date selected!' : currentLang === 'pt' ? 'Data selecionada!' : '¡Fecha seleccionada!'}</h5>
                <p><strong>${dateStr}</strong></p>
                <p>${moonPhase.emoji} ${moonPhase.name} - ${moonPhase.illumination}% ${illuminationLabel}</p>
                <small>${currentLang === 'en' ? 'Excellent conditions for stargazing' : currentLang === 'pt' ? 'Excelentes condições para observar estrelas' : 'Excelentes condiciones para observar estrellas'}</small>
            </div>
        `;
        displayElement.classList.add('has-date');
    }
}

function isToday(date) {
    const today = new Date();
    return isSameDay(date, today);
}

function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
}
