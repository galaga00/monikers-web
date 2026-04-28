export type StarterDeckCard = {
  id: string;
  title: string;
  description: string;
};

const CORE_DECK: StarterDeckCard[] = [
  { id: "amelia-earhart", title: "Amelia Earhart", description: "A pioneering pilot who became famous for record-setting flights and her mysterious disappearance over the Pacific." },
  { id: "apollo-11", title: "Apollo 11", description: "The NASA mission that first landed humans on the Moon in 1969." },
  { id: "beyonce", title: "Beyonce", description: "A global pop star known for huge concerts, precise choreography, and songs like Single Ladies and Halo." },
  { id: "bigfoot", title: "Bigfoot", description: "A legendary hairy creature said to live in remote North American forests." },
  { id: "bob-ross", title: "Bob Ross", description: "A calm television painter famous for landscapes, soft encouragement, and happy little trees." },
  { id: "cleopatra", title: "Cleopatra", description: "The last active pharaoh of ancient Egypt, remembered for political skill and alliances with Rome." },
  { id: "darth-vader", title: "Darth Vader", description: "The masked Star Wars villain with a deep voice, heavy breathing, and a red lightsaber." },
  { id: "dolly-parton", title: "Dolly Parton", description: "A country music icon, actor, philanthropist, and the creator of songs like Jolene and 9 to 5." },
  { id: "eiffel-tower", title: "The Eiffel Tower", description: "The famous iron landmark in Paris that looks like a giant lattice tower." },
  { id: "elvis-presley", title: "Elvis Presley", description: "The rock and roll singer known for big stage moves, rhinestone jumpsuits, and a huge cultural footprint." },
  { id: "frida-kahlo", title: "Frida Kahlo", description: "A Mexican painter known for vivid self-portraits, flowers, symbolism, and a distinctive personal style." },
  { id: "george-washington", title: "George Washington", description: "The first president of the United States and a general during the American Revolution." },
  { id: "godzilla", title: "Godzilla", description: "A giant movie monster who stomps through cities and blasts atomic energy." },
  { id: "harriet-tubman", title: "Harriet Tubman", description: "An abolitionist who helped enslaved people escape through the Underground Railroad." },
  { id: "hermione-granger", title: "Hermione Granger", description: "The brilliant Harry Potter character known for studying, spells, and helping solve nearly every problem." },
  { id: "jane-goodall", title: "Jane Goodall", description: "A scientist famous for studying chimpanzees and advocating for wildlife conservation." },
  { id: "jaws", title: "Jaws", description: "The shark from the classic thriller movie, usually announced by ominous music." },
  { id: "lebron-james", title: "LeBron James", description: "A basketball superstar known for power, passing, championships, and long-term dominance." },
  { id: "mario", title: "Mario", description: "The mustached Nintendo plumber who jumps on enemies, collects coins, and rescues Princess Peach." },
  { id: "mona-lisa", title: "The Mona Lisa", description: "Leonardo da Vinci's famous portrait with the small mysterious smile." },
  { id: "oprah-winfrey", title: "Oprah Winfrey", description: "A talk show host, producer, and media figure known for interviews and audience giveaways." },
  { id: "picasso", title: "Pablo Picasso", description: "A Spanish artist associated with Cubism and bold, fragmented portraits." },
  { id: "queen-elizabeth-ii", title: "Queen Elizabeth II", description: "The long-reigning British monarch known for formal waves, bright outfits, and royal ceremonies." },
  { id: "serena-williams", title: "Serena Williams", description: "A tennis champion known for power, intensity, and many Grand Slam titles." },
  { id: "sherlock-holmes", title: "Sherlock Holmes", description: "A fictional detective who solves mysteries with sharp observation and deduction." },
  { id: "spider-man", title: "Spider-Man", description: "The superhero who swings between buildings, climbs walls, and says great power brings responsibility." },
  { id: "taylor-swift", title: "Taylor Swift", description: "A singer-songwriter known for eras, devoted fans, and albums that span country, pop, and folk styles." },
  { id: "the-beatles", title: "The Beatles", description: "The British band behind songs like Hey Jude, Yesterday, and Here Comes the Sun." },
  { id: "the-rock", title: "The Rock", description: "Dwayne Johnson, a wrestler turned movie star known for charisma, muscles, and one raised eyebrow." },
  { id: "t-rex", title: "T. rex", description: "A massive meat-eating dinosaur with huge teeth, tiny arms, and a starring role in museum displays." },
  { id: "usain-bolt", title: "Usain Bolt", description: "A Jamaican sprinter famous for world records, Olympic gold medals, and lightning-bolt celebrations." },
  { id: "willy-wonka", title: "Willy Wonka", description: "The eccentric candy maker who runs a fantastical chocolate factory." },
  { id: "yoda", title: "Yoda", description: "The small green Jedi master known for wisdom, unusual sentence order, and teaching Luke Skywalker." },
  { id: "zeus", title: "Zeus", description: "The Greek god of thunder, lightning, and ruling the Olympian gods." },
  { id: "airport-security", title: "Airport Security", description: "The checkpoint routine of bins, scanners, shoes, bags, and hoping nobody forgot a water bottle." },
  { id: "alien-job-interview", title: "An Alien at a Job Interview", description: "A strange visitor trying to explain their skills, work history, and why they are qualified on Earth." },
  { id: "baby-shark", title: "Baby Shark", description: "The children's song with repetitive hand motions that can get stuck in your head instantly." },
  { id: "bad-gps", title: "A Bad GPS", description: "A navigation voice giving directions at exactly the wrong time or sending everyone the wrong way." },
  { id: "birthday-cake", title: "Birthday Cake", description: "A celebration dessert with candles, singing, and someone trying to cut equal slices." },
  { id: "black-friday", title: "Black Friday", description: "The shopping day known for discounts, crowds, carts, and people hunting for deals." },
  { id: "broken-umbrella", title: "A Broken Umbrella", description: "An umbrella that flips inside out, refuses to open, or makes rain feel personally targeted." },
  { id: "cactus", title: "Cactus", description: "A prickly desert plant that stores water and strongly discourages hugs." },
  { id: "celebrity-chef", title: "A Celebrity Chef", description: "A famous cook dramatically tasting food, shouting instructions, or presenting a perfect dish." },
  { id: "coffee-shop-wifi", title: "Coffee Shop Wi-Fi", description: "The shared internet connection everyone needs, often protected by a password on a tiny receipt." },
  { id: "courtroom-objection", title: "Courtroom Objection", description: "A dramatic legal interruption where someone stands up and challenges what was just said." },
  { id: "dad-joke", title: "Dad Joke", description: "A painfully obvious pun delivered with confidence and usually followed by groans." },
  { id: "dance-battle", title: "Dance Battle", description: "A face-off where people answer each other with bigger and stranger dance moves." },
  { id: "dentist-chair", title: "Dentist Chair", description: "The reclining chair where small talk becomes impossible because someone is examining your teeth." },
  { id: "elevator-small-talk", title: "Elevator Small Talk", description: "The awkward conversation squeezed into a short ride between floors." },
  { id: "escape-room", title: "Escape Room", description: "A timed puzzle game where a group searches for clues and overthinks every lock." },
  { id: "family-road-trip", title: "Family Road Trip", description: "A long car ride with snacks, arguments over music, and repeated questions about arrival time." },
  { id: "fashion-runway", title: "Fashion Runway", description: "A dramatic walk showing off clothing while cameras flash and everyone looks serious." },
  { id: "fire-drill", title: "Fire Drill", description: "A practice evacuation with alarms, lines, confusion, and someone still carrying coffee." },
  { id: "fortune-cookie", title: "Fortune Cookie", description: "A crisp cookie with a tiny paper message that sounds wise or oddly specific." },
  { id: "garage-band", title: "Garage Band", description: "A loud beginner band practicing with enthusiasm, questionable timing, and big dreams." },
  { id: "haunted-house", title: "Haunted House", description: "A spooky place full of creaky doors, jump scares, and people insisting they are not scared." },
  { id: "hot-air-balloon", title: "Hot Air Balloon", description: "A floating basket lifted by a huge balloon and bursts of flame." },
  { id: "ice-cream-truck", title: "Ice Cream Truck", description: "A vehicle playing cheerful music while selling frozen treats to a suddenly excited neighborhood." },
  { id: "karaoke-night", title: "Karaoke Night", description: "A public singalong where confidence often matters more than hitting the right notes." },
  { id: "lost-luggage", title: "Lost Luggage", description: "The travel nightmare where your suitcase goes somewhere else and you hope it returns." },
  { id: "magic-trick", title: "Magic Trick", description: "A performance where something disappears, reappears, or makes everyone ask how it happened." },
  { id: "mall-santa", title: "Mall Santa", description: "A holiday photo setup where children meet Santa in the middle of a shopping mall." },
  { id: "mime-stuck-in-box", title: "Mime Stuck in a Box", description: "The classic silent act of feeling invisible walls with exaggerated hands." },
  { id: "office-printer", title: "Office Printer", description: "The machine that jams, beeps, needs toner, and becomes everyone's shared problem." },
  { id: "opera-singer", title: "Opera Singer", description: "A performer using a powerful classical voice that can fill a theater." },
  { id: "parking-ticket", title: "Parking Ticket", description: "The unpleasant slip of paper that says your car sat in the wrong place too long." },
  { id: "pirate-captain", title: "Pirate Captain", description: "A ship leader with treasure maps, dramatic orders, and possibly an eye patch." },
  { id: "pizza-delivery", title: "Pizza Delivery", description: "The hopeful moment when hot pizza arrives at the door, ideally still on time." },
  { id: "prom-posal", title: "Promposal", description: "An elaborate or funny public invitation asking someone to go to prom." },
  { id: "reality-show-villain", title: "Reality Show Villain", description: "The cast member edited to cause drama, deliver suspicious confessionals, and stir the pot." },
  { id: "roller-coaster", title: "Roller Coaster", description: "A fast amusement park ride with climbs, drops, loops, and loud screaming." },
  { id: "school-picture-day", title: "School Picture Day", description: "The annual photo ritual with stiff poses, bright backgrounds, and one chance to smile normally." },
  { id: "secret-agent", title: "Secret Agent", description: "A spy doing missions, hiding gadgets, and acting casual while everything is suspicious." },
  { id: "silent-disco", title: "Silent Disco", description: "A dance party where people wear headphones and the room sounds strange without the music." },
  { id: "speed-dating", title: "Speed Dating", description: "A quick series of mini-dates where people try to make an impression in minutes." },
  { id: "spelling-bee", title: "Spelling Bee", description: "A competition where contestants spell difficult words out loud under pressure." },
  { id: "summer-camp", title: "Summer Camp", description: "A seasonal getaway with cabins, games, songs, activities, and possibly homesick campers." },
  { id: "surprise-party", title: "Surprise Party", description: "A secret celebration where everyone hides, waits, and hopes the guest of honor is actually surprised." },
  { id: "taco-truck", title: "Taco Truck", description: "A food truck serving tacos, usually with a line of people who know exactly what they want." },
  { id: "talent-show", title: "Talent Show", description: "A performance event where people sing, dance, juggle, or reveal unexpected skills." },
  { id: "taxi-driver", title: "Taxi Driver", description: "A driver navigating traffic, routes, passengers, and possibly strong opinions about the city." },
  { id: "tech-support", title: "Tech Support", description: "The person asking whether everything is plugged in and suggesting a restart." },
  { id: "theme-park-map", title: "Theme Park Map", description: "A folded guide that promises clarity while everyone argues about where to go next." },
  { id: "thunderstorm", title: "Thunderstorm", description: "A weather event with rain, lightning, thunder, and dramatic window watching." },
  { id: "time-traveler", title: "Time Traveler", description: "Someone visiting another era and trying not to change history too much." },
  { id: "treasure-map", title: "Treasure Map", description: "A map marked with clues, dotted lines, and an X where riches are supposed to be buried." },
  { id: "trivia-host", title: "Trivia Host", description: "The person reading questions, judging answers, and keeping score during quiz night." },
  { id: "valet-parking", title: "Valet Parking", description: "Handing over your car keys and trusting someone else to park the vehicle." },
  { id: "vending-machine", title: "Vending Machine", description: "A snack machine that sometimes drops treats and sometimes traps them behind the glass." },
  { id: "wedding-dj", title: "Wedding DJ", description: "The music wrangler balancing dance hits, announcements, and someone's very specific song request." },
  { id: "yoga-class", title: "Yoga Class", description: "A group exercise session with poses, breathing, mats, and people trying not to fall over." },
  { id: "zombie-apocalypse", title: "Zombie Apocalypse", description: "A survival scenario with slow monsters, barricades, supplies, and questionable group decisions." }
];

