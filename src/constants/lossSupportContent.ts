/**
 * Clinical and supportive content for pregnancy loss support.
 * All texts are stored here in a single file so clinical and counseling staff can easily review and edit the wording.
 */

export const LOSS_SUPPORT_CONTENT = {
  // Page Header
  header: {
    heading: 'We are so sorry.',
    subheading: 'Take whatever time you need.',
  },

  // Today Page Banner Card
  todayCard: {
    title: 'Support after a pregnancy loss',
    description: 'Guidance for your body, your heart, and questions for your doctor. Take whatever time you need.',
  },

  // Four Main Cards on /loss-support
  cards: {
    // 1. Your Body
    yourBody: {
      title: 'Your body',
      generalExpectation:
        'In the days and weeks following a loss, your body begins a process of physical recovery. You may experience vaginal bleeding similar to or heavier than a period, mild to moderate lower abdominal cramping as your uterus returns to its usual size, breast tenderness or slight milk production, and noticeable hormonal shifts that affect your energy and emotions.',
      urgentTitle: 'When to get help urgently',
      urgentSigns: [
        'Very heavy bleeding that soaks through two or more maxi pads an hour for two hours in a row',
        'Severe abdominal pain, especially sharp or one-sided pain that does not ease with rest',
        'Fever, chills, or high body temperature',
        'Feeling faint, dizzy, lightheaded, or losing consciousness',
        'Foul-smelling or unusual vaginal discharge'
      ],
      emergencyNotice:
        'If you experience any of these signs, go to a clinic or emergency department immediately, or call 112 or an ambulance on 10177.',
      contacts: {
        generalEmergency: '112',
        ambulance: '10177',
      }
    },

    // 2. Your Heart
    yourHeart: {
      title: 'Your heart',
      message:
        'Grief after a pregnancy loss is deeply real and takes many different forms. You may feel shock, numbness, deep sadness, anger, guilt, or periods of feeling okay followed by sudden grief. There is no right or wrong way to feel, and you do not have to explain your feelings or your timeline to anyone.',
      supportNote:
        'When you feel ready, consider speaking to someone you trust—a friend, partner, family member, professional counsellor, or a health worker who understands pregnancy loss. You do not have to carry this grief alone.',
      counselingHelplines: [
        { label: 'SADAG Mental Health Line', number: '0800 567 567' },
        { label: 'Lifeline South Africa (24 hours)', number: '0861 322 322' }
      ]
    },

    // 3. Ask Your Doctor
    askYourDoctor: {
      title: 'Ask your doctor',
      intro:
        'Walking into a consultation after a loss can feel overwhelming. Here are questions you can take to your doctor or nurse during your follow-up visit:',
      questions: [
        'What happened, and is there an identifiable medical cause?',
        'What follow-up physical care or check-ups do I need over the next few weeks?',
        'Are there any tests, ultrasounds, or blood tests needed to ensure my body has completely healed?',
        'What should I ask or discuss with you before we think about trying again?'
      ],
      note: 'Every person’s recovery is unique. Your doctor will advise you based on your personal health and how your body is healing.'
    },

    // 4. Saved to Your Story
    savedToStory: {
      title: 'Saved to your story',
      message:
        'This has been added to your health story so that your next doctor or nurse can see your complete clinical context without you having to repeat difficult details from memory.',
      linkText: 'View my health story'
    }
  },

  // Settings Experience Flow Modal / Steps
  settingsFlow: {
    entryLink: 'I have lost a pregnancy',
    confirmation: {
      title: 'We are holding space for you',
      message:
        'We are so sorry for your loss. Recording this helps Mama Root adjust your journey with the care and gentleness you deserve, and keeps your medical history accurate for your doctors.',
      confirmButton: 'Continue gently',
      cancelButton: 'Cancel'
    },
    lossTypes: [
      { id: 'Miscarriage', label: 'Miscarriage' },
      { id: 'Ectopic pregnancy', label: 'Ectopic pregnancy' },
      { id: 'Stillbirth', label: 'Stillbirth' },
      { id: 'Not sure', label: 'Not sure' }
    ],
    dateQuestion: 'When did this happen?',
    hidePregnancyQuestion: 'Would you like to hide pregnancy-specific content?',
    hidePregnancyExplanation:
      'We can pause pregnancy milestones, week-by-week cards, and trimester guides so you only see content tailored to your recovery.',
    hideOptions: [
      { id: 'hide', label: 'Yes, hide pregnancy content' },
      { id: 'keep', label: 'Keep as is' }
    ],
    saveButton: 'Save to my story',
    savingButton: 'Saving...'
  }
} as const;

export type LossSupportContent = typeof LOSS_SUPPORT_CONTENT;
