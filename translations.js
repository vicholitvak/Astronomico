// Sistema de traducciones para Atacama NightSky
const translations = {
    es: {
        // Navigation
        'nav.home': 'Inicio',
        'nav.tours': 'Tours',
        'nav.gallery': 'Galería',
        'nav.about': 'Nosotros',
        'nav.faq': 'Preguntas',
        'nav.booking': 'Reservar',
        'nav.contact': 'Contacto',

        // Hero Section
        'hero.title': 'Observa el Universo con el Cielo Más Claro del Mundo',
        'hero.subtitle': 'Tours astronómicos profesionales en San Pedro de Atacama con telescopios Unistellar de última generación',
        'hero.cta': 'Reservar Ahora',

        // Booking Section
        'booking.title': 'Reserva Tu Experiencia Astronómica',
        'booking.subtitle': 'Selecciona tu fecha, completa tus datos y te confirmaremos en 24 horas',
        'booking.selectDate': 'Selecciona tu Fecha',
        'booking.availableDates': 'Fechas disponibles',
        'booking.unavailable': 'No disponible (luna llena ± 3 días)',
        'booking.moonPhases': 'Fases de la luna',
        'booking.selectDateMsg': 'Selecciona una fecha en el calendario para continuar',
        'booking.yourData': 'Datos de tu Reserva',
        'booking.persons': 'Número de Personas',
        'booking.selectQuantity': 'Selecciona cantidad',
        'booking.tourType': 'Tipo de Tour',
        'booking.selectTour': 'Selecciona tipo de tour',
        'booking.tourRegular': 'Tour Regular (Grupo)',
        'booking.tourPrivate': 'Tour Privado (Solo tu grupo)',
        'booking.tourAstro': 'Tour Astrofotográfico (Especializado)',
        'booking.contactInfo': 'Información de Contacto',
        'booking.fullName': 'Nombre Completo',
        'booking.email': 'Email',
        'booking.phone': 'Teléfono/WhatsApp',
        'booking.accommodation': 'Hostal o Dirección de Alojamiento (Opcional)',
        'booking.accommodationPlaceholder': 'Ej: Hostel Luna Atacama, Hotel del Desierto, etc.',
        'booking.accommodationHelp': 'Opcional: para enviarte indicaciones de cómo llegar a Plaza Apacheta',
        'booking.additionalMsg': 'Mensaje Adicional',
        'booking.messagePlaceholder': '¿Alguna pregunta o requerimiento especial?',
        'booking.submit': 'Enviar Reserva',
        'booking.success': '¡Reserva Enviada!',
        'booking.successMsg': 'Te contactaremos dentro de 24 horas para confirmar disponibilidad y detalles del pago.',

        // Booking Info Cards
        'info.schedule': 'Horarios',
        'info.scheduleText': 'Tours desde 20:00 hrs<br>Duración según tour elegido',
        'info.availability': 'Disponibilidad',
        'info.availabilityText': 'Todos los días (excepto luna llena)<br>Sujeto a condiciones climáticas',
        'info.transport': 'Punto de Encuentro',
        'info.transportText': 'Tours regulares: Plaza Apacheta<br>Tours privados: Hotel ida y vuelta',
        'info.payment': 'Pago',
        'info.paymentText': 'Efectivo, Transferencia o Tarjeta<br>Confirmación en 24 horas',

        // Southern Hemisphere Section (for European visitors)
        'tours.southern.title': 'Solo visible desde el Hemisferio Sur',
        'tours.southern.subtitle': 'Objetos celestes que <strong>nunca podrás ver desde Europa o Norteamérica</strong>',
        'tours.southern.cross': 'La constelación más icónica del hemisferio sur',
        'tours.southern.magellanic': 'Galaxias satélite visibles a simple vista',
        'tours.southern.alpha': 'El sistema estelar más cercano al Sol (4.37 años luz)',
        'tours.southern.omega': 'El cúmulo globular más grande y brillante del cielo',
        'tours.southern.info': 'Además: el centro de la Vía Láctea se ve completo y brillante solo desde aquí',

        // Tours Section
        'tours.title': 'Expedición Astronómica Privada',
        'tours.subtitle': 'Una experiencia exclusiva bajo el cielo más oscuro del planeta',

        // Tour Cards - Common
        'tours.includes': 'Incluye:',
        'tours.payBtn': 'Pagar',
        'tours.requestQuote': 'Solicitar Cotización',
        'tours.duration': 'Duración',
        'tours.maxPersons': 'Max personas',

        // Tour Regular - Includes
        'tours.regular.include1': 'Transporte: pickup Plaza Apacheta, regreso a hotel',
        'tours.regular.include2': 'Charla astronómica con puntero láser',
        'tours.regular.include3': 'Telescopio óptico (planetas y Luna)',
        'tours.regular.include4': 'Telescopio digital (nebulosas y galaxias)',
        'tours.regular.include5': 'Cóctel bajo las estrellas',
        'tours.regular.include6': 'Sesión de fotos de recuerdo',
        'tours.regular.duration': '2.5 horas',
        'tours.regular.maxPersons': 'Max 16 personas',

        // Tour Photo - Includes
        'tours.photo.include1': 'Pickup Plaza Apacheta, regreso a hotel',
        'tours.photo.include2': 'Asesoría técnica personalizada',
        'tours.photo.include3': 'Préstamo de trípodes y trackers',
        'tours.photo.include4': 'Taller de edición post-tour',
        'tours.photo.include5': 'Snack y bebidas calientes',
        'tours.photo.duration': '3 horas',
        'tours.photo.maxPersons': 'Max 6 personas',

        // Tour Private - Expedición a Vallecito
        'tours.private.title': 'Expedición Privada a Vallecito',
        'tours.private.desc1': '<strong>Donde termina el camino, comienza el mejor cielo del planeta.</strong> En 4x4 atravesamos el desierto hasta Vallecito, un lugar sin nombre en los mapas donde la escala Bortle marca 1 —oscuridad absoluta, cero contaminación lumínica. Aquí la Vía Láctea proyecta sombras.',
        'tours.private.desc2': 'Te esperan sillas reclinables bajo las estrellas, mantas, telescopio inteligente capturando nebulosas en tiempo real, y un cooler con vino, agua caliente y variedades de té. Sin apuros, sin extraños, sin límites. <strong>El desierto es tuyo por una noche.</strong>',
        'tours.private.include1': 'Transporte 4x4 privado desde tu hotel',
        'tours.private.include2': 'Ubicación exclusiva Bortle 1 en Vallecito',
        'tours.private.include3': 'Telescopio inteligente + cámara astrofotográfica',
        'tours.private.include4': 'Sillas reclinables, mantas y setup completo',
        'tours.private.include5': 'Vino, agua caliente y variedades de té',
        'tours.private.include6': 'Fotos del cielo profundo para llevarte',
        'tours.private.include7': 'Buena compañía',
        'tours.private.duration': '3-4 horas',
        'tours.private.maxPersons': '1-6 personas',
        'tours.private.priceNote': 'Por persona',

        // Tour Study - Includes
        'tours.study.include1': 'Material didáctico especializado',
        'tours.study.include2': 'Charlas magistrales personalizadas',
        'tours.study.include3': 'Actividades grupales interactivas',
        'tours.study.include4': 'Certificados de participación',
        'tours.study.include5': 'Pickup Plaza Apacheta, regreso a hotel',
        'tours.study.duration': '2.5 horas',
        'tours.study.maxPersons': 'Grupos 15-30',

        // Tour Corporate
        'tours.corporate.title': 'Eventos Corporativos',
        'tours.corporate.price': 'Cotizar',
        'tours.corporate.desc': 'Team building que realmente funciona. Bajo el cielo de Atacama, los equipos se conectan de una forma que ninguna sala de reuniones permite. Charla motivacional, actividades grupales, cóctel premium y una experiencia que tu equipo va a recordar.',
        'tours.corporate.include1': 'Charlas motivacionales personalizadas',
        'tours.corporate.include2': 'Actividades de team building',
        'tours.corporate.include3': 'Cóctel y catering premium',
        'tours.corporate.include4': 'Transporte ejecutivo ida y vuelta',
        'tours.corporate.include5': 'Fotografía corporativa profesional',
        'tours.corporate.duration': '4-5 horas',
        'tours.corporate.maxPersons': '10-50 personas',
        'tours.corporate.badge': 'Empresas',

        // Payment Modal
        'checkout.title': '🌟 Asegura tu Cupo Ahora',
        'checkout.subtitle': 'Completa el pago para confirmar tu reserva instantáneamente',
        'checkout.secureBadge': 'Pago 100% Seguro con Mercado Pago',
        'checkout.dateLabel': 'Fecha del Tour *',
        'checkout.personsLabel': 'Número de Personas *',
        'checkout.selectQuantity': 'Selecciona cantidad',
        'checkout.nameLabel': 'Nombre Completo (Persona 1) *',
        'checkout.namePlaceholder': 'Tu nombre completo',
        'checkout.nameHelp': 'Este es quien hace la reserva',
        'checkout.companionsTitle': 'Nombres de Acompañantes',
        'checkout.companionsHelp': 'Necesitamos esta información para la lista de la agencia',
        'checkout.companionLabel': 'Nombre Completo (Persona {n}) *',
        'checkout.companionPlaceholder': 'Nombre completo del acompañante {n}',
        'checkout.emailLabel': 'Email *',
        'checkout.emailPlaceholder': 'tu@email.com',
        'checkout.phoneLabel': 'Teléfono/WhatsApp *',
        'checkout.phonePlaceholder': '+56 9 1234 5678',
        'checkout.accommodationLabel': 'Alojamiento (Opcional)',
        'checkout.accommodationPlaceholder': 'Nombre de tu hotel/hostal',
        'checkout.messageLabel': 'Mensaje Adicional',
        'checkout.messagePlaceholder': '¿Algún requerimiento especial?',
        'checkout.tour': 'Tour:',
        'checkout.pricePerPerson': 'Precio por persona:',
        'checkout.fixedPrice': 'Precio fijo (1-6 personas):',
        'checkout.subtotal': 'Subtotal',
        'checkout.mpFee': 'Tarifa MercadoPago (4.64%):',
        'checkout.totalToPay': 'Total a Pagar:',
        'checkout.payButton': 'Pagar y Asegurar mi Cupo',
        'checkout.redirecting': 'Redirigiendo a Mercado Pago...',
        'checkout.redirectingSecure': 'Redirigiendo a pago seguro...',
        'checkout.person': 'persona',
        'checkout.persons': 'personas',
        'checkout.moreThan16': 'Más de 16 personas (contactar)',
        'checkout.errorProcessing': 'Error al procesar el pago:',
        'checkout.tryAgain': 'Por favor intenta nuevamente o contáctanos por WhatsApp.',
        'checkout.fillAllNames': 'Por favor completa los nombres de todos los participantes:',
        'checkout.needForAgency': 'Necesitamos esta información para la lista de la agencia.',

        // FAQ Section
        'faq.title': 'Preguntas Frecuentes',
        'faq.subtitle': 'Todo lo que necesitas saber antes de tu tour astronómico',

        // Contact Section
        'contact.title': 'Contáctanos',
        'contact.subtitle': 'Estamos aquí para ayudarte a planificar tu experiencia astronómica perfecta',
        'contact.phone': 'Teléfono',
        'contact.email': 'Email',
        'contact.location': 'Ubicación',
        'contact.locationText': 'San Pedro de Atacama, Chile',
        'contact.followUs': 'Síguenos',

        // Footer
        'footer.rights': 'Todos los derechos reservados.',
        'footer.terms': 'Términos y Condiciones',
        'footer.privacy': 'Política de Privacidad'
    },

    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.tours': 'Tours',
        'nav.gallery': 'Gallery',
        'nav.about': 'About',
        'nav.faq': 'FAQ',
        'nav.booking': 'Book Now',
        'nav.contact': 'Contact',

        // Hero Section
        'hero.title': 'Observe the Universe with the World\'s Clearest Sky',
        'hero.subtitle': 'Professional astronomical tours in San Pedro de Atacama with state-of-the-art Unistellar telescopes',
        'hero.cta': 'Book Now',

        // Booking Section
        'booking.title': 'Book Your Astronomical Experience',
        'booking.subtitle': 'Select your date, complete your details and we\'ll confirm within 24 hours',
        'booking.selectDate': 'Select Your Date',
        'booking.availableDates': 'Available dates',
        'booking.unavailable': 'Unavailable (full moon ± 3 days)',
        'booking.moonPhases': 'Moon phases',
        'booking.selectDateMsg': 'Select a date on the calendar to continue',
        'booking.yourData': 'Your Booking Details',
        'booking.persons': 'Number of People',
        'booking.selectQuantity': 'Select quantity',
        'booking.tourType': 'Tour Type',
        'booking.selectTour': 'Select tour type',
        'booking.tourRegular': 'Regular Tour (Group)',
        'booking.tourPrivate': 'Private Tour (Your group only)',
        'booking.tourAstro': 'Astrophotography Tour (Specialized)',
        'booking.contactInfo': 'Contact Information',
        'booking.fullName': 'Full Name',
        'booking.email': 'Email',
        'booking.phone': 'Phone/WhatsApp',
        'booking.accommodation': 'Hotel or Accommodation Address (Optional)',
        'booking.accommodationPlaceholder': 'E.g: Luna Atacama Hostel, Desert Hotel, etc.',
        'booking.accommodationHelp': 'Help us plan better tour logistics (pick-up and drop-off)',
        'booking.additionalMsg': 'Additional Message',
        'booking.messagePlaceholder': 'Any questions or special requirements?',
        'booking.submit': 'Submit Booking',
        'booking.success': 'Booking Sent!',
        'booking.successMsg': 'We will contact you within 24 hours to confirm availability and payment details.',

        // Booking Info Cards
        'info.schedule': 'Schedule',
        'info.scheduleText': 'Tours from 8:00 PM<br>Duration depends on tour',
        'info.availability': 'Availability',
        'info.availabilityText': 'Every day (except full moon)<br>Subject to weather conditions',
        'info.transport': 'Meeting Point',
        'info.transportText': 'Regular tours: Plaza Apacheta<br>Private tours: Hotel pick-up & drop-off',
        'info.payment': 'Payment',
        'info.paymentText': 'Cash, Transfer or Card<br>Confirmation in 24 hours',

        // Southern Hemisphere Section (for European visitors)
        'tours.southern.title': 'Only Visible from the Southern Hemisphere',
        'tours.southern.subtitle': 'Celestial objects you <strong>can never see from Europe or North America</strong>',
        'tours.southern.cross': 'The most iconic constellation of the southern sky',
        'tours.southern.magellanic': 'Satellite galaxies visible to the naked eye',
        'tours.southern.alpha': 'The closest star system to the Sun (4.37 light-years)',
        'tours.southern.omega': 'The largest and brightest globular cluster in the sky',
        'tours.southern.info': 'Plus: the Milky Way\'s center is fully visible and bright only from here',

        // Tours Section
        'tours.title': 'Private Astronomical Expedition',
        'tours.subtitle': 'An exclusive experience under the darkest sky on the planet',

        // Tour Cards - Common
        'tours.includes': 'Includes:',
        'tours.payBtn': 'Pay',
        'tours.requestQuote': 'Request Quote',
        'tours.duration': 'Duration',
        'tours.maxPersons': 'Max people',

        // Tour Regular - Includes
        'tours.regular.include1': 'Transport: pickup Plaza Apacheta, return to hotel',
        'tours.regular.include2': 'Astronomical talk with laser pointer',
        'tours.regular.include3': 'Optical telescope (planets and Moon)',
        'tours.regular.include4': 'Digital telescope (nebulae and galaxies)',
        'tours.regular.include5': 'Cocktail under the stars',
        'tours.regular.include6': 'Souvenir photo session',
        'tours.regular.duration': '2.5 hours',
        'tours.regular.maxPersons': 'Max 16 people',

        // Tour Photo - Includes
        'tours.photo.include1': 'Pickup Plaza Apacheta, return to hotel',
        'tours.photo.include2': 'Personalized technical advice',
        'tours.photo.include3': 'Tripods and trackers available',
        'tours.photo.include4': 'Post-tour editing workshop',
        'tours.photo.include5': 'Snacks and hot drinks',
        'tours.photo.duration': '3 hours',
        'tours.photo.maxPersons': 'Max 6 people',

        // Tour Private - Vallecito Expedition
        'tours.private.title': 'Private Vallecito Expedition',
        'tours.private.desc1': '<strong>Where the road ends, the best sky on Earth begins.</strong> In a 4x4 we cross the desert to Vallecito, a place with no name on maps where the Bortle scale reads 1 —absolute darkness, zero light pollution. Here the Milky Way casts shadows.',
        'tours.private.desc2': 'Reclining chairs under the stars await you, blankets, smart telescope capturing nebulae in real time, and a cooler with wine, hot water and tea varieties. No rush, no strangers, no limits. <strong>The desert is yours for a night.</strong>',
        'tours.private.include1': 'Private 4x4 transport from your hotel',
        'tours.private.include2': 'Exclusive Bortle 1 location in Vallecito',
        'tours.private.include3': 'Smart telescope + astrophotography camera',
        'tours.private.include4': 'Reclining chairs, blankets and full setup',
        'tours.private.include5': 'Wine, hot water and tea varieties',
        'tours.private.include6': 'Deep sky photos to take home',
        'tours.private.include7': 'Good company',
        'tours.private.duration': '3-4 hours',
        'tours.private.maxPersons': '1-6 people',
        'tours.private.priceNote': 'Per person',

        // Tour Study - Includes
        'tours.study.include1': 'Specialized educational materials',
        'tours.study.include2': 'Personalized lectures',
        'tours.study.include3': 'Interactive group activities',
        'tours.study.include4': 'Participation certificates',
        'tours.study.include5': 'Pickup Plaza Apacheta, return to hotel',
        'tours.study.duration': '2.5 hours',
        'tours.study.maxPersons': 'Groups 15-30',

        // Tour Corporate
        'tours.corporate.title': 'Corporate Events',
        'tours.corporate.price': 'Quote',
        'tours.corporate.desc': 'Team building that really works. Under the Atacama sky, teams connect in a way no meeting room allows. Motivational talk, group activities, premium cocktail and an experience your team will remember.',
        'tours.corporate.include1': 'Personalized motivational talks',
        'tours.corporate.include2': 'Team building activities',
        'tours.corporate.include3': 'Premium cocktail and catering',
        'tours.corporate.include4': 'Executive round-trip transport',
        'tours.corporate.include5': 'Professional corporate photography',
        'tours.corporate.duration': '4-5 hours',
        'tours.corporate.maxPersons': '10-50 people',
        'tours.corporate.badge': 'Business',

        // Payment Modal
        'checkout.title': '🌟 Secure Your Spot Now',
        'checkout.subtitle': 'Complete payment to instantly confirm your booking',
        'checkout.secureBadge': '100% Secure Payment with Mercado Pago',
        'checkout.dateLabel': 'Tour Date *',
        'checkout.personsLabel': 'Number of People *',
        'checkout.selectQuantity': 'Select quantity',
        'checkout.nameLabel': 'Full Name (Person 1) *',
        'checkout.namePlaceholder': 'Your full name',
        'checkout.nameHelp': 'This is the person making the booking',
        'checkout.companionsTitle': 'Companion Names',
        'checkout.companionsHelp': 'We need this information for the agency list',
        'checkout.companionLabel': 'Full Name (Person {n}) *',
        'checkout.companionPlaceholder': 'Full name of companion {n}',
        'checkout.emailLabel': 'Email *',
        'checkout.emailPlaceholder': 'your@email.com',
        'checkout.phoneLabel': 'Phone/WhatsApp *',
        'checkout.phonePlaceholder': '+1 234 567 8900',
        'checkout.accommodationLabel': 'Accommodation (Optional)',
        'checkout.accommodationPlaceholder': 'Name of your hotel/hostel',
        'checkout.messageLabel': 'Additional Message',
        'checkout.messagePlaceholder': 'Any special requirements?',
        'checkout.tour': 'Tour:',
        'checkout.pricePerPerson': 'Price per person:',
        'checkout.fixedPrice': 'Fixed price (1-6 people):',
        'checkout.subtotal': 'Subtotal',
        'checkout.mpFee': 'MercadoPago Fee (4.64%):',
        'checkout.totalToPay': 'Total to Pay:',
        'checkout.payButton': 'Pay and Secure My Spot',
        'checkout.redirecting': 'Redirecting to Mercado Pago...',
        'checkout.redirectingSecure': 'Redirecting to secure payment...',
        'checkout.person': 'person',
        'checkout.persons': 'people',
        'checkout.moreThan16': 'More than 16 people (contact us)',
        'checkout.errorProcessing': 'Error processing payment:',
        'checkout.tryAgain': 'Please try again or contact us via WhatsApp.',
        'checkout.fillAllNames': 'Please fill in the names of all participants:',
        'checkout.needForAgency': 'We need this information for the agency list.',

        // FAQ Section
        'faq.title': 'Frequently Asked Questions',
        'faq.subtitle': 'Everything you need to know before your astronomical tour',

        // Contact Section
        'contact.title': 'Contact Us',
        'contact.subtitle': 'We\'re here to help you plan your perfect astronomical experience',
        'contact.phone': 'Phone',
        'contact.email': 'Email',
        'contact.location': 'Location',
        'contact.locationText': 'San Pedro de Atacama, Chile',
        'contact.followUs': 'Follow Us',

        // Footer
        'footer.rights': 'All rights reserved.',
        'footer.terms': 'Terms and Conditions',
        'footer.privacy': 'Privacy Policy'
    },

    pt: {
        // Navigation
        'nav.home': 'Início',
        'nav.tours': 'Tours',
        'nav.gallery': 'Galeria',
        'nav.about': 'Sobre',
        'nav.faq': 'Perguntas',
        'nav.booking': 'Reservar',
        'nav.contact': 'Contato',

        // Hero Section
        'hero.title': 'Observe o Universo com o Céu Mais Claro do Mundo',
        'hero.subtitle': 'Tours astronômicos profissionais em San Pedro de Atacama com telescópios Unistellar de última geração',
        'hero.cta': 'Reservar Agora',

        // Booking Section
        'booking.title': 'Reserve Sua Experiência Astronômica',
        'booking.subtitle': 'Selecione sua data, complete seus dados e confirmaremos em 24 horas',
        'booking.selectDate': 'Selecione sua Data',
        'booking.availableDates': 'Datas disponíveis',
        'booking.unavailable': 'Indisponível (lua cheia ± 3 dias)',
        'booking.moonPhases': 'Fases da lua',
        'booking.selectDateMsg': 'Selecione uma data no calendário para continuar',
        'booking.yourData': 'Dados da sua Reserva',
        'booking.persons': 'Número de Pessoas',
        'booking.selectQuantity': 'Selecione quantidade',
        'booking.tourType': 'Tipo de Tour',
        'booking.selectTour': 'Selecione tipo de tour',
        'booking.tourRegular': 'Tour Regular (Grupo)',
        'booking.tourPrivate': 'Tour Privado (Apenas seu grupo)',
        'booking.tourAstro': 'Tour de Astrofotografia (Especializado)',
        'booking.contactInfo': 'Informações de Contato',
        'booking.fullName': 'Nome Completo',
        'booking.email': 'Email',
        'booking.phone': 'Telefone/WhatsApp',
        'booking.accommodation': 'Hotel ou Endereço de Hospedagem (Opcional)',
        'booking.accommodationPlaceholder': 'Ex: Hostel Luna Atacama, Hotel do Deserto, etc.',
        'booking.accommodationHelp': 'Nos ajude a planejar melhor a logística do tour (busca e retorno)',
        'booking.additionalMsg': 'Mensagem Adicional',
        'booking.messagePlaceholder': 'Alguma pergunta ou requisito especial?',
        'booking.submit': 'Enviar Reserva',
        'booking.success': 'Reserva Enviada!',
        'booking.successMsg': 'Entraremos em contato em 24 horas para confirmar disponibilidade e detalhes de pagamento.',

        // Booking Info Cards
        'info.schedule': 'Horários',
        'info.scheduleText': 'Tours a partir das 20:00 hrs<br>Duração conforme tour escolhido',
        'info.availability': 'Disponibilidade',
        'info.availabilityText': 'Todos os dias (exceto lua cheia)<br>Sujeito a condições climáticas',
        'info.transport': 'Ponto de Encontro',
        'info.transportText': 'Tours regulares: Plaza Apacheta<br>Tours privados: Hotel ida e volta',
        'info.payment': 'Pagamento',
        'info.paymentText': 'Dinheiro, Transferência ou Cartão<br>Confirmação em 24 horas',

        // Southern Hemisphere Section
        'tours.southern.title': 'Visível Apenas do Hemisfério Sul',
        'tours.southern.subtitle': 'Objetos celestes que <strong>você nunca poderá ver da Europa ou América do Norte</strong>',
        'tours.southern.cross': 'A constelação mais icônica do hemisfério sul',
        'tours.southern.magellanic': 'Galáxias satélite visíveis a olho nu',
        'tours.southern.alpha': 'O sistema estelar mais próximo do Sol (4,37 anos-luz)',
        'tours.southern.omega': 'O maior e mais brilhante aglomerado globular do céu',
        'tours.southern.info': 'Além disso: o centro da Via Láctea só é totalmente visível e brilhante daqui',

        // Tours Section
        'tours.title': 'Expedição Astronômica Privada',
        'tours.subtitle': 'Uma experiência exclusiva sob o céu mais escuro do planeta',

        // Tour Cards - Common
        'tours.includes': 'Inclui:',
        'tours.payBtn': 'Pagar',
        'tours.requestQuote': 'Solicitar Orçamento',
        'tours.duration': 'Duração',
        'tours.maxPersons': 'Máx pessoas',

        // Tour Regular - Includes
        'tours.regular.include1': 'Transporte: busca Plaza Apacheta, retorno ao hotel',
        'tours.regular.include2': 'Palestra astronômica com ponteiro laser',
        'tours.regular.include3': 'Telescópio óptico (planetas e Lua)',
        'tours.regular.include4': 'Telescópio digital (nebulosas e galáxias)',
        'tours.regular.include5': 'Coquetel sob as estrelas',
        'tours.regular.include6': 'Sessão de fotos de recordação',
        'tours.regular.duration': '2,5 horas',
        'tours.regular.maxPersons': 'Máx 16 pessoas',

        // Tour Photo - Includes
        'tours.photo.include1': 'Busca Plaza Apacheta, retorno ao hotel',
        'tours.photo.include2': 'Assessoria técnica personalizada',
        'tours.photo.include3': 'Empréstimo de tripés e trackers',
        'tours.photo.include4': 'Workshop de edição pós-tour',
        'tours.photo.include5': 'Lanche e bebidas quentes',
        'tours.photo.duration': '3 horas',
        'tours.photo.maxPersons': 'Máx 6 pessoas',

        // Tour Private - Expedição Vallecito
        'tours.private.title': 'Expedição Privada a Vallecito',
        'tours.private.desc1': '<strong>Onde a estrada termina, começa o melhor céu do planeta.</strong> Em 4x4 atravessamos o deserto até Vallecito, um lugar sem nome nos mapas onde a escala Bortle marca 1 —escuridão absoluta, zero poluição luminosa. Aqui a Via Láctea projeta sombras.',
        'tours.private.desc2': 'Te esperam cadeiras reclináveis sob as estrelas, mantas, telescópio inteligente capturando nebulosas em tempo real, e um cooler com vinho, água quente e variedades de chá. Sem pressa, sem estranhos, sem limites. <strong>O deserto é seu por uma noite.</strong>',
        'tours.private.include1': 'Transporte 4x4 privado do seu hotel',
        'tours.private.include2': 'Localização exclusiva Bortle 1 em Vallecito',
        'tours.private.include3': 'Telescópio inteligente + câmera astrofotográfica',
        'tours.private.include4': 'Cadeiras reclináveis, mantas e setup completo',
        'tours.private.include5': 'Vinho, água quente e variedades de chá',
        'tours.private.include6': 'Fotos do céu profundo para levar',
        'tours.private.include7': 'Boa companhia',
        'tours.private.duration': '3-4 horas',
        'tours.private.maxPersons': '1-6 pessoas',
        'tours.private.priceNote': 'Por pessoa',

        // Tour Study - Includes
        'tours.study.include1': 'Material didático especializado',
        'tours.study.include2': 'Palestras personalizadas',
        'tours.study.include3': 'Atividades grupais interativas',
        'tours.study.include4': 'Certificados de participação',
        'tours.study.include5': 'Busca Plaza Apacheta, retorno ao hotel',
        'tours.study.duration': '2,5 horas',
        'tours.study.maxPersons': 'Grupos 15-30',

        // Tour Corporate
        'tours.corporate.title': 'Eventos Corporativos',
        'tours.corporate.price': 'Orçamento',
        'tours.corporate.desc': 'Team building que realmente funciona. Sob o céu do Atacama, equipes se conectam de uma forma que nenhuma sala de reunião permite. Palestra motivacional, atividades em grupo, coquetel premium e uma experiência que sua equipe vai lembrar.',
        'tours.corporate.include1': 'Palestras motivacionais personalizadas',
        'tours.corporate.include2': 'Atividades de team building',
        'tours.corporate.include3': 'Coquetel e catering premium',
        'tours.corporate.include4': 'Transporte executivo ida e volta',
        'tours.corporate.include5': 'Fotografia corporativa profissional',
        'tours.corporate.duration': '4-5 horas',
        'tours.corporate.maxPersons': '10-50 pessoas',
        'tours.corporate.badge': 'Empresas',

        // Payment Modal
        'checkout.title': '🌟 Garanta sua Vaga Agora',
        'checkout.subtitle': 'Complete o pagamento para confirmar sua reserva instantaneamente',
        'checkout.secureBadge': 'Pagamento 100% Seguro com Mercado Pago',
        'checkout.dateLabel': 'Data do Tour *',
        'checkout.personsLabel': 'Número de Pessoas *',
        'checkout.selectQuantity': 'Selecione quantidade',
        'checkout.nameLabel': 'Nome Completo (Pessoa 1) *',
        'checkout.namePlaceholder': 'Seu nome completo',
        'checkout.nameHelp': 'Esta é a pessoa que está fazendo a reserva',
        'checkout.companionsTitle': 'Nomes dos Acompanhantes',
        'checkout.companionsHelp': 'Precisamos desta informação para a lista da agência',
        'checkout.companionLabel': 'Nome Completo (Pessoa {n}) *',
        'checkout.companionPlaceholder': 'Nome completo do acompanhante {n}',
        'checkout.emailLabel': 'Email *',
        'checkout.emailPlaceholder': 'seu@email.com',
        'checkout.phoneLabel': 'Telefone/WhatsApp *',
        'checkout.phonePlaceholder': '+55 11 9999 9999',
        'checkout.accommodationLabel': 'Hospedagem (Opcional)',
        'checkout.accommodationPlaceholder': 'Nome do seu hotel/hostel',
        'checkout.messageLabel': 'Mensagem Adicional',
        'checkout.messagePlaceholder': 'Algum requisito especial?',
        'checkout.tour': 'Tour:',
        'checkout.pricePerPerson': 'Preço por pessoa:',
        'checkout.fixedPrice': 'Preço fixo (1-6 pessoas):',
        'checkout.subtotal': 'Subtotal',
        'checkout.mpFee': 'Taxa MercadoPago (4.64%):',
        'checkout.totalToPay': 'Total a Pagar:',
        'checkout.payButton': 'Pagar e Garantir Minha Vaga',
        'checkout.redirecting': 'Redirecionando para Mercado Pago...',
        'checkout.redirectingSecure': 'Redirecionando para pagamento seguro...',
        'checkout.person': 'pessoa',
        'checkout.persons': 'pessoas',
        'checkout.moreThan16': 'Mais de 16 pessoas (entre em contato)',
        'checkout.errorProcessing': 'Erro ao processar o pagamento:',
        'checkout.tryAgain': 'Por favor tente novamente ou entre em contato pelo WhatsApp.',
        'checkout.fillAllNames': 'Por favor preencha os nomes de todos os participantes:',
        'checkout.needForAgency': 'Precisamos desta informação para a lista da agência.',

        // FAQ Section
        'faq.title': 'Perguntas Frequentes',
        'faq.subtitle': 'Tudo o que você precisa saber antes do seu tour astronômico',

        // Contact Section
        'contact.title': 'Contate-nos',
        'contact.subtitle': 'Estamos aqui para ajudá-lo a planejar sua experiência astronômica perfeita',
        'contact.phone': 'Telefone',
        'contact.email': 'Email',
        'contact.location': 'Localização',
        'contact.locationText': 'San Pedro de Atacama, Chile',
        'contact.followUs': 'Siga-nos',

        // Footer
        'footer.rights': 'Todos os direitos reservados.',
        'footer.terms': 'Termos e Condições',
        'footer.privacy': 'Política de Privacidade'
    }
};

