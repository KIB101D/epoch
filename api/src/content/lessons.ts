import type { Era } from '../repo/types.js';

export interface DecisionOption {
  label: string;
  outcome: string;
  /** True for the choice that was actually made in history. */
  historical: boolean;
}

export interface Lesson {
  id: string;
  era: Era;
  order: number;
  title: string;
  year: string;
  minutes: number;
  /** The first lesson of every era is free: that is the "hook" before the paywall. */
  free: boolean;
  teaser: string;
  body: string[];
  decision: { prompt: string; options: DecisionOption[] };
}

export const LESSONS: Lesson[] = [
  {
    id: 'rome-rubicon',
    era: 'rome',
    order: 1,
    title: 'Crossing the Rubicon',
    year: '49 BC',
    minutes: 5,
    free: true,
    teaser: 'A small river, a big law, and a general who has to choose.',
    body: [
      'Julius Caesar has just conquered Gaul. His enemies in the Senate order him to give up his army and return to Rome as a private citizen, where they plan to put him on trial.',
      'Roman law forbids a general from leading his troops into Italy. The border is a shallow river called the Rubicon.',
    ],
    decision: {
      prompt: 'You are Caesar, standing on the bank with one legion. What do you do?',
      options: [
        {
          label: 'Disband the army and go to Rome alone',
          outcome: 'You keep the law, but your enemies keep the power. Most likely your career, and maybe your life, ends in a courtroom.',
          historical: false,
        },
        {
          label: 'Cross the river with your legion',
          outcome: 'Caesar crossed. Ancient writers say he declared "the die is cast". It started a civil war that he would win, and the Roman Republic never recovered.',
          historical: true,
        },
      ],
    },
  },
  {
    id: 'rome-ides',
    era: 'rome',
    order: 2,
    title: 'The Ides of March',
    year: '44 BC',
    minutes: 6,
    free: false,
    teaser: 'Dictator for life, and a meeting he is warned not to attend.',
    body: [
      'Caesar has been named dictator for life. Many senators fear he wants to become a king, the one title Romans had sworn never to accept again.',
      'On the Ides of March he is due at a Senate meeting. According to ancient sources, he received several warnings that day.',
    ],
    decision: {
      prompt: 'You are Caesar. Your wife begs you to stay home. Do you go?',
      options: [
        {
          label: 'Stay home and send your apologies',
          outcome: 'The conspiracy would have needed a new plan. History might have bought Caesar time, but not trust.',
          historical: false,
        },
        {
          label: 'Go to the Senate',
          outcome: 'Caesar went and was stabbed by a group of senators, including Brutus. Instead of saving the Republic, his murder led to more civil wars.',
          historical: true,
        },
      ],
    },
  },
  {
    id: 'rome-augustus',
    era: 'rome',
    order: 3,
    title: 'The First Emperor',
    year: '27 BC',
    minutes: 7,
    free: false,
    teaser: 'How to rule everything while pretending to rule nothing.',
    body: [
      'Octavian, Caesar\'s adopted heir, has won the civil wars. He controls the army and the treasury.',
      'Romans still hate the idea of a king. Octavian has to decide how openly to hold his power.',
    ],
    decision: {
      prompt: 'You are Octavian. How do you present your power?',
      options: [
        {
          label: 'Declare yourself king',
          outcome: 'You would share Caesar\'s fate: Rome had just shown what it does to men who look like kings.',
          historical: false,
        },
        {
          label: 'Keep the Republic\'s forms and take the title Augustus',
          outcome: 'Octavian "restored" the Republic on paper and was given the name Augustus. In practice he became Rome\'s first emperor and ruled for over 40 years.',
          historical: true,
        },
      ],
    },
  },
  {
    id: 'egypt-carpet',
    era: 'egypt',
    order: 1,
    title: 'A Secret Arrival',
    year: '48 BC',
    minutes: 5,
    free: true,
    teaser: 'An exiled queen, a Roman general, and a palace full of enemies.',
    body: [
      'Cleopatra has been pushed out of power by her brother\'s advisers. Julius Caesar has just arrived in Alexandria and is staying in the royal palace.',
      'If she walks in openly, her brother\'s soldiers will stop her. But she needs to speak to Caesar before her rivals do.',
    ],
    decision: {
      prompt: 'You are Cleopatra. How do you reach Caesar?',
      options: [
        {
          label: 'Send a letter and wait for an answer',
          outcome: 'Your brother\'s advisers control the palace. Your letter, and your claim to the throne, would likely never reach him.',
          historical: false,
        },
        {
          label: 'Get smuggled into the palace in secret',
          outcome: 'Plutarch writes that she was carried in hidden in a bedding sack. She won Caesar\'s support and got her throne back.',
          historical: true,
        },
      ],
    },
  },
  {
    id: 'egypt-antony',
    era: 'egypt',
    order: 2,
    title: 'The Alliance with Antony',
    year: '41 BC',
    minutes: 6,
    free: false,
    teaser: 'Rome is split in two, and Egypt has to pick a side.',
    body: [
      'After Caesar\'s death, Rome is divided between Octavian in the west and Mark Antony in the east. Antony summons Cleopatra to Tarsus.',
      'Egypt is the richest kingdom in the Mediterranean and Rome\'s grain supply. Both sides need it.',
    ],
    decision: {
      prompt: 'You are Cleopatra. How do you meet Antony?',
      options: [
        {
          label: 'Arrive quietly and negotiate as a client queen',
          outcome: 'You would be treated as one more eastern ruler that Rome can replace.',
          historical: false,
        },
        {
          label: 'Arrive as a goddess on a golden barge',
          outcome: 'Ancient writers describe a spectacular arrival. Antony and Cleopatra became partners in politics and in life, which tied Egypt\'s fate to his.',
          historical: true,
        },
      ],
    },
  },
  {
    id: 'egypt-actium',
    era: 'egypt',
    order: 3,
    title: 'The Battle of Actium',
    year: '31 BC',
    minutes: 7,
    free: false,
    teaser: 'One sea battle decides who rules the Roman world.',
    body: [
      'Octavian declares war on Cleopatra. Her fleet and Antony\'s are blockaded near Actium in Greece, and they are short of supplies.',
      'During the battle, a gap opens in Octavian\'s line.',
    ],
    decision: {
      prompt: 'You are Cleopatra. What do you do with your ships?',
      options: [
        {
          label: 'Stay and fight to the end',
          outcome: 'A trapped fleet with low supplies and deserting allies would most likely be destroyed in place.',
          historical: false,
        },
        {
          label: 'Break through and sail for Egypt',
          outcome: 'Cleopatra broke out, and Antony followed. The battle was lost, and within a year Egypt fell to Octavian.',
          historical: true,
        },
      ],
    },
  },
  {
    id: 'napoleon-toulon',
    era: 'napoleon',
    order: 1,
    title: 'The Captain at Toulon',
    year: '1793',
    minutes: 5,
    free: true,
    teaser: 'A port held by the British, and a 24-year-old artillery officer.',
    body: [
      'The French port of Toulon has been handed to a British-led fleet. The French army besieging it is getting nowhere.',
      'A young artillery captain, Napoleon Bonaparte, studies the map and notices the forts that overlook the harbour.',
    ],
    decision: {
      prompt: 'You are Napoleon. Where do you attack?',
      options: [
        {
          label: 'Attack the city walls directly',
          outcome: 'That was the plan that had already failed for weeks. More losses, same result.',
          historical: false,
        },
        {
          label: 'Take the heights and bombard the fleet',
          outcome: 'Napoleon pushed for capturing the forts above the harbour. Once the guns threatened the ships, the fleet left and Toulon fell. He was promoted to brigadier general.',
          historical: true,
        },
      ],
    },
  },
  {
    id: 'napoleon-austerlitz',
    era: 'napoleon',
    order: 2,
    title: 'The Sun of Austerlitz',
    year: '1805',
    minutes: 6,
    free: false,
    teaser: 'Outnumbered, Napoleon gives the enemy exactly what it wants.',
    body: [
      'Napoleon faces the combined Russian and Austrian armies. He is outnumbered.',
      'He holds the Pratzen Heights, the best ground on the battlefield.',
    ],
    decision: {
      prompt: 'You are Napoleon. What do you do with the heights?',
      options: [
        {
          label: 'Hold the heights at all costs',
          outcome: 'A safe choice: a defensive battle, but no decisive victory.',
          historical: false,
        },
        {
          label: 'Abandon the heights and look weak on purpose',
          outcome: 'Napoleon gave up the heights and weakened his right flank as bait. When the allies attacked it, he struck the centre. Austerlitz became his most famous victory.',
          historical: true,
        },
      ],
    },
  },
  {
    id: 'napoleon-moscow',
    era: 'napoleon',
    order: 3,
    title: 'Waiting in Moscow',
    year: '1812',
    minutes: 7,
    free: false,
    teaser: 'He took the city. Now the city is burning and no one comes to negotiate.',
    body: [
      'Napoleon has reached Moscow, but the city has been abandoned and fires have destroyed much of it. Tsar Alexander refuses to negotiate.',
      'Winter is coming, and the army is far from home.',
    ],
    decision: {
      prompt: 'You are Napoleon. What now?',
      options: [
        {
          label: 'Retreat immediately, before winter',
          outcome: 'An early retreat would still have been costly, but the army would have had a better chance.',
          historical: false,
        },
        {
          label: 'Wait in Moscow for the Tsar to make peace',
          outcome: 'Napoleon waited for about five weeks. Peace never came, and the retreat through the Russian winter destroyed most of his army.',
          historical: true,
        },
      ],
    },
  },
];

export const ERAS: Record<Era, { title: string; tagline: string }> = {
  rome: { title: 'Rome', tagline: 'From Republic to Empire' },
  egypt: { title: 'Egypt', tagline: 'The last queen of the Nile' },
  napoleon: { title: 'Napoleon', tagline: 'From captain to emperor' },
};
