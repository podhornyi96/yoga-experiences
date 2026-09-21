# Google Ads — `Search_EN_Lisbon_InMarket`

Живая кампания. Это то, что реально запущено, не черновик стратегии.

**Запущена 20 сентября 2026.** На 21 сентября кампания включена, объявления `Eligible`, связка Campaign → 3 ad groups → RSA собрана. Показы в первые сутки могут быть нулевыми: узкие phrase/exact ключи, английский, Presence, модерация и лаг отчётов.

Почему выбран Search, а не Meta — в [`ads-strategy-v2.md`](./ads-strategy-v2.md).

---

## Цель

Забрать уже готовый спрос: человек **в Лиссабоне** ищет на английском `yoga lisbon` / sunrise / sunset и **платит 30% депозит** на групповой экспириенс.

Не узнаваемость, не WhatsApp как главная конверсия, не локалы на pt, не Private за €45.

Конверсия в Google Ads: визит на `https://ivanna-yoga.com/booking/success/` (page load). Ценность по умолчанию **€95**, учитывать **одну** на клик, статус **Primary**.

---

## Аккаунт и тег

| | |
|---|---|
| Кампания | `Search_EN_Lisbon_InMarket` |
| Тип | Search, Expert |
| Google tag | `AW-18460763664` (`siteConfig.googleAdsId`) |
| Код | `src/components/GoogleAdsSnippet.tsx` + `GoogleAdsTag.tsx` |
| Consent | Тег в HTML сразу (Consent Mode, cookies denied до Accept) |
| Purchase event `send_to` | Не нужен: действие «Покупка» — загрузка URL, не event snippet |

Тег не грузится на localhost. На проде должен быть в исходнике страницы: `googletagmanager.com/gtag/js?id=AW-18460763664`.

---

## Настройки кампании

