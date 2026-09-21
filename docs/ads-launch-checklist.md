# Чеклист запуска рекламы

Рабочий хвост после запуска. Живая кампания и её настройки —
[`ads-campaign-search-en-lisbon.md`](./ads-campaign-search-en-lisbon.md).
Обоснование — [`ads-strategy-v2.md`](./ads-strategy-v2.md).

**20 сентября 2026:** `Search_EN_Lisbon_InMarket` опубликована и крутится
(3 ad groups, RSA Eligible). Этот файл больше не описывает «как собрать кампанию».

---

## 1. Дособрать кампанию в Google Ads

Сделано 20 сентября 2026 — см. живой документ. Ниже — что ещё стоит
перепроверить в Settings, если мастер откатил значение.

- [ ] **Networks** — снять `Search Network partners` и `Display Network`
- [ ] **Locations** — Lisbon, Cascais, Sintra → развернуть **Location options** → выбрать
      **Presence: people in or regularly in your targeted locations**
      *(раздел свёрнут по умолчанию; по умолчанию стоит «presence or interest», из-за чего
      реклама пойдёт на людей, которые просто интересуются Лиссабоном, сидя дома)*
- [ ] **Languages** — English
- [ ] **Bidding** — `Maximize clicks` + галка «Set a maximum CPC bid limit» = **€0,60**
- [ ] **Ad rotation** — Optimise: prefer best performing

### Группы объявлений и ключи

Только фразовое (`"..."`) и точное (`[...]`) соответствие. Broad не использовать.

| Ad group | Ключевые слова | Посадочная |
|---|---|---|
| `Sunrise` | `"sunrise yoga lisbon"` `[sunrise yoga lisbon]` `"morning yoga lisbon"` `"yoga sunrise lisbon"` | `/experiences/sunrise-yoga-lisbon/` |
| `Sunset & Beach` | `"sunset yoga lisbon"` `"beach yoga lisbon"` `"yoga on the beach lisbon"` `"beach yoga cascais"` | `/experiences/sunset-yoga-ocean/` |
| `Yoga Lisbon` | `"yoga lisbon"` `[yoga lisbon]` `"yoga class lisbon"` `"yoga classes in lisbon"` `"english yoga lisbon"` `"drop in yoga lisbon"` | `/experiences/` |
| `Sintra` *(после п.4)* | `"yoga sintra"` `"forest yoga sintra"` `"sound healing sintra"` | `/experiences/yoga-sintra-forest/` |

Стартовая ставка €0,40. **`Private` не запускать** — оффер за €45 занимает тот же слот,
что Синтра за €299.

### Минус-слова (уровень кампании)

```
teacher training, ytt, 200 hour, 300 hour, certification, certificate, course,
diploma, free, gratis, jobs, hiring, job, salary, vacancy, hot yoga, bikram,
online, app, youtube, video, studio for rent, retreat center, aulas, aula,
professor, barato, preço, clothes, mat buy, leggings
```

### Объявления (RSA)

Заголовки ≤30 символов, описания ≤90. Пример для `Sunrise`:

| Тип | Текст |
|---|---|
| H | Sunrise Yoga in Lisbon |
| H | Book Online in 1 Minute |
| H | Yoga Over Lisbon at Dawn |
| H | Instant Online Booking |
| H | All Levels Welcome |
| H | From €50 Per Session |
| H | 60 Min at Portas do Sol |
| H | Classes in English |
| H | Certified RYT-300 Teacher |
| H | Reserve Your Date Today |
| H | Pay 30% Deposit Online |
| H | Small Groups, Big Views |
| D | Gentle 60-min flow as the sun rises over Lisbon. All levels, in English. |
| D | Pick your date and reserve online in under a minute. No back-and-forth. |
| D | From €50 — or €100 for up to 5 people. Mats available on request. |
| D | Small groups at Portas do Sol with a certified RYT-300 teacher. |

### Assets (расширения)

- [ ] Sitelinks: Sunrise Yoga · Sunset by the Ocean · Sintra Forest · About Ivanna
- [ ] Callouts: All Levels Welcome · Instant Online Booking · Classes in English · Small Groups · Certified RYT-300
- [ ] Structured snippet — header **Types**: Sunrise Yoga, Sunset Yoga, Forest Yoga, Private Yoga, Corporate Yoga
- [ ] Price: Sunrise €50 · Sunset €50 · Cascais €180 · Sintra €299
- [ ] Location — после создания Google Business Profile (п.6)
- [ ] Call — **не добавлять** (звонки не связываются с бронью и портят статистику)

### После создания

