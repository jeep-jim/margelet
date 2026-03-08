function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildHook(topic, brain) {
  const hooks = {
    "problem-first": [
      `Почти все делают это неправильно, когда речь идет о ${topic}.`,
      `Если ты делаешь это с ${topic}, ты теряешь время.`,
      `Самая большая ошибка в ${topic}.`
    ],

    "bold-claim": [
      `Вот почему ${topic} работает лучше, чем думают.`,
      `Через 30 секунд ты поймешь ${topic}.`,
      `Это изменит твое отношение к ${topic}.`
    ],

    "question": [
      `Почему ${topic} не работает у большинства людей?`,
      `Ты когда-нибудь задумывался о ${topic}?`,
      `Что если ${topic} работает иначе?`
    ],

    "contrarian": [
      `Все говорят одно про ${topic}, но правда другая.`,
      `Забудь всё, что ты слышал про ${topic}.`,
      `Самый непопулярный факт о ${topic}.`
    ],

    "story-hook": [
      `История про ${topic}, которая меняет взгляд.`,
      `Одна ситуация показала мне правду о ${topic}.`,
      `Вот что произошло, когда я попробовал ${topic}.`
    ],

    "trend-hook": [
      `${topic} сейчас обсуждают все.`,
      `Новый тренд вокруг ${topic}.`,
      `Все говорят про ${topic}, но не понимают главное.`
    ]
  };

  const set = hooks[brain.hookType] || hooks["problem-first"];
  return pick(set);
}

function buildStructure(topic, brain) {
  const logic = brain.scriptLogic;

  if (logic === "problem-to-fix") {
    return [
      `Проблема: большинство людей неправильно понимают ${topic}.`,
      `Причина: они смотрят только на поверхность.`,
      `Решение: начни применять простой принцип.`,
      `Результат: ${topic} начинает работать намного эффективнее.`
    ];
  }

  if (logic === "myth-to-truth") {
    return [
      `Миф: люди думают одно про ${topic}.`,
      `Но правда в том, что всё работает иначе.`,
      `Вот реальный принцип.`,
      `Используй это и увидишь результат.`
    ];
  }

  if (logic === "steps-tutorial") {
    return [
      `Шаг 1: пойми основу ${topic}.`,
      `Шаг 2: применяй это каждый день.`,
      `Шаг 3: анализируй результат.`,
      `Шаг 4: масштабируй.`
    ];
  }

  if (logic === "comparison") {
    return [
      `Есть два подхода к ${topic}.`,
      `Первый кажется логичным.`,
      `Но второй работает лучше.`,
      `Вот почему.`
    ];
  }

  return [
    `Вот ключевая идея о ${topic}.`,
    `Большинство людей упускают этот момент.`,
    `Но если применить этот принцип.`,
    `результат становится очевидным.`
  ];
}

function buildCTA(brain) {
  const ctas = {
    soft: [
      "Если это было полезно — подпишись.",
      "Сохрани это, чтобы не забыть.",
      "Попробуй применить это сегодня."
    ],

    direct: [
      "Подпишись, чтобы не пропустить следующее.",
      "Сохрани и поделись.",
      "Подписывайся — дальше будет ещё полезнее."
    ],

    curiosity: [
      "В следующем видео будет продолжение.",
      "Есть ещё один важный момент.",
      "Продолжение в следующем ролике."
    ],

    community: [
      "Напиши в комментариях своё мнение.",
      "Поделись этим с друзьями.",
      "Расскажи, как ты используешь это."
    ]
  };

  const set = ctas[brain.ctaStyle] || ctas.soft;
  return pick(set);
}

export async function generateScript(agent) {

  const topic = agent.topic || "interesting topic";

  const brain = agent.brain || {};

  const hook = buildHook(topic, brain);

  const structure = buildStructure(topic, brain);

  const cta = buildCTA(brain);

  const title = `${topic} — простой принцип`;

  return {
    title,
    hook,
    structure,
    cta,
    brain,
    topic
  };
}