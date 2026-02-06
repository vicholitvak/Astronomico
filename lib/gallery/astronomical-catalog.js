// Astronomical catalog of ~60 southern sky objects visible from San Pedro de Atacama
// Descriptions vary by observing conditions (excellent, good, standard)

const catalog = {
  // === NEBULAE ===
  'Orion Nebula': {
    catalog: 'M42', type: 'emission nebula',
    constellation: 'Orion', distance: '1,344 ly', magnitude: '4.0',
    ra: '05h 35m', dec: '-05° 23\'',
    descriptions: {
      excellent: 'Under pristine Bortle 1 skies, the Orion Nebula reveals its full extent — wispy tendrils of ionized hydrogen stretching far beyond the Trapezium cluster. The green-tinted core glows vividly, with dark lanes carving through the nebulosity.',
      good: 'The Great Nebula displayed its characteristic wings of glowing gas around the bright Trapezium stars. Subtle color hints were visible in the core region.',
      standard: 'Clearly visible as a fuzzy patch below Orion\'s belt, the nebula showcased its classic fan shape with the four Trapezium stars resolved at its heart.'
    }
  },
  'Carina Nebula': {
    catalog: 'NGC 3372', type: 'emission nebula',
    constellation: 'Carina', distance: '8,500 ly', magnitude: '1.0',
    ra: '10h 45m', dec: '-59° 52\'',
    descriptions: {
      excellent: 'The Carina Nebula was breathtaking — a vast complex of glowing gas four times larger than Orion, with the Keyhole Nebula dark silhouette standing out sharply against the bright emission. Eta Carinae blazed at its heart.',
      good: 'This enormous nebula complex filled the field of view with intricate structure. The dark Keyhole region was clearly defined against the bright background.',
      standard: 'Visible as a large, bright patch in the Milky Way, the Carina Nebula showed its impressive scale with the luminous variable star Eta Carinae at its center.'
    }
  },
  'Tarantula Nebula': {
    catalog: 'NGC 2070', type: 'emission nebula',
    constellation: 'Dorado', distance: '160,000 ly', magnitude: '8.0',
    ra: '05h 38m', dec: '-69° 06\'',
    descriptions: {
      excellent: 'The Tarantula Nebula in the Large Magellanic Cloud was resolved into a stunning web of filaments. This is the most active star-forming region in our galactic neighborhood — if it were as close as Orion, it would cast shadows.',
      good: 'Clearly visible within the LMC, the Tarantula showed its characteristic spider-leg structure with the central R136 star cluster glowing intensely.',
      standard: 'The brightest nebula in the Large Magellanic Cloud was easily spotted, appearing as a luminous knot within the galaxy\'s irregular shape.'
    }
  },
  'Lagoon Nebula': {
    catalog: 'M8', type: 'emission nebula',
    constellation: 'Sagittarius', distance: '4,100 ly', magnitude: '6.0',
    ra: '18h 04m', dec: '-24° 23\'',
    descriptions: {
      excellent: 'The Lagoon Nebula was a masterpiece of light and shadow — the dark lagoon channel splitting the bright nebulosity was razor-sharp, with the Hourglass Nebula glowing intensely at its core.',
      good: 'A beautiful emission nebula with clear structure visible. The dark lane bisecting the nebula was well defined, and the embedded star cluster added sparkle.',
      standard: 'Visible to the naked eye as a fuzzy patch near the Milky Way\'s densest region, the Lagoon Nebula showed its elongated shape in the eyepiece.'
    }
  },
  'Trifid Nebula': {
    catalog: 'M20', type: 'emission/reflection nebula',
    constellation: 'Sagittarius', distance: '5,200 ly', magnitude: '6.3',
    ra: '18h 02m', dec: '-23° 02\'',
    descriptions: {
      excellent: 'The Trifid displayed its three-lobed structure beautifully — dark dust lanes trisecting the red emission nebula were knife-sharp, while the blue reflection component glowed to the north.',
      good: 'The three-part division that gives this nebula its name was clearly visible, with the dark lanes standing out against the brighter emission regions.',
      standard: 'Located near the Lagoon Nebula, the Trifid appeared as a compact glowing cloud with hints of the dark lanes that divide it into three sections.'
    }
  },
  'Omega Nebula': {
    catalog: 'M17', type: 'emission nebula',
    constellation: 'Sagittarius', distance: '5,500 ly', magnitude: '6.0',
    ra: '18h 21m', dec: '-16° 11\'',
    descriptions: {
      excellent: 'The Swan/Omega Nebula revealed extraordinary detail — the bright bar and the swan-neck curve were vivid, with fainter outer regions extending well beyond the core.',
      good: 'The distinctive swan shape was readily apparent, with the bright bar of the nebula showing good contrast against the surrounding sky.',
      standard: 'A bright, compact nebula with a characteristic checkmark or swan shape visible in the eyepiece.'
    }
  },
  'Eagle Nebula': {
    catalog: 'M16', type: 'emission nebula',
    constellation: 'Serpens', distance: '7,000 ly', magnitude: '6.0',
    ra: '18h 19m', dec: '-13° 47\'',
    descriptions: {
      excellent: 'Home to the famous Pillars of Creation, the Eagle Nebula showed wonderful detail. While the pillars themselves require large aperture to resolve, the surrounding emission nebulosity and star cluster were spectacular.',
      good: 'The star cluster embedded in the nebula was well resolved, with the faint glow of the surrounding emission nebula visible as a backdrop.',
      standard: 'The open cluster within the Eagle Nebula was clearly visible, with the faintest hints of the surrounding nebulosity.'
    }
  },
  'Eta Carinae Nebula': {
    catalog: 'NGC 3372', type: 'emission nebula',
    constellation: 'Carina', distance: '8,500 ly', magnitude: '1.0',
    ra: '10h 45m', dec: '-59° 52\'',
    alias: 'Carina Nebula',
    descriptions: {
      excellent: 'The Eta Carinae complex was overwhelming in its detail and scale, with the Homunculus Nebula visible as a tiny bright knot surrounding the unstable hypergiant star.',
      good: 'Eta Carinae and its surrounding nebulosity were impressive, with the star\'s unusual brightness and orange hue clearly visible.',
      standard: 'The region around Eta Carinae showed rich nebulosity even under moderate conditions.'
    }
  },
  'Coal Sack Nebula': {
    catalog: 'Caldwell 99', type: 'dark nebula',
    constellation: 'Crux', distance: '600 ly', magnitude: 'N/A',
    ra: '12h 50m', dec: '-62° 30\'',
    descriptions: {
      excellent: 'The Coal Sack was a stunning void — an ink-black patch against the brilliant Milky Way near the Southern Cross. Its irregular edges were sharply defined, making it one of the most prominent dark nebulae in the sky.',
      good: 'This famous dark nebula was easily visible as a conspicuous dark region near Alpha and Beta Crucis, blocking the light of the Milky Way behind it.',
      standard: 'The Coal Sack appeared as a noticeable dark patch near the Southern Cross, contrasting with the surrounding star fields.'
    }
  },
  'Running Chicken Nebula': {
    catalog: 'IC 2944', type: 'emission nebula',
    constellation: 'Centaurus', distance: '6,500 ly', magnitude: '4.5',
    ra: '11h 38m', dec: '-63° 22\'',
    descriptions: {
      excellent: 'The Running Chicken (Lambda Centauri Nebula) displayed its sprawling emission complex beautifully, with Thackeray\'s Globules — tiny dark clouds — silhouetted against the glowing gas.',
      good: 'A large emission nebula surrounding Lambda Centauri, showing good structure and contrast in the eyepiece.',
      standard: 'The nebulosity around Lambda Centauri was visible, giving a sense of the vast star-forming region in Centaurus.'
    }
  },

  // === GALAXIES ===
  'Large Magellanic Cloud': {
    catalog: 'LMC', type: 'irregular galaxy',
    constellation: 'Dorado/Mensa', distance: '160,000 ly', magnitude: '0.9',
    ra: '05h 24m', dec: '-69° 45\'',
    descriptions: {
      excellent: 'The Large Magellanic Cloud was a jaw-dropping sight — visible as a vast, luminous cloud spanning several degrees. Individual star clusters, nebulae, and the brilliant Tarantula Nebula were all resolved within this satellite galaxy of the Milky Way.',
      good: 'Our nearest galactic neighbor appeared as a large, bright irregular patch with visible structure. The Tarantula Nebula stood out as a bright knot within the galaxy.',
      standard: 'Easily visible to the naked eye as a detached piece of the Milky Way, the LMC showed its irregular shape and brightest star-forming regions.'
    }
  },
  'Small Magellanic Cloud': {
    catalog: 'SMC', type: 'irregular galaxy',
    constellation: 'Tucana', distance: '200,000 ly', magnitude: '2.7',
    ra: '00h 53m', dec: '-72° 50\'',
    descriptions: {
      excellent: 'The Small Magellanic Cloud appeared as a luminous, elongated cloud with visible internal structure. The globular cluster 47 Tucanae blazed nearby, creating a stunning pairing.',
      good: 'Clearly visible as a diffuse patch of light, the SMC showed its elongated shape with some internal brightening.',
      standard: 'Visible to the naked eye as a faint, fuzzy patch near the south celestial pole, the SMC is one of the closest galaxies to our own.'
    }
  },
  'Magellanic Clouds': {
    catalog: 'LMC/SMC', type: 'irregular galaxies',
    constellation: 'Dorado/Tucana', distance: '160,000-200,000 ly', magnitude: '0.9/2.7',
    ra: 'varies', dec: 'varies',
    descriptions: {
      excellent: 'Both Magellanic Clouds were spectacular — two satellite galaxies of the Milky Way hanging in the southern sky like luminous clouds. The LMC revealed individual star clusters and the blazing Tarantula Nebula, while the SMC glowed softly near 47 Tucanae.',
      good: 'The pair of Magellanic Clouds were clearly visible, two irregular patches of light representing our nearest galactic neighbors at 160,000 and 200,000 light-years distant.',
      standard: 'Both Magellanic Clouds were visible to the naked eye as fuzzy patches — two nearby galaxies that are slowly being absorbed by our Milky Way.'
    }
  },
  'Centaurus A': {
    catalog: 'NGC 5128', type: 'elliptical galaxy',
    constellation: 'Centaurus', distance: '12 million ly', magnitude: '6.8',
    ra: '13h 26m', dec: '-43° 01\'',
    descriptions: {
      excellent: 'Centaurus A was magnificent — the prominent dark dust lane bisecting this giant elliptical galaxy was clearly visible, evidence of a past galactic merger. This is the nearest active galaxy and one of the strongest radio sources in the sky.',
      good: 'The galaxy showed its distinctive dark dust band cutting across the bright elliptical halo, making it one of the most recognizable galaxies in the southern sky.',
      standard: 'Visible as a fuzzy elliptical glow with a hint of the famous dark lane that divides this peculiar galaxy.'
    }
  },
  'Sculptor Galaxy': {
    catalog: 'NGC 253', type: 'spiral galaxy',
    constellation: 'Sculptor', distance: '11.4 million ly', magnitude: '7.1',
    ra: '00h 48m', dec: '-25° 17\'',
    descriptions: {
      excellent: 'The Silver Coin Galaxy was a stunning edge-on spiral with mottled dust lanes and a bright, elongated core. One of the dustiest and most actively star-forming galaxies visible from Earth.',
      good: 'A bright, elongated galaxy showing good surface detail and a prominent core. The dust lanes were hinted at under these conditions.',
      standard: 'Visible as a bright, cigar-shaped smudge of light, the Sculptor Galaxy is one of the brightest galaxies outside our Local Group.'
    }
  },
  'Fornax Cluster': {
    catalog: 'Abell S0373', type: 'galaxy cluster',
    constellation: 'Fornax', distance: '62 million ly', magnitude: 'varies',
    ra: '03h 38m', dec: '-35° 27\'',
    descriptions: {
      excellent: 'Multiple members of the Fornax Galaxy Cluster were visible, including the giant elliptical NGC 1399 at its center. This is the second richest galaxy cluster within 100 million light-years.',
      good: 'Several galaxies of the Fornax Cluster were identified, showcasing a concentration of galaxies bound together by gravity.',
      standard: 'The brightest members of this galaxy cluster were visible as faint fuzzy patches in the constellation Fornax.'
    }
  },

  // === STAR CLUSTERS (GLOBULAR) ===
  'Omega Centauri': {
    catalog: 'NGC 5139', type: 'globular cluster',
    constellation: 'Centaurus', distance: '15,800 ly', magnitude: '3.7',
    ra: '13h 27m', dec: '-47° 29\'',
    descriptions: {
      excellent: 'Omega Centauri was absolutely breathtaking — the largest and brightest globular cluster in the Milky Way, resolved into a dazzling ball of millions of stars. At 10 million stars and possibly the remnant core of a dwarf galaxy, it\'s unlike any other cluster.',
      good: 'The king of globular clusters showed its immense size and incredible star density. Individual stars were resolved across the cluster face.',
      standard: 'Visible to the naked eye as a fuzzy star, through the telescope Omega Centauri revealed its true nature — a magnificent sphere of ancient stars.'
    }
  },
  '47 Tucanae': {
    catalog: 'NGC 104', type: 'globular cluster',
    constellation: 'Tucana', distance: '13,000 ly', magnitude: '4.0',
    ra: '00h 24m', dec: '-72° 05\'',
    descriptions: {
      excellent: '47 Tucanae was stunning — the second brightest globular cluster, with its dense core blazing and individual stars resolved to the very center. Its position near the Small Magellanic Cloud made for an extraordinary visual pairing.',
      good: 'A magnificent globular cluster with excellent resolution of individual stars. The dense core contrasted beautifully with the resolved outer regions.',
      standard: 'A bright, concentrated globular cluster near the Small Magellanic Cloud, showing a dense core surrounded by a halo of resolved stars.'
    }
  },
  'NGC 3201': {
    catalog: 'NGC 3201', type: 'globular cluster',
    constellation: 'Vela', distance: '16,300 ly', magnitude: '6.7',
    ra: '10h 18m', dec: '-46° 25\'',
    descriptions: {
      excellent: 'NGC 3201 was beautifully resolved into individual stars across its face. This loose globular cluster has the unusual distinction of having a retrograde orbit around the Milky Way.',
      good: 'A well-resolved globular cluster with a notably less concentrated core compared to other globulars, giving it a more open appearance.',
      standard: 'Visible as a moderately bright, somewhat loosely concentrated globular cluster in the constellation Vela.'
    }
  },

  // === STAR CLUSTERS (OPEN) ===
  'Southern Pleiades': {
    catalog: 'IC 2602', type: 'open cluster',
    constellation: 'Carina', distance: '479 ly', magnitude: '1.9',
    ra: '10h 43m', dec: '-64° 24\'',
    descriptions: {
      excellent: 'The Southern Pleiades (Theta Carinae Cluster) was a dazzling sight — a bright, scattered cluster of blue-white stars dominated by the brilliant Theta Carinae. Visible to the naked eye and beautiful in binoculars.',
      good: 'This bright southern cluster showed its spread-out collection of hot, young stars beautifully against the rich Carina Milky Way.',
      standard: 'A bright, easily visible open cluster in Carina, often compared to its northern namesake the Pleiades.'
    }
  },
  'Jewel Box': {
    catalog: 'NGC 4755', type: 'open cluster',
    constellation: 'Crux', distance: '6,440 ly', magnitude: '4.2',
    ra: '12h 54m', dec: '-60° 20\'',
    descriptions: {
      excellent: 'The Jewel Box was spectacular — a compact cluster of brilliantly colored stars near Beta Crucis. The contrast between the blue supergiants and the central red supergiant Kappa Crucis made it look like gems scattered on velvet.',
      good: 'The color contrast in this cluster was beautiful — bright blue and white stars with a prominent red supergiant creating a striking pattern.',
      standard: 'A compact, bright cluster near the Southern Cross showing a mix of star colors, earning its name as the Jewel Box.'
    }
  },
  'Wishing Well Cluster': {
    catalog: 'NGC 3532', type: 'open cluster',
    constellation: 'Carina', distance: '1,321 ly', magnitude: '3.0',
    ra: '11h 06m', dec: '-58° 44\'',
    descriptions: {
      excellent: 'NGC 3532 was breathtaking — one of the richest and brightest open clusters in the sky, filling the eyepiece with hundreds of glittering stars. It was the first object ever observed by the Hubble Space Telescope.',
      good: 'A spectacular, densely packed open cluster with a beautiful mix of bright and faint stars creating a shimmering effect.',
      standard: 'A rich, bright open cluster easily visible to the naked eye, with dozens of stars resolved in the telescope.'
    }
  },
  'Pleiades': {
    catalog: 'M45', type: 'open cluster',
    constellation: 'Taurus', distance: '444 ly', magnitude: '1.6',
    ra: '03h 47m', dec: '+24° 07\'',
    descriptions: {
      excellent: 'The Seven Sisters were magnificent — the blue reflection nebulosity surrounding the stars was clearly visible under these pristine skies, something rarely seen except from the darkest sites.',
      good: 'The Pleiades showed their characteristic blue-white stars in a tight grouping, with hints of the surrounding nebulosity.',
      standard: 'The most famous star cluster in the sky, the Pleiades were easily visible as a compact group of bright blue-white stars.'
    }
  },

  // === PLANETS ===
  'Jupiter': {
    catalog: 'Planet', type: 'planet',
    constellation: 'varies', distance: 'varies', magnitude: 'varies',
    ra: 'varies', dec: 'varies',
    descriptions: {
      excellent: 'Jupiter was stunning through the telescope — the cloud bands were sharply defined with intricate detail, the Great Red Spot was visible during its transit, and all four Galilean moons were perfectly resolved as tiny disks.',
      good: 'The gas giant showed clear equatorial cloud bands and the four Galilean moons lined up like a miniature solar system.',
      standard: 'Jupiter displayed its main cloud bands and Galilean moons — Io, Europa, Ganymede, and Callisto — orbiting the giant planet.'
    }
  },
  'Saturn': {
    catalog: 'Planet', type: 'planet',
    constellation: 'varies', distance: 'varies', magnitude: 'varies',
    ra: 'varies', dec: 'varies',
    descriptions: {
      excellent: 'Saturn was the showstopper — the rings were breathtakingly detailed with the Cassini Division clearly visible as a dark gap. The shadow of the planet on the rings added a stunning 3D effect, and moon Titan was visible nearby.',
      good: 'The ringed planet displayed its iconic ring system beautifully, with the Cassini Division visible. Several moons were identified.',
      standard: 'Saturn\'s rings were clearly visible, creating that unmistakable silhouette that never fails to amaze first-time observers.'
    }
  },
  'Mars': {
    catalog: 'Planet', type: 'planet',
    constellation: 'varies', distance: 'varies', magnitude: 'varies',
    ra: 'varies', dec: 'varies',
    descriptions: {
      excellent: 'Mars showed remarkable surface detail — dark albedo features including Syrtis Major were visible, and the polar ice cap gleamed white at the planet\'s limb.',
      good: 'The Red Planet showed its distinctive orange-red color with some darker surface markings visible during moments of steady seeing.',
      standard: 'Mars appeared as a bright, reddish-orange disk, its color caused by iron oxide on its surface.'
    }
  },
  'Venus': {
    catalog: 'Planet', type: 'planet',
    constellation: 'varies', distance: 'varies', magnitude: 'varies',
    ra: 'varies', dec: 'varies',
    descriptions: {
      excellent: 'Venus displayed its crescent or gibbous phase clearly, its thick atmosphere creating a brilliant, featureless disk that outshone everything else in the twilight sky.',
      good: 'The brightest planet showed its current phase clearly — a testament to the fact that Venus orbits closer to the Sun than Earth.',
      standard: 'Venus blazed in the sky as the Evening/Morning Star, its phase visible through the telescope showing it\'s an inner planet.'
    }
  },
  'Mercury': {
    catalog: 'Planet', type: 'planet',
    constellation: 'varies', distance: 'varies', magnitude: 'varies',
    ra: 'varies', dec: 'varies',
    descriptions: {
      excellent: 'Mercury was caught in a favorable elongation, showing its tiny disk and current phase low on the horizon during twilight.',
      good: 'The elusive innermost planet was spotted near the horizon, showing its phase through the telescope.',
      standard: 'Mercury was briefly visible near the horizon — always a treat given how rarely this swift planet is well-placed for observation.'
    }
  },
  'Moon': {
    catalog: 'Natural satellite', type: 'moon',
    constellation: 'varies', distance: '384,400 km', magnitude: 'varies',
    ra: 'varies', dec: 'varies',
    descriptions: {
      excellent: 'The Moon revealed extraordinary detail along the terminator — crater rims cast long, dramatic shadows, mountain peaks caught the sunlight, and the subtle colors of different lava flows on the maria were visible.',
      good: 'Lunar craters and mare were beautifully detailed, with the terminator providing excellent shadow contrast that brought the surface to life.',
      standard: 'The Moon showed its familiar face with craters, mountains, and dark lava plains (maria) clearly visible.'
    }
  },
  'Uranus': {
    catalog: 'Planet', type: 'planet',
    constellation: 'varies', distance: 'varies', magnitude: 'varies',
    ra: 'varies', dec: 'varies',
    descriptions: {
      excellent: 'Uranus appeared as a small, distinctly blue-green disk — its unique color caused by methane in its atmosphere. The third-largest planet in our solar system, tilted on its side.',
      good: 'The ice giant was identified as a small, pale blue-green disk, distinguishable from surrounding stars by its color and non-twinkling appearance.',
      standard: 'Uranus was located and showed its characteristic blue-green hue — the seventh planet from the Sun, discovered by William Herschel in 1781.'
    }
  },
  'Neptune': {
    catalog: 'Planet', type: 'planet',
    constellation: 'varies', distance: 'varies', magnitude: 'varies',
    ra: 'varies', dec: 'varies',
    descriptions: {
      excellent: 'Neptune appeared as a tiny blue disk at the eyepiece\'s highest magnification — the most distant planet in our solar system, 4.5 billion km away.',
      good: 'The outermost planet was identified as a small, blue-tinted point that didn\'t twinkle like the surrounding stars.',
      standard: 'Neptune was located using star charts — appearing as a faint, steady point of blue light among the background stars.'
    }
  },

  // === MILKY WAY FEATURES ===
  'Milky Way Core': {
    catalog: 'Sagittarius A*', type: 'galactic center',
    constellation: 'Sagittarius', distance: '26,000 ly', magnitude: 'N/A',
    ra: '17h 46m', dec: '-29° 00\'',
    descriptions: {
      excellent: 'The Milky Way core was an overwhelming spectacle — rising from the horizon like a luminous river of stars, with dark dust lanes, bright star clouds, and countless nebulae visible to the naked eye. The sheer density of stars toward Sagittarius was almost unbelievable.',
      good: 'The galactic center region was richly detailed, with dark rifts and bright star clouds creating a complex tapestry of light across the sky.',
      standard: 'The bright central bulge of our galaxy was visible in Sagittarius, with the Great Rift dark lane clearly dividing the Milky Way.'
    }
  },
  'Milky Way': {
    catalog: 'Our Galaxy', type: 'galaxy',
    constellation: 'multiple', distance: '0 ly', magnitude: 'N/A',
    ra: 'varies', dec: 'varies',
    descriptions: {
      excellent: 'The Milky Way was an awe-inspiring river of light stretching from horizon to horizon — under Bortle 1 skies, the dark lanes, star clouds, and individual nebulae within our galaxy were visible to the naked eye. The sheer number of stars was overwhelming.',
      good: 'Our home galaxy arched magnificently across the sky, with the bright star clouds and dark dust lanes clearly visible to the unaided eye.',
      standard: 'The Milky Way was visible as a broad band of light crossing the sky, a direct view into the disk of our spiral galaxy containing 200-400 billion stars.'
    }
  },

  // === DOUBLE STARS ===
  'Alpha Centauri': {
    catalog: 'Alpha Centauri AB', type: 'double star',
    constellation: 'Centaurus', distance: '4.37 ly', magnitude: '-0.27',
    ra: '14h 40m', dec: '-60° 50\'',
    descriptions: {
      excellent: 'Alpha Centauri was beautifully split into its two components — a golden primary and a slightly orange secondary, the nearest star system to our Sun at just 4.37 light-years. Proxima Centauri, the actual closest star, lurks invisibly nearby.',
      good: 'The nearest star system was cleanly resolved into two bright stars with a subtle color difference between the components.',
      standard: 'Alpha Centauri was split into its two bright components — the closest star system to Earth and a pointer star to the Southern Cross.'
    }
  },
  'Acrux': {
    catalog: 'Alpha Crucis', type: 'double star',
    constellation: 'Crux', distance: '321 ly', magnitude: '0.76',
    ra: '12h 27m', dec: '-63° 06\'',
    descriptions: {
      excellent: 'The brightest star in the Southern Cross was beautifully split into its two blue-white components, both massive, luminous stars over 25,000 times brighter than our Sun.',
      good: 'Acrux was resolved into a close pair of brilliant blue-white stars, the jewel at the foot of the Southern Cross.',
      standard: 'The double nature of Alpha Crucis was revealed through the telescope — two bright stars forming the base of the famous Southern Cross.'
    }
  },

  // === SOUTHERN CONSTELLATIONS ===
  'Southern Cross': {
    catalog: 'Crux', type: 'constellation',
    constellation: 'Crux', distance: 'varies', magnitude: 'varies',
    ra: '12h 30m', dec: '-60° 00\'',
    descriptions: {
      excellent: 'The Southern Cross stood out magnificently against the dense star fields of the Milky Way. Its four bright stars, the adjacent dark Coal Sack, and the brilliant Jewel Box cluster created one of the most iconic views in the southern sky.',
      good: 'Crux was easily identified with its distinctive cross pattern, the Coal Sack dark nebula creating a striking void beside it.',
      standard: 'The Southern Cross — the smallest constellation but one of the most recognizable — was clearly visible, used for centuries to find south.'
    }
  },
  'Scorpius': {
    catalog: 'Scorpius', type: 'constellation',
    constellation: 'Scorpius', distance: 'varies', magnitude: 'varies',
    ra: '16h 30m', dec: '-30° 00\'',
    descriptions: {
      excellent: 'Scorpius was magnificent from the southern hemisphere — its complete form visible from head to curling tail, with brilliant red Antares at its heart and rich Milky Way star fields surrounding it.',
      good: 'The Scorpion stretched across the sky with its bright stars tracing the distinctive curved tail and the red supergiant Antares pulsing at its heart.',
      standard: 'Scorpius was clearly visible with its characteristic shape, anchored by the red supergiant Antares — a star so large it would engulf Mars\' orbit.'
    }
  },

  // === ADDITIONAL DEEP SKY ===
  'Flame Nebula': {
    catalog: 'NGC 2024', type: 'emission nebula',
    constellation: 'Orion', distance: '1,350 ly', magnitude: '2.0',
    ra: '05h 42m', dec: '-01° 51\'',
    descriptions: {
      excellent: 'The Flame Nebula glowed vividly next to the bright star Alnitak in Orion\'s belt, its intricate dark lanes creating a flame-like pattern against the bright emission background.',
      good: 'Visible near Alnitak, the Flame Nebula showed its characteristic pattern of dark lanes dividing the bright nebulosity.',
      standard: 'The Flame Nebula was detected near Orion\'s belt star Alnitak, showing its distinctive divided structure.'
    }
  },
  'Horsehead Nebula': {
    catalog: 'Barnard 33', type: 'dark nebula',
    constellation: 'Orion', distance: '1,375 ly', magnitude: 'N/A',
    ra: '05h 41m', dec: '-02° 28\'',
    descriptions: {
      excellent: 'The iconic Horsehead Nebula was visible as a dark silhouette against the faint emission nebula IC 434 — one of the most photographed objects in the sky, but notoriously difficult to observe visually.',
      good: 'With careful observation and averted vision, the horse-head shaped dark nebula was glimpsed against the faint background emission.',
      standard: 'The region of the Horsehead Nebula was observed — while this famous dark nebula is extremely challenging visually, the surrounding area showed the emission nebulosity that backdrops it.'
    }
  },
  'Helix Nebula': {
    catalog: 'NGC 7293', type: 'planetary nebula',
    constellation: 'Aquarius', distance: '655 ly', magnitude: '7.6',
    ra: '22h 30m', dec: '-20° 50\'',
    descriptions: {
      excellent: 'The Eye of God — the Helix Nebula — showed its large, circular form with wonderful detail. The nearest planetary nebula to Earth, its dying central star was visible at the center of the expanding gas shell.',
      good: 'The large, circular Helix Nebula was visible as a ghostly ring, one of the closest planetary nebulae at just 655 light-years.',
      standard: 'The Helix Nebula appeared as a faint, large circular patch — the remnant of a Sun-like star that shed its outer layers thousands of years ago.'
    }
  },
  'Butterfly Cluster': {
    catalog: 'M6', type: 'open cluster',
    constellation: 'Scorpius', distance: '1,600 ly', magnitude: '4.2',
    ra: '17h 40m', dec: '-32° 13\'',
    descriptions: {
      excellent: 'The Butterfly Cluster spread its delicate wings of stars beautifully — the pattern really does resemble a butterfly in flight, with a striking orange star among the mostly blue-white members.',
      good: 'M6 showed its butterfly-like star pattern clearly, with the contrast between the cool orange star and hot blue-white neighbors.',
      standard: 'A pretty open cluster near the tail of Scorpius, its stars arranged in a pattern reminiscent of a butterfly.'
    }
  },
  'Ptolemy Cluster': {
    catalog: 'M7', type: 'open cluster',
    constellation: 'Scorpius', distance: '980 ly', magnitude: '3.3',
    ra: '17h 54m', dec: '-34° 49\'',
    descriptions: {
      excellent: 'Ptolemy\'s Cluster was a gorgeous scattering of bright stars against the rich Milky Way — known since antiquity, it contains about 80 stars spread over an area larger than the full Moon.',
      good: 'A bright, spread-out cluster visible to the naked eye near the scorpion\'s tail, with dozens of stars resolved in the eyepiece.',
      standard: 'M7 was a prominent naked-eye cluster near Scorpius\' stinger, recorded by Ptolemy nearly 2,000 years ago.'
    }
  },
  'Wild Duck Cluster': {
    catalog: 'M11', type: 'open cluster',
    constellation: 'Scutum', distance: '6,200 ly', magnitude: '5.8',
    ra: '18h 51m', dec: '-06° 16\'',
    descriptions: {
      excellent: 'The Wild Duck Cluster was one of the richest and most compact open clusters — a dense triangle of stars that resembles a flock of ducks in flight. With nearly 3,000 stars, it borders on being a globular cluster.',
      good: 'M11 presented a remarkably dense field of stars in a distinctive V-shape pattern, one of the most concentrated open clusters known.',
      standard: 'A rich, compact open cluster showing a dense concentration of stars in the shield-shaped constellation Scutum.'
    }
  },
  'NGC 2516': {
    catalog: 'NGC 2516', type: 'open cluster',
    constellation: 'Carina', distance: '1,300 ly', magnitude: '3.8',
    ra: '07h 58m', dec: '-60° 52\'',
    descriptions: {
      excellent: 'NGC 2516 was a beautiful southern open cluster rivaling the Pleiades in brightness, with over 100 stars scattered across a rich Milky Way field.',
      good: 'A bright, well-populated cluster in Carina with many resolved stars and a notable red giant among the blue-white members.',
      standard: 'A prominent naked-eye cluster in Carina, sometimes called the Southern Beehive for its rich star count.'
    }
  },

  // === PLANETARY NEBULAE ===
  'Eight-Burst Nebula': {
    catalog: 'NGC 3132', type: 'planetary nebula',
    constellation: 'Vela', distance: '2,000 ly', magnitude: '9.9',
    ra: '10h 08m', dec: '-40° 26\'',
    descriptions: {
      excellent: 'The Southern Ring Nebula displayed its beautiful double-ring structure — one of the first deep images from the James Webb Space Telescope was of this very object, revealing its intricate ejection history.',
      good: 'A bright planetary nebula showing its ring-like shape with a bright central star visible. A southern counterpart to the famous Ring Nebula.',
      standard: 'The Southern Ring Nebula appeared as a small, bright disk with its central white dwarf visible at the heart.'
    }
  },

  // === ADDITIONAL OBJECTS ===
  'Canopus': {
    catalog: 'Alpha Carinae', type: 'star',
    constellation: 'Carina', distance: '310 ly', magnitude: '-0.74',
    ra: '06h 24m', dec: '-52° 42\'',
    descriptions: {
      excellent: 'Canopus, the second brightest star in the night sky, blazed with a white-yellow light from the southern horizon. This supergiant star is 10,000 times more luminous than our Sun.',
      good: 'The brilliant Canopus was prominent in the sky — a navigation star used by spacecraft and ancient mariners alike.',
      standard: 'Canopus shone brightly as the second brightest star visible, an essential reference point in the southern sky.'
    }
  },
  'Antares': {
    catalog: 'Alpha Scorpii', type: 'star',
    constellation: 'Scorpius', distance: '550 ly', magnitude: '1.06',
    ra: '16h 29m', dec: '-26° 26\'',
    descriptions: {
      excellent: 'Antares — the rival of Mars — glowed with a deep red hue at the heart of Scorpius. This red supergiant is so enormous that if placed at the Sun\'s position, its surface would extend beyond the orbit of Mars.',
      good: 'The red supergiant Antares pulsed with its characteristic deep orange-red color, a striking contrast to the nearby blue-white stars.',
      standard: 'Antares marked the heart of the Scorpion with its distinctive red color — a dying supergiant nearing the end of its life.'
    }
  },
  'Sirius': {
    catalog: 'Alpha Canis Majoris', type: 'star',
    constellation: 'Canis Major', distance: '8.6 ly', magnitude: '-1.46',
    ra: '06h 45m', dec: '-16° 43\'',
    descriptions: {
      excellent: 'Sirius, the brightest star in the night sky, scintillated with rainbow colors near the horizon — its extreme brightness and proximity at just 8.6 light-years made it impossible to miss.',
      good: 'The Dog Star blazed brilliantly, the brightest star visible and one of our nearest stellar neighbors.',
      standard: 'Sirius dominated the sky as the brightest star — a binary system with a white dwarf companion known as the Pup.'
    }
  },
  'Betelgeuse': {
    catalog: 'Alpha Orionis', type: 'star',
    constellation: 'Orion', distance: '700 ly', magnitude: '0.42',
    ra: '05h 55m', dec: '+07° 24\'',
    descriptions: {
      excellent: 'Betelgeuse glowed with a deep orange-red hue at Orion\'s shoulder — this red supergiant is so large that it pulses visibly in brightness. It could explode as a supernova at any time in the next 100,000 years.',
      good: 'The red supergiant at Orion\'s shoulder showed its characteristic warm orange color, contrasting with the blue-white Rigel at Orion\'s foot.',
      standard: 'Betelgeuse was easily identified by its reddish color marking Orion\'s left shoulder — one of the largest stars visible to the naked eye.'
    }
  },
  'Achernar': {
    catalog: 'Alpha Eridani', type: 'star',
    constellation: 'Eridanus', distance: '139 ly', magnitude: '0.46',
    ra: '01h 38m', dec: '-57° 14\'',
    descriptions: {
      excellent: 'Achernar, the end of the River, shone with a blue-white light — one of the flattest stars known, spinning so fast it bulges 50% wider at its equator than at its poles.',
      good: 'The bright blue-white star at the southern end of the celestial river Eridanus was a prominent landmark in the deep south sky.',
      standard: 'Achernar marked the southern terminus of the constellation Eridanus — the ninth brightest star in the night sky.'
    }
  },
  'Zodiacal Light': {
    catalog: 'N/A', type: 'solar system phenomenon',
    constellation: 'ecliptic', distance: 'N/A', magnitude: 'N/A',
    ra: 'varies', dec: 'varies',
    descriptions: {
      excellent: 'The Zodiacal Light was spectacular — a cone of pearly light extending from the horizon along the ecliptic, caused by sunlight reflecting off interplanetary dust. Under these pristine skies, it was bright enough to cast faint shadows.',
      good: 'A soft, triangular glow was visible along the ecliptic after sunset, the Zodiacal Light created by dust particles in the plane of the solar system.',
      standard: 'The Zodiacal Light was faintly visible as a soft glow along the horizon — a phenomenon only visible from very dark sites like the Atacama.'
    }
  },
  'Gegenschein': {
    catalog: 'N/A', type: 'solar system phenomenon',
    constellation: 'anti-solar point', distance: 'N/A', magnitude: 'N/A',
    ra: 'varies', dec: 'varies',
    descriptions: {
      excellent: 'The Gegenschein — the counter-glow — was visible as a subtle brightening at the anti-solar point, connected to the Zodiacal Light by the faint Zodiacal Band. Seeing this requires some of the darkest skies on Earth.',
      good: 'A faint patch of light was detected at the point opposite the Sun — the elusive Gegenschein, visible only from the darkest locations.',
      standard: 'The anti-solar point was observed in search of the Gegenschein — this extremely faint phenomenon requires pristine skies to detect.'
    }
  },
  'False Cross': {
    catalog: 'Asterism', type: 'asterism',
    constellation: 'Vela/Carina', distance: 'varies', magnitude: 'varies',
    ra: '09h 00m', dec: '-60° 00\'',
    descriptions: {
      excellent: 'The False Cross asterism was clearly distinguished from the true Southern Cross — its larger size and different star colors helped tell them apart, a classic test for southern sky navigators.',
      good: 'The four stars forming the False Cross were identified, with their greater spacing compared to the true Crux helping distinguish them.',
      standard: 'The False Cross was pointed out as the larger, looser cross-shaped pattern that has confused navigators for centuries.'
    }
  }
};