// Language switcher functionality
let currentLanguage = 'es';

function initLanguage() {
    // Get saved language from localStorage or default to Spanish
    const savedLang = localStorage.getItem('preferredLanguage') || 'es';
    currentLanguage = savedLang;

    // Update UI
    document.getElementById('current-lang').textContent = savedLang.toUpperCase();

    // Apply translations
    applyTranslations(savedLang);

    // Setup event listeners
    setupLanguageToggle();
}

function setupLanguageToggle() {
    const langToggle = document.getElementById('lang-toggle');
    const langDropdown = document.getElementById('lang-dropdown');
    const langOptions = document.querySelectorAll('.lang-option');

    // Toggle dropdown
    langToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        langDropdown.classList.remove('show');
    });

    // Language selection
    langOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const lang = option.getAttribute('data-lang');
            switchLanguage(lang);
            langDropdown.classList.remove('show');
        });
    });
}

function switchLanguage(lang) {
    if (lang === currentLanguage) return;

    currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);

    // Update button text
    document.getElementById('current-lang').textContent = lang.toUpperCase();

    // Apply translations
    applyTranslations(lang);
}

function applyTranslations(lang) {
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translations[lang][key];

        if (translation) {
            // Check if it's a placeholder
            if (element.hasAttribute('placeholder')) {
                element.setAttribute('placeholder', translation);
            }
            // Check if it's innerHTML (contains HTML tags)
            else if (translation.includes('<br>') || translation.includes('<')) {
                element.innerHTML = translation;
            }
            // Regular text
            else {
                element.textContent = translation;
            }
        }
    });
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguage);
} else {
    initLanguage();
}
