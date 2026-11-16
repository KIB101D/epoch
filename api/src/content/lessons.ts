import type { Era } from '../repo/types.js';

export interface DecisionOption {
  label: string;
  /** What this choice would likely have led to. */
  outcome: string;
  /** True for the choice that was actually made in history. */
  historical: boolean;
}

export interface Scene {
  /** Small caption above the scene, e.g. a date or a place. */
  moment: string;
  text: string[];
  decision: { prompt: string; options: DecisionOption[] };
}

export interface Lesson {
  id: string;
  era: Era;
  order: number;
  title: string;
  year: string;
  minutes: number;
  /** The first two stories of every era are free: the hook before the paywall. */
  free: boolean;
  teaser: string;
  scenes: Scene[];
}

type Option = [label: string, outcome: string, historical?: true];
const scene = (moment: string, text: string[], prompt: string, options: Option[]): Scene => ({
  moment,
  text,
  decision: { prompt, options: options.map(([label, outcome, historical]) => ({ label, outcome, historical: Boolean(historical) })) },
});

export const LESSONS: Lesson[] = [
  // ───────────────────────────── ROME ─────────────────────────────
  {
    id: 'rome-rubicon',
    era: 'rome',
    order: 1,
    title: 'Crossing the Rubicon',
    year: '49 BC',
    minutes: 5,
    free: true,
    teaser: 'A small river, a big law, and a general who has to choose.',
    scenes: [
      scene(
        'January, 49 BC · Northern Italy',
        [
          'Julius Caesar has just conquered Gaul. His enemies in the Senate order him to give up his army and return to Rome as a private citizen, where they plan to put him on trial.',
          'Roman law forbids a general from leading troops into Italy. The border is a shallow river called the Rubicon.',
        ],
        'You are Caesar, on the riverbank with one legion. What do you do?',
        [
          ['Disband the army and go to Rome alone', 'You keep the law, but your enemies keep the power. Your career, and maybe your life, ends in a courtroom.'],
          ['Cross the river with your legion', 'Caesar crossed. Ancient writers say he declared "the die is cast". A civil war began.', true],
        ],
      ),
      scene(
        'Spring, 49 BC · Brundisium',
        [
          'Pompey, the Senate’s champion, does not defend Rome. He sails from Brundisium to Greece to gather a huge army from the East.',
          'Meanwhile, his best legions are still in Spain, behind your back.',
        ],
        'Where do you strike first?',
        [
          ['Chase Pompey to Greece at once', 'You would have an enemy army in Spain behind you and no fleet ready to cross the sea.'],
          ['Turn west and defeat his legions in Spain', 'Caesar marched on Spain first. He reportedly said he was going "to an army without a leader, and then to a leader without an army". He won there within months.', true],
        ],
      ),
      scene(
        'Corfinium',
        [
          'Your troops capture a town full of senators and officers who fought for Pompey. Your soldiers expect revenge.',
        ],
        'What do you do with your prisoners?',
        [
          ['Execute them as traitors', 'That is what Sulla did a generation earlier. Fear would spread, and every city would fight you to the end.'],
          ['Let them go free', 'Caesar released them, even with their money. His clemency became famous, and many towns opened their gates instead of fighting.', true],
        ],
      ),
    ],
  },
  {
    id: 'rome-pharsalus',
    era: 'rome',
    order: 2,
    title: 'The Battle of Pharsalus',
    year: '48 BC',
    minutes: 5,
    free: true,
    teaser: 'Outnumbered and hungry, Caesar has one battle to win it all.',
    scenes: [
      scene(
        'Summer, 48 BC · Dyrrhachium, Greece',
        [
          'You tried to trap Pompey behind siege walls. He broke through and beat you. Your army is low on food and morale.',
        ],
        'What now?',
        [
          ['Stay and keep up the siege', 'A hungry, beaten army against a well-supplied one. Another defeat could end the war.'],
          ['Retreat inland to Thessaly', 'Caesar pulled back to find food and rest. Pompey followed, and the senators with him pushed for a decisive battle.', true],
        ],
      ),
      scene(
        'August, 48 BC · Pharsalus',
        [
          'Pompey has more men and many times more cavalry. His plan is clear: ride around your right flank and attack from behind.',
        ],
        'How do you answer the cavalry?',
        [
          ['Stretch your line wider', 'A thinner line breaks more easily, and you still cannot match his horsemen.'],
          ['Hide a fourth line of infantry behind your right', 'Caesar placed picked cohorts in reserve. When Pompey’s cavalry charged, they met infantry thrusting their spears upward. The cavalry fled, and the battle turned.', true],
        ],
      ),
      scene(
        'After the battle',
        [
          'Pompey escapes and sails for Egypt, where the young king owes him a favour.',
        ],
        'Do you follow him?',
        [
          ['Stay in Greece and secure your victory', 'Pompey could raise another army in the East. The war would go on.'],
          ['Pursue him to Egypt', 'Caesar followed. But the Egyptian court had already killed Pompey to please the winner. Caesar arrived in Alexandria, where Cleopatra’s story begins.', true],
        ],
      ),
    ],
  },
  {
    id: 'rome-ides',
    era: 'rome',
    order: 3,
    title: 'The Ides of March',
    year: '44 BC',
    minutes: 6,
    free: false,
    teaser: 'Dictator for life, a crown on offer, and a meeting he is warned not to attend.',
    scenes: [
      scene(
        'February, 44 BC · The Lupercalia festival',
        [
          'Caesar is now dictator for life. In front of a huge crowd, Mark Antony offers him a royal diadem.',
          'Romans have hated kings for almost five hundred years.',
        ],
        'You are Caesar. What do you do with the crown?',
        [
          ['Accept it', 'You would confirm every fear your enemies have. The conspiracy would grow even faster.'],
          ['Refuse it in public', 'Caesar refused, and the crowd cheered. But many senators were convinced the refusal was just theatre.', true],
        ],
      ),
      scene(
        '15 March, 44 BC',
        [
          'Your wife has had a terrible dream and begs you to stay home. Ancient writers say a seer had warned you about this very day.',
        ],
        'Do you go to the Senate meeting?',
        [
          ['Stay home', 'The conspirators would need a new plan. You might have bought time, but not trust.'],
          ['Go to the Senate', 'Caesar went and was stabbed by a group of senators, including Brutus.', true],
        ],
      ),
      scene(
        'The same day · You are Brutus now',
        [
          'Caesar is dead. Mark Antony, his loyal ally and consul, is still alive. Some conspirators want to kill him too.',
        ],
        'What do you decide?',
        [
          ['Kill Antony as well', 'Without Antony, Caesar’s supporters would have lost their leader on the spot.'],
          ['Spare him and let Caesar have a public funeral', 'Brutus spared Antony. At the funeral Antony turned the crowd against the conspirators, who soon had to flee Rome.', true],
        ],
      ),
    ],
  },
  {
    id: 'rome-augustus',
    era: 'rome',
    order: 4,
    title: 'The First Emperor',
    year: '27 BC',
    minutes: 6,
    free: false,
    teaser: 'How to rule everything while pretending to rule nothing.',
    scenes: [
      scene(
        '27 BC · Rome',
        [
          'Octavian, Caesar’s adopted heir, has won every civil war. He controls the army and the treasury, but Romans still hate the idea of a king.',
        ],
        'How do you present your power?',
        [
          ['Declare yourself king', 'You would share Caesar’s fate. Rome had shown what it does to men who look like kings.'],
          ['“Restore the Republic” and take the name Augustus', 'Octavian handed power back to the Senate on paper and received the title Augustus. In practice he became the first emperor.', true],
        ],
      ),
      scene(
        'The division of provinces',
        [
          'The grateful Senate offers to let you govern some provinces directly.',
        ],
        'Which ones do you take?',
        [
          ['The rich, peaceful ones', 'Wealth without soldiers. Any general with an army could challenge you.'],
          ['The frontier provinces with the legions', 'Augustus took the provinces where most of the army was stationed. Whoever holds the legions holds Rome.', true],
        ],
      ),
    ],
  },
  {
    id: 'rome-teutoburg',
    era: 'rome',
    order: 5,
    title: 'Lost in the Forest',
    year: 'AD 9',
    minutes: 6,
    free: false,
    teaser: 'Three legions march into a German forest. A trusted ally knows the way.',
    scenes: [
      scene(
        'AD 9 · Germania',
        [
          'Governor Varus trusts Arminius, a German chief who served in the Roman army. Another chief warns Varus that Arminius is planning a revolt.',
        ],
        'You are Varus. What do you do?',
        [
          ['Arrest Arminius to be safe', 'The ambush would have lost its leader before it began.'],
          ['Ignore the warning', 'Varus dismissed it as a local feud. That was a fatal mistake.', true],
        ],
      ),
      scene(
        'Teutoburg Forest',
        [
          'Arminius reports a small uprising and suggests a route through dense forest and marshes. Your column stretches for miles.',
        ],
        'Do you take the route?',
        [
          ['Stay on known roads', 'Slower, but your legions could fight in formation.'],
          ['March through the forest', 'The Germans attacked from all sides for days. Three legions were destroyed.', true],
        ],
      ),
      scene(
        'Rome · You are Augustus',
        [
          'The emperor is said to have cried out: "Varus, give me back my legions!"',
        ],
        'What is Rome’s answer?',
        [
          ['Conquer Germania whatever it costs', 'More legions, more forests, and a war with no clear end.'],
          ['Hold the Rhine as the frontier', 'After punitive campaigns, Rome never made Germania a lasting province. The Rhine became the border for centuries.', true],
        ],
      ),
    ],
  },

  // ───────────────────────────── EGYPT ─────────────────────────────
  {
    id: 'egypt-carpet',
    era: 'egypt',
    order: 1,
    title: 'A Secret Arrival',
    year: '48 BC',
    minutes: 5,
    free: true,
    teaser: 'An exiled queen, a Roman general, and a palace full of enemies.',
    scenes: [
      scene(
        '48 BC · Alexandria',
        [
          'Cleopatra has been pushed out of power by her brother’s advisers. Julius Caesar has arrived in Alexandria and is staying in the royal palace.',
          'If she walks in openly, her brother’s soldiers will stop her.',
        ],
        'You are Cleopatra. How do you reach Caesar?',
        [
          ['Send a letter and wait', 'Your rivals control the palace. Your letter, and your claim to the throne, would likely never reach him.'],
          ['Get smuggled into the palace in secret', 'Plutarch writes that she was carried in hidden in a bedding sack. She won Caesar’s support.', true],
        ],
      ),
      scene(
        'Winter · The Alexandrian War',
        [
          'Her brother’s army besieges the palace quarter. Caesar has few soldiers, and enemy ships threaten to cut him off from the sea.',
        ],
        'What do you advise Caesar to do with the enemy fleet?',
        [
          ['Negotiate and hope they hold back', 'Without control of the harbour, no reinforcements could reach you.'],
          ['Set the ships on fire', 'Caesar burned the ships in the harbour. Ancient sources say the fire spread to buildings near the docks. Reinforcements arrived, and the war was won.', true],
        ],
      ),
      scene(
        '47 BC · Victory',
        [
          'Your older brother drowned fleeing the battle. Egyptian custom expects a royal partner on the throne.',
        ],
        'How do you rule?',
        [
          ['Rule completely alone', 'Breaking tradition so openly could cost you the support of the priests and the court.'],
          ['Share the throne with your younger brother', 'Cleopatra became co-ruler with her young brother, Ptolemy XIV, while holding the real power.', true],
        ],
      ),
    ],
  },
  {
    id: 'egypt-rome',
    era: 'egypt',
    order: 2,
    title: 'A Queen in Rome',
    year: '46 BC',
    minutes: 5,
    free: true,
    teaser: 'Caesar invites the queen of Egypt to the city that hates kings.',
    scenes: [
      scene(
        '46 BC',
        [
          'Caesar invites Cleopatra to Rome. Romans distrust foreign royalty, and her presence will cause gossip.',
        ],
        'Do you go?',
        [
          ['Stay in Alexandria', 'Safer at home, but you lose your closest look at Roman politics.'],
          ['Go to Rome', 'Cleopatra came and stayed at Caesar’s villa across the Tiber. Caesar even placed a golden statue of her in a temple.', true],
        ],
      ),
      scene(
        'Your son',
        [
          'Your son is called Caesarion, "little Caesar". Caesar has no legitimate son of his own.',
        ],
        'Do you openly claim he is Caesar’s child?',
        [
          ['Stay quiet', 'Less scandal, but your son would lose his strongest claim to power.'],
          ['Claim it openly', 'Cleopatra presented Caesarion as Caesar’s son. Years later, that claim made him a threat to Octavian.', true],
        ],
      ),
      scene(
        'March, 44 BC',
        [
          'Caesar has been murdered. Rome is in chaos, and you are a foreign queen with no protector.',
        ],
        'What do you do?',
        [
          ['Stay and fight for your son’s rights', 'With Caesar gone, his will did not even mention Caesarion. You would be alone in a hostile city.'],
          ['Leave for Egypt', 'Cleopatra returned to Alexandria and waited to see who would win the next war.', true],
        ],
      ),
    ],
  },
  {
    id: 'egypt-antony',
    era: 'egypt',
    order: 3,
    title: 'The Alliance with Antony',
    year: '41 BC',
    minutes: 6,
    free: false,
    teaser: 'Rome is split in two, and Egypt has to pick a side.',
    scenes: [
      scene(
        '41 BC · Tarsus',
        [
          'Rome is divided between Octavian in the west and Mark Antony in the east. Antony summons you to Tarsus.',
          'Egypt is the richest kingdom in the Mediterranean. Both sides need it.',
        ],
        'How do you arrive?',
        [
          ['Quietly, as an obedient client queen', 'You would be one more eastern ruler that Rome can replace.'],
          ['As a goddess, on a golden barge', 'Ancient writers describe a dazzling arrival. Antony and Cleopatra became partners in politics and in life.', true],
        ],
      ),
      scene(
        '34 BC · The Donations of Alexandria',
        [
          'Antony is ready to reward you. In a grand ceremony he can proclaim your children rulers of eastern lands.',
        ],
        'Do you hold the ceremony?',
        [
          ['Keep it private', 'Less glory, but nothing for Octavian to use against you.'],
          ['Make it a public spectacle', 'The ceremony took place. In Rome, Octavian used it as proof that Antony was giving Roman lands to a foreign queen.', true],
        ],
      ),
    ],
  },
  {
    id: 'egypt-actium',
    era: 'egypt',
    order: 4,
    title: 'The Battle of Actium',
    year: '31 BC',
    minutes: 6,
    free: false,
    teaser: 'One sea battle decides who rules the Roman world.',
    scenes: [
      scene(
        '31 BC · Greece',
        [
          'Octavian declares war on Cleopatra. Antony’s generals want a land battle, where his legions are strong.',
        ],
        'Where should the war be decided?',
        [
          ['On land', 'Antony’s experienced legions would have had their best chance.'],
          ['At sea', 'The decision was made to fight at sea. Several of Antony’s officers deserted in protest.', true],
        ],
      ),
      scene(
        '2 September, 31 BC · Actium',
        [
          'Your fleet is blockaded and short of supplies. During the battle, a gap opens in Octavian’s line.',
        ],
        'What do you do with your ships?',
        [
          ['Stay and fight to the end', 'A trapped fleet with low supplies and deserting allies would most likely be destroyed.'],
          ['Break through and sail for Egypt', 'Cleopatra broke out with the treasure fleet, and Antony followed. The battle was lost.', true],
        ],
      ),
    ],
  },
  {
    id: 'egypt-last-queen',
    era: 'egypt',
    order: 5,
    title: 'The Last Queen',
    year: '30 BC',
    minutes: 5,
    free: false,
    teaser: 'Octavian is coming. Is there anywhere left to go?',
    scenes: [
      scene(
        '30 BC · Alexandria',
        [
          'Octavian’s army is closing in. Cleopatra plans an escape: drag ships across the land to the Red Sea and sail away from Rome’s reach.',
        ],
        'Do you try it?',
        [
          ['Stay and negotiate', 'Octavian had no reason to share power with the woman he had declared war on.'],
          ['Try the Red Sea escape', 'Some ships were hauled across, but local Nabataean forces burned them. There was no way out.', true],
        ],
      ),
      scene(
        'August, 30 BC · You are Octavian',
        [
          'Antony and Cleopatra are dead, and Egypt is yours. It is the richest land in the Mediterranean and feeds Rome with grain.',
        ],
        'How do you rule Egypt?',
        [
          ['As a normal province with a senator as governor', 'A rich senator with Egypt’s grain and gold could become your next rival.'],
          ['As your personal domain, closed to senators', 'Octavian governed Egypt through his own prefect, and senators needed permission even to visit. 300 years of Ptolemaic rule ended.', true],
        ],
      ),
    ],
  },

  // ─────────────────────────── NAPOLEON ───────────────────────────
  {
    id: 'napoleon-toulon',
    era: 'napoleon',
    order: 1,
    title: 'The Captain at Toulon',
    year: '1793',
    minutes: 5,
    free: true,
    teaser: 'A port held by the British, and a 24-year-old artillery officer.',
    scenes: [
      scene(
        'Autumn, 1793 · Toulon',
        [
          'The French port of Toulon has been handed to a British-led fleet. The French siege is getting nowhere.',
          'A young artillery captain, Napoleon Bonaparte, studies the map and notices the forts above the harbour.',
        ],
        'You are Napoleon. Where do you attack?',
        [
          ['The city walls directly', 'The plan that had already failed for weeks. More losses, same result.'],
          ['The heights above the harbour', 'Napoleon pushed for taking the forts. Once French guns threatened the ships, the fleet left and Toulon fell. He was made a brigadier general.', true],
        ],
      ),
      scene(
        'October, 1795 · Paris',
        [
          'Royalist crowds march on the government. You are put in charge of its defence with very few troops.',
        ],
        'How do you stop them?',
        [
          ['Negotiate in the streets', 'A large armed crowd against a handful of soldiers. The government would likely fall.'],
          ['Bring in cannons', 'Napoleon had artillery brought in and fired on the crowd. The uprising collapsed, and he became the government’s favourite general.', true],
        ],
      ),
      scene(
        'November, 1796 · Arcole, Italy',
        [
          'Your soldiers are stuck at a bridge under heavy fire. The attack is stalling.',
        ],
        'What do you do?',
        [
          ['Stay back and send another column', 'The soldiers might break, and the Austrians could hold the crossing.'],
          ['Grab the flag and lead the charge', 'Napoleon rushed forward with a flag. The charge failed and he ended up in a ditch, but the battle was won days later, and the story became a legend.', true],
        ],
      ),
    ],
  },
  {
    id: 'napoleon-egypt',
    era: 'napoleon',
    order: 2,
    title: 'The Egyptian Gamble',
    year: '1798',
    minutes: 5,
    free: true,
    teaser: 'Britain rules the sea. Napoleon has a very different idea.',
    scenes: [
      scene(
        '1798 · Paris',
        [
          'France wants to strike at Britain, but invading across the Channel looks impossible against the Royal Navy.',
        ],
        'You are Napoleon. Where do you strike?',
        [
          ['Invade Britain anyway', 'Without control of the sea, your army could be sunk before it lands.'],
          ['Invade Egypt to threaten Britain’s route to India', 'Napoleon sailed for Egypt and took Alexandria and Cairo.', true],
        ],
      ),
      scene(
        'Preparing the expedition',
        [
          'There is space on the ships for more soldiers, or for a team of scientists, engineers and artists.',
        ],
        'Who do you bring?',
        [
          ['Only soldiers', 'More firepower, but you would leave with nothing except a military campaign.'],
          ['Scholars too', 'Over 150 scholars came. Their work founded modern Egyptology, and soldiers found the Rosetta Stone in 1799.', true],
        ],
      ),
      scene(
        '1799',
        [
          'Admiral Nelson has destroyed your fleet. You are cut off in Egypt, while in France the government is weak and unpopular.',
        ],
        'What do you do?',
        [
          ['Stay with your army', 'You would share the army’s fate far from where real power is decided.'],
          ['Slip back to France', 'Napoleon sailed home secretly. Weeks later he seized power in the coup of 18 Brumaire.', true],
        ],
      ),
    ],
  },
  {
    id: 'napoleon-emperor',
    era: 'napoleon',
    order: 3,
    title: 'The Crown and the Code',
    year: '1804',
    minutes: 5,
    free: false,
    teaser: 'A revolution that ended a monarchy now crowns an emperor.',
    scenes: [
      scene(
        '2 December, 1804 · Notre-Dame',
        [
          'The Pope has come from Rome for your coronation. Traditionally, the Church places the crown on the ruler’s head.',
        ],
        'Who crowns you?',
        [
          ['The Pope, as tradition says', 'That would suggest your power comes from the Church.'],
          ['You crown yourself', 'Napoleon took the crown and placed it on his own head, then crowned Josephine.', true],
        ],
      ),
      scene(
        'Laws for a new France',
        [
          'Before the revolution, France had hundreds of different local laws. Your lawyers have drafted one code for the whole country.',
        ],
        'Do you make it law?',
        [
          ['Keep the old local laws', 'Less resistance, but the country stays divided by its own rules.'],
          ['One civil code for everyone', 'The Civil Code of 1804 became law and influenced legal systems around the world.', true],
        ],
      ),
    ],
  },
  {
    id: 'napoleon-austerlitz',
    era: 'napoleon',
    order: 4,
    title: 'The Sun of Austerlitz',
    year: '1805',
    minutes: 6,
    free: false,
    teaser: 'Outnumbered, Napoleon gives the enemy exactly what it wants.',
    scenes: [
      scene(
        '1 December, 1805 · Moravia',
        [
          'You face the Russian and Austrian armies, and you are outnumbered. You hold the Pratzen Heights, the best ground on the field.',
        ],
        'What do you do with the heights?',
        [
          ['Hold the heights at all costs', 'A safe choice: a defensive battle, but no decisive victory.'],
          ['Abandon them and look weak on purpose', 'Napoleon gave up the heights and weakened his right flank as bait.', true],
        ],
      ),
      scene(
        '2 December, 1805 · Morning',
        [
          'The allies take the bait and pour down from the heights to attack your weak right. Their centre is thinning.',
        ],
        'When do you strike?',
        [
          ['Wait for more of them to commit', 'Wait too long and your right flank could collapse.'],
          ['Strike the centre now', 'As the morning mist lifted, French columns stormed the heights and split the allied army. Austerlitz became Napoleon’s most famous victory.', true],
        ],
      ),
    ],
  },
  {
    id: 'napoleon-moscow',
    era: 'napoleon',
    order: 5,
    title: 'Waiting in Moscow',
    year: '1812',
    minutes: 6,
    free: false,
    teaser: 'He took the city. Now it is burning, and no one comes to negotiate.',
    scenes: [
      scene(
        'June, 1812 · The Neman river',
        [
          'Russia has stopped respecting your blockade of British trade. You have gathered the largest army Europe has ever seen.',
        ],
        'Do you invade?',
        [
          ['Keep the pressure diplomatic', 'A cold standoff, but your Grand Army stays intact.'],
          ['Invade Russia', 'Napoleon crossed the Neman with over 400,000 men.', true],
        ],
      ),
      scene(
        'September, 1812 · Moscow',
        [
          'You have reached Moscow, but the city is abandoned, and fires destroy much of it. The Tsar refuses to negotiate. Winter is coming.',
        ],
        'What now?',
        [
          ['Retreat immediately', 'An early retreat would still have been costly, but the army would have had a better chance.'],
          ['Wait for the Tsar to make peace', 'Napoleon waited about five weeks. Peace never came.', true],
        ],
      ),
      scene(
        'October, 1812 · The retreat',
        [
          'You try to go south through untouched land, but after a fierce battle at Maloyaroslavets the way is blocked.',
        ],
        'Which road home?',
        [
          ['Fight your way south', 'Another battle with a tired army, far from supplies.'],
          ['Take the road you came by', 'Napoleon turned back to the old road, already stripped of food. Cold, hunger and attacks destroyed most of his army.', true],
        ],
      ),
    ],
  },
];

export const ERAS: Record<Era, { title: string; tagline: string }> = {
  rome: { title: 'Rome', tagline: 'From Republic to Empire' },
  egypt: { title: 'Egypt', tagline: 'The last queen of the Nile' },
  napoleon: { title: 'Napoleon', tagline: 'From captain to emperor' },
};