const DRAFT_SUBJECTS = [
  {
    id: "astronaut",
    title: "An Astronaut",
    description: "a space explorer in a bulky suit, dealing with zero gravity and mission control",
    details: ["a moon rover", "a launch countdown", "a floating sandwich", "a cracked helmet visor", "a spacewalk selfie", "a Martian garden", "a satellite tugboat", "a freeze-dried feast", "a lunar flag ceremony", "a lost oxygen hose", "a mission patch", "a zero-gravity haircut"]
  },
  {
    id: "baker",
    title: "A Baker",
    description: "someone covered in flour, juggling ovens, dough, frosting, and impossible timing",
    details: ["a leaning wedding cake", "a runaway sourdough starter", "a frosting emergency", "a tray of burnt croissants", "a secret pie recipe", "a bread sculpture", "a cinnamon roll tower", "a flour explosion", "a gingerbread mansion", "a cookie taste test", "a baguette sword fight", "a cupcake conveyor belt"]
  },
  {
    id: "ballerina",
    title: "A Ballerina",
    description: "a graceful dancer trying to keep perfect balance through an inconvenient situation",
    details: ["a slippery stage", "a missing slipper", "a curtain call sneeze", "a subway platform pirouette", "a tutu in an elevator", "a swan lake audition", "a music-box pose", "a tangled ribbon wand", "a dramatic stage whisper", "a balance-beam shortcut", "a spotlight malfunction", "a spinning grocery cart"]
  },
  {
    id: "barista",
    title: "A Barista",
    description: "a coffee expert managing orders, foam, names, and a long line of impatient customers",
    details: ["a latte art portrait", "a decaf scandal", "a misspelled cup name", "a broken espresso machine", "a foam mountain", "a coffee bean treasure map", "a drive-through headset", "a reusable mug avalanche", "a tiny biscotti dispute", "a cold brew science fair", "a tip jar mystery", "a pumpkin spice speech"]
  },
  {
    id: "bodybuilder",
    title: "A Bodybuilder",
    description: "a very strong person who makes even ordinary tasks look dramatic",
    details: ["a stuck pickle jar", "a tiny folding chair", "a protein shake fountain", "a grocery bag flex", "a mirror pose lesson", "a beach towel cape", "a dumbbell bouquet", "a gym selfie timer", "a suitcase weigh-in", "a doorway too narrow", "a medal made of chocolate", "a group photo squat"]
  },
  {
    id: "camp-counselor",
    title: "A Camp Counselor",
    description: "an energetic leader trying to keep campers organized, entertained, and mostly safe",
    details: ["a canoe rescue", "a mosquito roll call", "a campfire singalong", "a soggy sleeping bag", "a missing marshmallow stash", "a friendship bracelet crisis", "a flashlight ghost story", "a muddy obstacle course", "a cabin inspection", "a talent show lineup", "a poison ivy lecture", "a rain-soaked scavenger hunt"]
  },
  {
    id: "cat-burglar",
    title: "A Cat Burglar",
    description: "a sneaky thief tiptoeing through alarms, windows, and very creaky floors",
    details: ["a squeaky museum floor", "a velvet rope maze", "a diamond decoy", "a sleeping guard", "a laser pointer trap", "a skylight entrance", "a priceless spoon", "a fingerprint glove", "a silent alarm", "a getaway scooter", "a security camera blind spot", "a jewel-shaped cake"]
  },
  {
    id: "celebrity",
    title: "A Celebrity",
    description: "a famous person being watched, photographed, and asked for attention everywhere",
    details: ["a red-carpet shoelace", "a fake award speech", "a fan selfie line", "a dramatic sunglasses reveal", "a private jet delay", "a perfume commercial", "a talk-show couch", "a disguise at the grocery store", "a wardrobe double", "a paparazzi scooter chase", "a charity gala toast", "a signature pose class"]
  },
  {
    id: "cowboy",
    title: "A Cowboy",
    description: "a western rider with boots, a hat, and a habit of making things sound rugged",
    details: ["a mechanical bull remote", "a lassoed pinata", "a saloon karaoke night", "a horse parking spot", "a tumbleweed traffic jam", "a boot spur inspection", "a chili cook-off feud", "a ten-gallon hat sale", "a dusty line dance", "a cactus apology", "a train whistle mix-up", "a sheriff badge selfie"]
  },
  {
    id: "detective",
    title: "A Detective",
    description: "a mystery solver looking for clues, motives, and suspiciously convenient evidence",
    details: ["a missing sandwich", "a muddy footprint", "a foggy magnifying glass", "a suspicious birthday candle", "a locked diary", "a staged sneeze", "a secret passage bookshelf", "a coded grocery list", "a witness with hiccups", "a fake mustache drawer", "a missing trophy", "a clue in alphabet soup"]
  },
  {
    id: "dragon",
    title: "A Dragon",
    description: "a giant fire-breathing creature trying to behave in a surprisingly normal setting",
    details: ["a smoke detector apology", "a birthday candle disaster", "a tiny elevator ride", "a treasure hoard inventory", "a wing in a revolving door", "a barbecue invitation", "a medieval petting zoo", "a cave renovation", "a spicy food contest", "a flight school lesson", "a royal tea party", "a burnt toast alibi"]
  },
  {
    id: "flight-attendant",
    title: "A Flight Attendant",
    description: "a calm professional explaining rules while everyone tries to board at once",
    details: ["an overhead bin puzzle", "a rolling meal cart", "a turbulence announcement", "a seatbelt demonstration", "a tiny peanut shortage", "a passenger swap request", "a lost boarding pass", "a window shade argument", "a red-eye lullaby", "a safety-card puppet show", "an aisle traffic jam", "a landing applause debate"]
  },
  {
    id: "game-show-host",
    title: "A Game Show Host",
    description: "a cheerful announcer turning every small moment into a dramatic reveal",
    details: ["a broken buzzer", "a mystery prize box", "a confetti math problem", "a lightning round sneeze", "a wheel that will not stop", "a contestant name mix-up", "a dramatic envelope", "a consolation toaster", "a secret bonus rule", "a theme song dance", "a scoreboard blackout", "a whispering audience poll"]
  },
  {
    id: "ghost",
    title: "A Ghost",
    description: "a spooky visitor who floats, haunts, and has trouble being taken seriously",
    details: ["a blanket fort haunting", "an automatic door sensor", "a creaky attic excuse", "a sheet laundry day", "a midnight snack theft", "a mirror store visit", "a haunted phone call", "a floating grocery list", "a doorbell prank", "a seance group chat", "a spooky elevator ride", "a transparent umbrella"]
  },
  {
    id: "gold-medalist",
    title: "A Gold Medalist",
    description: "a champion athlete treating the moment like an Olympic final",
    details: ["a wobbly podium", "a national anthem hiccup", "a medal detector alarm", "a victory lap in slippers", "a slow-motion cereal pour", "a living room relay", "a celebratory towel snap", "a sports drink toast", "a photo-finish grocery line", "a medal biting mistake", "a training montage nap", "a victory bouquet fumble"]
  },
  {
    id: "grandma",
    title: "A Grandma",
    description: "a loving elder with strong opinions, snacks, and surprising confidence",
    details: ["a coupon stack", "an old recipe card", "a remote control lesson", "a hard candy purse", "a family photo ambush", "a knitting circle debate", "a casserole delivery", "a voicemail that never ends", "a holiday table assignment", "a bingo night rivalry", "a handwritten birthday check", "a suspiciously full freezer"]
  },
  {
    id: "hairdresser",
    title: "A Hairdresser",
    description: "a stylist handling scissors, gossip, mirrors, and someone's risky new look",
    details: ["a bangs regret session", "a dye disaster", "a gossip leak", "a blow-dryer power pose", "a shampoo bowl confession", "a mirror spin reveal", "a prom updo emergency", "a beard trim negotiation", "a curl that will not cooperate", "a salon cape escape", "a tiny scissors duel", "a hair spray fog bank"]
  },
  {
    id: "knight",
    title: "A Knight",
    description: "an armored hero trying to stay noble while everything gets awkward",
    details: ["a drawbridge delay", "a stuck helmet", "a banquet fork lesson", "a dragon apology letter", "a sword stuck in drywall", "a jousting sign-up sheet", "a moat swim test", "a royal group chat", "a shield used as a tray", "a castle doorbell", "a heroic grocery run", "a chainmail laundry day"]
  },
  {
    id: "librarian",
    title: "A Librarian",
    description: "a quiet authority figure surrounded by books, rules, and whispering",
    details: ["a late-fee trial", "a thunder shushing", "a book cart race", "a secret bookmark stash", "a whisper enforcement badge", "a mystery stain on page twelve", "a dramatic story time", "a forbidden snack shelf", "a rolling ladder moment", "a library card ceremony", "a lost-and-found dragon book", "a printer paper shortage"]
  },
  {
    id: "magician",
    title: "A Magician",
    description: "a performer making things vanish, appear, or become unnecessarily mysterious",
    details: ["a rabbit union meeting", "a 51-card deck", "a smoke bomb misfire", "a sawed-in-half complaint", "a disappearing assistant", "a bouquet from nowhere", "a magic wand splinter", "a cape caught in a door", "a volunteer who knows the trick", "a levitating snack table", "a top hat inspection", "a coin behind the wrong ear"]
  },
  {
    id: "pirate",
    title: "A Pirate",
    description: "a treasure-hunting sailor with big gestures and questionable table manners",
    details: ["a secret-telling parrot", "a treasure return desk", "a cannonball complaint", "a map folded wrong", "a plank safety meeting", "a seasick sea shanty", "a hook-hand handshake", "a buried key mix-up", "a ship naming ceremony", "a gold coin vending machine", "a captain hat rivalry", "a message in a soda bottle"]
  },
  {
    id: "robot",
    title: "A Robot",
    description: "a mechanical helper interpreting human life far too literally",
    details: ["a captcha test", "an emotion chip", "a software update freeze", "a low-battery apology", "a dance floor calibration", "a toaster family reunion", "a human handshake tutorial", "a vacuum cleaner friendship", "a charging cable knot", "a joke database search", "a raincoat logic error", "a smile practice mirror"]
  },
  {
    id: "royal",
    title: "A Royal",
    description: "a king, queen, prince, or princess expecting ceremony in an ordinary situation",
    details: ["a crown pillow", "a throne sneeze", "a royal wave cramp", "a grocery store procession", "a moat complaint form", "a ceremonial pizza cutter", "a velvet robe in summer", "a royal decree about socks", "a castle Wi-Fi password", "a jewel polish emergency", "a parade float breakdown", "a fancy napkin folding lesson"]
  },
  {
    id: "scientist",
    title: "A Scientist",
    description: "a researcher testing theories, taking notes, and overexplaining the obvious",
    details: ["a microscope smudge", "mixed-up beaker labels", "a static lab coat", "a suspiciously smart plant", "a volcano fair project", "a rubber glove malfunction", "a hypothesis about pizza", "a clipboard emergency", "a petri dish misunderstanding", "a safety goggle fog", "a lab mouse escape", "a Nobel speech rehearsal"]
  },
  {
    id: "superhero",
    title: "A Superhero",
    description: "a costumed rescuer with powers, poses, and terrible timing",
    details: ["an escalator cape snag", "a phone booth costume change", "a villain voicemail", "a rooftop landing pose", "a secret identity typo", "a laser pointer false alarm", "a sandwich rescue mission", "a sidekick performance review", "a super-suit laundry day", "a dramatic skyline entrance", "a badly timed theme song", "a mask tan line"]
  },
  {
    id: "tour-guide",
    title: "A Tour Guide",
    description: "an enthusiastic narrator trying to keep a group moving and impressed",
    details: ["a souvenir stampede", "the wrong tour bus", "a mixed-up flag", "a statue nobody recognizes", "a microphone feedback squeal", "a history fact panic", "a lost group member", "a museum map fold", "a scenic overlook selfie", "a bus driver detour", "a bathroom break rebellion", "a gift shop time limit"]
  },
  {
    id: "vampire",
    title: "A Vampire",
    description: "a dramatic immortal avoiding sunlight, mirrors, and suspicious questions",
    details: ["a garlic-heavy menu", "a mirror store visit", "flat-pack coffin furniture", "a sunrise weather app", "a dentist appointment", "a cape at the dry cleaner", "a blood bank mix-up", "a sunscreen commercial", "a bat transformation delay", "a neck pillow purchase", "a centuries-old password", "a midnight brunch invitation"]
  },
  {
    id: "wizard",
    title: "A Wizard",
    description: "a spellcaster with robes, magic words, and unpredictable results",
    details: ["a sneeze during a spell", "magical spellcheck", "broom traffic control", "a potion label typo", "a robe caught in a drawer", "a crystal ball smudge", "a wand battery replacement", "a spellbook return policy", "a cursed group text", "a floating grocery list", "a hat sorting argument", "a thunderstorm indoors"]
  },
  {
    id: "wrestler",
    title: "A Wrestler",
    description: "a showy competitor turning every conflict into a performance",
    details: ["a folding chair entrance", "a missing championship belt", "a turnbuckle speech", "a grocery aisle staredown", "a dramatic tag-in", "a foam finger signing", "a referee misunderstanding", "a victory belt made of cardboard", "a slow-motion entrance walk", "a pre-match snack ritual", "a trash-talk compliment", "a tiny ring bell"]
  }
] as const;