| Поле | Как стоит / как должно стоять |
|---|---|
| Budget | Average daily **€2,30** (~€70/мес). В отдельные дни до ~2×, за месяц не выше ~€70 |
| Bidding | Maximize clicks, CPC cap **€0,60** |
| Networks | Только Search. Display и Search Partners **выкл** |
| Locations | Lisbon, Cascais, Sintra |
| Location options | **Presence** (люди в локации или регулярно там). Не Presence or Interest |
| Languages | English |
| AI Max / text optimization / Final URL Supplement | Выкл |
| Ad rotation | Optimise: prefer best performing |
| Schedule | Круглосуточно |
| Auto-apply recommendations | Всё **0** ([настройки](https://ads.google.com/aw/recommendations/settings)) |
| EU political ads | Нет |
| Call extension | Не добавлять |

Мастер иногда не даёт переключить Presence при создании — править в Settings после публикации.

---

## Структура

Три **ad groups** (в Google это не ad set). Группа = тема запроса. Объявление = текст и URL.

| Ad group | Посадочная | Зачем |
|---|---|---|
| `Yoga Lisbon` | `/experiences/` | Общий спрос `yoga lisbon` |
| `Sunrise Yoga` | `/experiences/sunrise-yoga-lisbon/` | Рассвет |
| `Sunset & Beach` | `/experiences/sunset-yoga-ocean/` | Закат / пляж |

`Sintra` **не запущена** — слотов instant booking ещё нет. `Private` не запускать.

На 20 сентября в отчёте Ads было **5 RSA** (дубли в Yoga Lisbon и Sunrise Yoga). Оставить **по одному** Enabled на группу, лишние Pause.

---

## Ключи

Только phrase `"..."` и exact `[...]`. Broad не использовать. Не жать Google «Add keywords» / Update suggestions.

### `Yoga Lisbon`

```
"yoga lisbon"
[yoga lisbon]
"yoga class lisbon"
"yoga classes in lisbon"
"yoga classes lisbon"
"english yoga lisbon"
"drop in yoga lisbon"
"yoga in lisbon"
"yoga session lisbon"
"outdoor yoga lisbon"
"yoga experiences lisbon"
```

### `Sunrise Yoga`

```
"sunrise yoga lisbon"
[sunrise yoga lisbon]
"morning yoga lisbon"
"yoga sunrise lisbon"
"sunrise yoga"
"morning yoga class lisbon"
"yoga at sunrise lisbon"
```

### `Sunset & Beach`

```
"sunset yoga lisbon"
[sunset yoga lisbon]
"beach yoga lisbon"
"yoga on the beach lisbon"
"beach yoga cascais"
"sunset yoga"
"sunset beach yoga"
"yoga sunset cascais"
"beach yoga"
```

Search term matching: **Using only your keywords and match types**.

---

## Минус-слова (кампания)

```
teacher training
ytt
200 hour
300 hour
certification
certificate
course
diploma
free
gratis
jobs
hiring
job
salary
vacancy
hot yoga
bikram
online
app
youtube
video
studio for rent
retreat center
aulas
aula
professor
barato
preço
clothes
leggings
```

---

## Объявления (RSA)

Business name: `Ivanna Yoga Lisbon`. Logo — квадрат из `brand/`.

### Yoga Lisbon

- Final URL: `https://ivanna-yoga.com/experiences/`
- Path: `yoga` / `lisbon`
- Headlines: Yoga Classes in Lisbon · Yoga Lisbon · Book Online in 1 Minute · English Yoga in Lisbon · Drop-In Yoga in Lisbon · All Levels Welcome · From €50 Per Session · Instant Online Booking · Sunrise, Sunset & Beach · Small Groups, Big Views · Certified RYT-300 Teacher · Pay 30% Deposit Online · Outdoor Yoga in Lisbon · Yoga Experiences Lisbon
- Descriptions: каталог (sunrise + sunset), instant book, €50 / €100 for 5, RYT-300 + mats

### Sunrise Yoga

- Final URL: `https://ivanna-yoga.com/experiences/sunrise-yoga-lisbon/`
- Path: `sunrise` / `lisbon`
- Headlines: Sunrise Yoga in Lisbon · Sunrise Yoga Lisbon · Morning Yoga Lisbon · Book Online in 1 Minute · Yoga Over Lisbon at Dawn · 60 Min at Portas do Sol · Morning Yoga in Lisbon · All Levels Welcome · From €50 Per Session · Instant Online Booking · Classes in English · Small Groups, Big Views · Pay 30% Deposit Online · Certified RYT-300 Teacher
- Descriptions: 60-min dawn flow, instant book, цена, Portas do Sol

### Sunset & Beach

- Final URL: `https://ivanna-yoga.com/experiences/sunset-yoga-ocean/`
- Path: `sunset` / `beach`
- Headlines: Sunset Yoga by the Ocean · Beach Yoga in Lisbon · Sunset Yoga Lisbon · Beach Yoga Lisbon · Book Online in 1 Minute · Golden Hour on the Sand · Beach Yoga Cascais · All Levels Welcome · From €50 Per Session · Instant Online Booking · Small Group, Max 8 · Classes in English · Pay 30% Deposit Online · Yoga on the Beach Lisbon
- Descriptions: Atlantic sunset flow, instant book, цена, max 8 + mats

Не добавлять в sitelinks: Private Yoga, Corporate Yoga, Contact Us.

---

## Assets (кампания)

Sitelinks:

| Текст | URL | Line 1 | Line 2 |
|---|---|---|---|
| Sunrise Yoga | `/experiences/sunrise-yoga-lisbon/` | 60 min at Portas do Sol | Book your date online |
| Sunset by the Ocean | `/experiences/sunset-yoga-ocean/` | Golden hour on the sand | Small group, all levels |
| Sintra Forest | `/experiences/yoga-sintra-forest/` | 2.5 hrs under the trees | €299 for up to 6 people |
| About Ivanna | `/about/` | Certified RYT-300 teacher | Classes in English |
| Yoga Experiences | `/experiences/` | Sunrise, sunset and forest | Book your date online |

Callouts: All Levels Welcome · Instant Online Booking · Classes in English · Small Groups · Certified RYT-300 · Mats On Request

Картинки в Search не обязательны. Display expansion не включать.

---

## Чего не трогать первую неделю

Не включать AI Max, broad, Display, Page view как цель, Call. Не кликать свои объявления — проверка только через **Ad preview and diagnosis**.

Таблица Ads в интерфейсе может быть пустой при `1–5 of 5` — баг UI. Факт: Download / Ad report.

---

## Как судить

| Когда | Что смотреть |
|---|---|
| 20–27 сен | Serving / Eligible, расход ~€2/день, не править ключи и ставки |
| ~28 сен – 4 окт | Search terms → минус-слова; реальный CPC; какая группа ест бюджет |
| Октябрь | CPA брони ≤ €25 coastal. Синтру включать после слотов в админке |

Ожидание на месяц: мало запросов, **2–4 брони из Ads** реалистично. 0 броней за первые 10 дней — не провал. Главное за 2 недели: англоязычные запросы Lisbon/sunrise/sunset и цена клика.

Клики из Ads: в URL будет `gclid`. `utm_source` сам не появляется. Clarity видит сессию только после Accept.

---

## Хвосты (не блокер кампании)

- Presence, если мастер не дал переключить
- Дубли RSA на Pause
- Billing
- Ситра / Cascais слоты → отдельная ad group позже
- GBP, отзывы, маркетплейсы — сильнее рекламы на 10 слотах/мес
- Meta — не раньше ~€300/мес