- [ ] Отключить **Auto-apply recommendations** — [ссылка](https://ads.google.com/aw/recommendations/settings),
      снять все галки. Иначе Google сам добавит broad-ключи и сменит стратегию
- [ ] Проверить привязку оплаты — [billing](https://ads.google.com/aw/billing/summary)

---

## 2. Тег Google на сайте — БЛОКЕР измерений

Сейчас действие-конверсия помечено в интерфейсе как *inactive*: тега на сайте нет,
фиксировать оплату нечем. Кампания работает, но вслепую.

- [x] Взять **Conversion ID** — `AW-18460763664` (в `siteConfig.googleAdsId`)
- [ ] Взять **Conversion label** — [conversions](https://ads.google.com/aw/conversions) →
      действие → Tag setup → Install the tag yourself → Google tag → строка `send_to`
      (`AW-18460763664/XXXX`). Вписать суффикс в `siteConfig.googleAdsPurchaseLabel`
      или `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL`
- [x] Поставить gtag на сайт **через `useConsent`**, как сделаны `MetaPixel` и
      `MicrosoftClarity` — не в обход cookie-баннера
- [ ] Событие покупки на `/booking/success/` — код готов, ждёт conversion label
- [ ] Исправить настройки действия-конверсии:

| Параметр | Сейчас | Нужно |
|---|---|---|
| Ценность | €1,00 | **€95** |
| Учитывать | — | **Одна** (не «Каждая») |
| Окно конверсии | — | 30 дней |
| Статус | Вспомогательное | **Основное** |
| Правило URL | — | **URL содержит** `/booking/success` |

---

## 3. Meta Conversions API (позже)

В `functions/api/stripe/webhook.ts` есть серверное подтверждение оплаты — идеальная точка
для CAPI. Событие уйдёт с сервера в обход cookie-баннера, который сейчас режет 40–60%
данных пикселя. Это снимает главный блокер для запуска Meta.

- [ ] Отправлять `Purchase` с суммой из вебхука

---

## 4. Слоты на Синтру и Кашкайш

**Бэкенд уже всё поддерживает** — `CHECKOUT_CATALOG` в `functions/_lib/pricing.ts` и
`SCHEDULED_SLUGS` в `functions/_lib/types.ts` содержат все четыре экспириенса, админка даёт
создавать слоты для любого. Не бронируются они только потому, что слотов не создано.

- [ ] Создать слоты на Sintra (€299) и Cascais (€180) в админке

Мгновенно бронируются сейчас только самые дешёвые офферы. Это перевёрнутая логика: реклама
должна вести к дорогим, а они как раз требуют переписки.

---

## 5. Реальные отзывы

`src/data/testimonials.ts` прямо помечен как placeholder. Турист покупает по отзывам,
а предоплата незнакомому человеку без единого отзыва конвертит плохо.

- [ ] Собрать 10–15 отзывов у прошлых клиентов
- [ ] Заменить заглушки в `testimonials.ts`
- [ ] Попросить продублировать в Google Business Profile

---

## 6. Бесплатные каналы — при 10 слотах в месяц выгоднее рекламы

- [ ] **Google Business Profile** — час работы, даёт карточку по запросу «yoga near me»
      от туриста в Алфаме. NAP строго как в `src/config/site.ts`
- [ ] **GetYourGuide / Airbnb Experiences / TripAdvisor** — комиссия 20–25%, но CAC нулевой.
      Синтра приносит €224 чистыми вместо €0. Модерация идёт неделями, подавать заранее
- [ ] **Партнёрства с бутик-отелями и хостелами** в Алфаме и Принсипи-Реал, комиссия 15–20%

---

## 7. Хвосты

- [ ] **Google Ads MCP** — авторизация не завершена. `pipx` и `gcloud` установлены,
      OAuth-клиент лежит в `~/.config/gcloud/ivanna-oauth-client.json`, project id `ivanna-yoga`.
      Осталось выполнить в своём терминале:
      ```bash
      gcloud auth application-default login \
        --scopes=https://www.googleapis.com/auth/adwords,https://www.googleapis.com/auth/cloud-platform \
        --client-id-file="$HOME/.config/gcloud/ivanna-oauth-client.json"
      ```
      Смысл появится через 2–3 недели, когда накопятся данные
- [ ] **Логотип** — готов в `brand/`, загрузить в Google Ads и Google Business Profile
- [ ] **Правило «одна бронь в день»** — `blockSiblingSlotsOnDay` в `functions/_lib/slots.ts`
      закрывает все остальные слоты дня. Бронь на рассвет убирает вечерний закат, хотя это
      разные концы дня. При росте спроса это половина пропускной способности
- [ ] **Meta Ads** — не раньше бюджета €300+/мес и не раньше отзывов с расписанием
      (обоснование в разделе 0.1 стратегии)

---

## Первый месяц после запуска

| Когда | Что |
|---|---|
| Неделя 1 | Ничего не трогать. Правки сбивают сбор данных |
| Неделя 2 | Search terms report → мусор в минус-слова. Посмотреть реальный CPC |
| Неделя 3 | Отключить ключи, потратившие >€5 без конверсии. Добавить Синтру |
| Неделя 4 | Стоимость брони против цели: ≤€25 coastal, ≤€45 Кашкайш, ≤€75 Синтра |

Главный вопрос месяца — **не «какой CPA», а «вырос ли средний чек»**: сдвинулись ли продажи
в сторону Синтры и Кашкайша или всё ещё держатся на сольных сессиях за €45–50.