/**
 * Look up an object in the catalog. Tries exact match, then case-insensitive, then partial match.
 */
export function lookupObject(name) {
  // Exact match
  if (catalog[name]) return { name, ...catalog[name] };

  // Case-insensitive match
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(catalog)) {
    if (key.toLowerCase() === lower) return { name: key, ...value };
  }

  // Partial match
  for (const [key, value] of Object.entries(catalog)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return { name: key, ...value };
    }
  }

  // Match by catalog ID
  for (const [key, value] of Object.entries(catalog)) {
    if (value.catalog && value.catalog.toLowerCase() === lower) {
      return { name: key, ...value };
    }
  }

  return null;
}

/**
 * Get the appropriate description for an object based on observing conditions.
 * Conditions string is parsed: "excellent seeing" → "excellent", "clear" → "good", etc.
 */
export function getDescription(object, conditions = '') {
  if (!object || !object.descriptions) return '';

  const condLower = conditions.toLowerCase();
  if (condLower.includes('excellent') || condLower.includes('pristine') || condLower.includes('perfect')) {
    return object.descriptions.excellent;
  }
  if (condLower.includes('good') || condLower.includes('clear') || condLower.includes('fine')) {
    return object.descriptions.good;
  }
  return object.descriptions.standard;
}

/**
 * Enrich a list of object names with catalog data and condition-based descriptions.
 */
export function enrichObjects(objectNames, conditions = '') {
  return objectNames.map(name => {
    const obj = lookupObject(name.trim());
    if (!obj) {
      return {
        name: name.trim(),
        catalog: 'Unknown',
        type: 'unknown',
        constellation: 'Unknown',
        distance: 'Unknown',
        magnitude: 'N/A',
        description: `${name.trim()} was observed during the session.`,
        found: false
      };
    }
    return {
      ...obj,
      description: getDescription(obj, conditions),
      found: true
    };
  });
}

export { catalog };