const DRAFT_FRAMES = [
  { id: "repairing", label: "Repairing", description: "trying to fix" },
  { id: "sneaking-past", label: "Sneaking Past", description: "trying to slip by" },
  { id: "explaining", label: "Explaining", description: "attempting to explain" },
  { id: "celebrating-with", label: "Celebrating With", description: "making a huge deal out of" },
  { id: "arguing-about", label: "Arguing About", description: "getting weirdly passionate about" },
  { id: "escaping-from", label: "Escaping From", description: "trying to get away from" },
  { id: "teaching", label: "Teaching", description: "giving a lesson about" },
  { id: "hiding", label: "Hiding", description: "badly trying to hide" },
  { id: "judging", label: "Judging", description: "deciding the fate of" },
  { id: "shopping-for", label: "Shopping For", description: "carefully shopping for" },
  { id: "protecting", label: "Protecting", description: "guarding" },
  { id: "misunderstanding", label: "Misunderstanding", description: "completely misunderstanding" }
] as const;

const EXPANDED_DECK: StarterDeckCard[] = DRAFT_SUBJECTS.flatMap((subject) =>
  subject.details.map((detail, index) => ({
    id: `${subject.id}-${DRAFT_FRAMES[index].id}-${detail.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    title: `${subject.title} ${DRAFT_FRAMES[index].label} ${titleCase(detail)}`,
    description: `${subject.title} is ${DRAFT_FRAMES[index].description} ${detail}; think ${subject.description}.`
  }))
);

export const STARTER_DECK: StarterDeckCard[] = [...CORE_DECK, ...EXPANDED_DECK];

function titleCase(value: string) {
  return value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}
