# Google Ads — `Search_EN_Lisbon_InMarket`

Живая кампания. Это то, что реально запущено / менялось, не черновик стратегии.

**Запущена:** 20 сентября 2026.  
**Последнее обновление доки:** 27 октября 2026.  
**Текущий раунд:** фаза 4 — **27 окт – ~5 ноя 2026** (см. ниже).

Почему выбран Search, а не Meta — в [`ads-strategy-v2.md`](./ads-strategy-v2.md).

---

## Цель

Забрать уже готовый спрос: человек **в Лиссабоне** (или регулярно там) ищет на английском `yoga lisbon` / sunrise / sunset и **платит депозит** на групповой outdoor-экспириенс.

Не узнаваемость, не WhatsApp как главная конверсия в Ads, не локалы на pt, не Private за €45.

Конверсия в Google Ads: визит на `https://ivanna-yoga.com/booking/success/` (page load). Ценность по умолчанию **€95**, учитывать **одну** на клик, статус **Primary**.

**Важно:** при Reject cookies (Consent Mode) Ads часто **не видит** конверсию, Clarity тоже пустой. Реальные оплаты сверять по Stripe + Cloudflare (`gclid` / время), не только по Ads Conversions.

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

Тег не грузится на localhost. На проде: `googletagmanager.com/gtag/js?id=AW-18460763664`.

---

## Настройки кампании (актуально на 27 окт 2026)

| Поле | Значение |
|---|---|
| Budget | Average daily **€4** (с 26/27 окт; было €2,30). Не поднимать до €10 до чекпоинта |
| Bidding | Maximize clicks, CPC cap **€1,10** (было €0,90; до 17 окт €0,60) |
| Networks | Только Search. Display и Search Partners **выкл** |
| Locations | Lisbon, Cascais, Sintra |
| Location options | **Presence** (не Presence or Interest) |
| Languages | English |
| AI Max / text optimization / Final URL Supplement | Выкл |
| Ad rotation | Optimise: prefer best performing |
| Schedule | Круглосуточно |
| Auto-apply recommendations | Всё **0** — не жать Improve health / Apply |
| EU political ads | Нет |
| Call extension | Не добавлять |

Не гнаться за Optimization score. Recommendations Google (broad, AI Max, raise budget) — dismiss.

---

## Структура

Три **ad groups**. На 17 окт — **по одному Enabled RSA** в каждой группе (дубли удалены).

| Ad group | Final URL | Path | Зачем |
|---|---|---|---|
| `Yoga Lisbon` | `/experiences/` | `yoga` / `lisbon` | Общий спрос `yoga lisbon` |
| `Sunrise Yoga` | `/experiences/sunrise-yoga-lisbon/` | `sunrise` / `lisbon` | Рассвет |
| `Sunset & Beach` | `/experiences/sunset-yoga-ocean/` | `sunset` / `beach` | Закат / пляж |

`Sintra` **не запущена**. `Private` не запускать.

Business name: `Ivanna Yoga Lisbon`. Logo — квадрат из `brand/`.

---

## Ключи

Только phrase `"..."` и exact `[...]`. Broad не использовать. Не жать Google «Add keywords».

Search term matching: **Using only your keywords and match types**.

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

На практике почти весь трафик ест **Yoga Lisbon**. Sunrise/Sunset ключи — единичные показы/клики.

---

## Минус-слова (уровень Campaign)

Стартовый список + волны из Search terms (6 окт и 17 окт). Добавлять к существующим, не заменять.

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
studio
studios
aerial
goat
retreat
loft
lx portal
leela
purna
kynd
natha
dhara
jaya
tenderness
iyengar
ashtanga
yin
campolide
chiado
rossio
saldanha
sintra
kundalini
puppy
vinyasa
retreat
retreats
ministry
yoga room
```

**Keywords paused (26/27 окт):** `"drop in yoga lisbon"` в ad group Yoga Lisbon.

Не минусовать: `yoga`, `lisbon`, `sunrise`, `sunset`, `beach`, `outdoor`, `english`.

---

## Объявления (RSA) — актуально после 17 окт

В каждой группе **один** RSA. Дубли в Yoga Lisbon и Sunrise Yoga удалены 17 окт.

### Yoga Lisbon (оставить этот)

- Final URL: `https://ivanna-yoga.com/experiences/`
- Path: `yoga` / `lisbon`
- **Заменено 17 окт:**
  - ~~Yoga Classes in Lisbon~~ → outdoor-вариант (`Outdoor Yoga Lisbon` / `Yoga in Lisbon Parks`)
  - ~~Drop-In Yoga in Lisbon~~ → `Parks & Ocean Views` / `Book Sunrise or Sunset`
- Остальные headlines ок: Yoga Lisbon · Book Online · English Yoga · Sunrise, Sunset & Beach · Outdoor Yoga in Lisbon · From €50 · deposit и т.д.
- Descriptions уже про outdoor (sunrise/sunset, book online, deposit) — не трогали

### Sunrise Yoga

- Final URL: `https://ivanna-yoga.com/experiences/sunrise-yoga-lisbon/`
- Path: `sunrise` / `lisbon`
- Оставлен ad с историей кликов (`Sunrise Yoga in Lisbon | Sunrise Yoga Lisbon | Morning Yoga…`)
- Headlines продуктовые — студийный язык не правили

### Sunset & Beach

- Final URL: `https://ivanna-yoga.com/experiences/sunset-yoga-ocean/`
- Path: `sunset` / `beach`
- Один RSA (дублей на 17 окт не разбирали отдельно; если появятся — оставить один)

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

---

## Связанные правки сайта / ops (не Ads UI)

Сделаны параллельно с разбором воронки (Clarity + Ads, ~6–17 окт):

| Что | Зачем |
|---|---|
| Копирайт `/experiences/` — outdoor / parks & ocean / travellers & expats | Интент `yoga lisbon` ≠ студия |
| Порядок карточек: Sunrise → Sunset → Cascais → Sintra | Ads-трафик не уводить сразу в €299 |
| Cascais/Sintra убраны из homepage Featured | Тяжёлые WA-only офферы |
| Карточки: `Book online · deposit` / `WhatsApp booking` | Ожидание по способу брони |
| Клик по фото карточки → detail, не zoom | Меньше тупиковых кликов |
| Empty state без слотов + явный WA | Clarity: закрывали availability |
| Депозит: `Pay €X today (30% deposit)` | Путаница с ценой |
| Фокус модалки на title, не на ✕; крупнее CTA | Open → мгновенный ✕ |
| Ask questions? (WA) в модалке слотов | Опциональный off-ramp |
| **Min 12h до слота** — слот не показывается | Кейс: букинг в 6:00 на sunrise 7:00 |

---

## История тестов и изменения

### Фаза 1 — запуск гипотезы спроса (20 сен – ~6 окт)

| | |
|---|---|
| Бюджет / CPC | €2,30/день · cap **€0,60** |
| Цель фазы | Есть ли EN search demand в Lisbon |
| Результат | Спрос на широкий `yoga lisbon` **есть**; sunrise/sunset ключи почти пустые |
| Spend (примерно) | ~€16 за ~16 дней |
| Клики / показы | ~27 кликов / ~320 impr (keywords) |
| Ads conversions | 0 |
| Search terms | Много studio/бренд/стиль (LX Portal, Leela, aerial…); клики в основном на `yoga lisbon` / `yoga in lisbon` |
| Вердикт | Спрос широкий есть; product-market fit Ads→outdoor booking **не доказан**; не масштабировать |

**Действия ~6 окт:** минусы studio/бренды/стили; бюджет не поднимать; UI outdoor на `/experiences/`.

### Фаза 2 — после минусов + UI (7–17 окт)

| | |
|---|---|
| Бюджет / CPC | €2,30 · cap всё ещё **€0,60** |
| Impr / Clicks / CTR / Cost | **72 / 9 / 12,5% / €5,38** |
| Ads conversions | 0 |
| Реальность | **1 оплата €50** (высокая вероятность Ads: Cloudflare timing + gclid-логика); cookies Reject → нет Clarity, Ads не засчитал |
| Исход брони | Session не состоялась (букинг за ~1 ч до sunrise); **refund**; клиентка из США, ожидала групповую/студийную логику |
| Bid limit warning | «100% of spend limited by max bid» — cap резал аукцион; бюджет недобирался |
| Вердикт | **Осторожный плюс:** воронка клик→оплата живая; объём мал; сезон холодает; не масштабировать |

### Изменения 17 окт 2026

1. CPC cap **€0,60 → €0,90**
2. Минусы: kundalini, puppy, vinyasa (+ пересечения со старым списком)
3. Yoga Lisbon: удалён дубль RSA; в оставшемся заменены `Yoga Classes…` и `Drop-In…`
4. Sunrise Yoga: удалён дубль RSA (оставлен с кликами)
5. Budget **не** меняли (€2,30)
6. Improve health / auto recommendations — **не** применять

### Фаза 3 — после CPC €0,90 (18–26 окт)

| | |
|---|---|
| Бюджет / CPC | €2,30 · cap **€0,90** |
| Кампания (keywords) | **~16 кликов / ~€14 / CTR ~10% / Avg CPC ~€0,87** |
| По группам | Yoga Lisbon ~13 кликов; Sunset & Beach **3** (beach cascais/lisbon); Sunrise **0** |
| Stripe / WA paid | **0** |
| Stripe Checkout | Sessions **loaded**: 22 окт ×1, 24 окт ×2 (доходили до оплаты, не completed) |
| Clarity | Много catalog bounce с Ads; 1 сильная сессия Sunset → Pay €15 deposit (26 окт); event IG → Reserve €25; private tandem с IG |
| Bid limit | К 26 окт снова «100% limited by max bid» при €0,90 |
| Вердикт | Канал доводит до Checkout; **оплаты нет**. Узкое место — закрытие Stripe, не отсутствие слотов. Не €10/день |

**Действия 26/27 окт (старт фазы 4):** CPC **€1,10**; budget **€4**; минусы retreat/ministry/yoga room; pause `drop in yoga lisbon`.

---

## Фаза 4 — текущий раунд (27 окт – ~5 ноя 2026)

### Параметры раунда

| | |
|---|---|
| Даты | **27 октября – ~5 ноября 2026** (~10 дней) |
| Budget | **€4 / день** |
| CPC cap | **€1,10** |
| Цель | Проверить: при менее жёстком cap + чуть большем бюджете появляются ли **Paid** (не только Checkout loaded) |
| Не менять в раунде | Ключи, RSA, Improve health, jump to €10, Meta |
| Ops | Слоты Sunrise/Sunset на 7–14 дней каждый день |

### Критерий успеха

Считать раунд **успешным**, если за период выполняется **хотя бы одно**:

1. **≥1 Paid** booking с высокой вероятностью Ads (Stripe succeeded + по времени/gclid/CF связано с Ads), **или**
2. **≥2 Checkout sessions loaded** и при этом **≥1 Paid** (конверсия loaded→paid не ноль), **или**
3. Слабый успех (условный): **≥3 Checkout loaded**, 0 Paid, но в Clarity/Stripe видно стабильный дожим до оплаты без технических ошибок — тогда успех **канала интереса**, провал **закрытия оплаты** (следующий шаг = UX/оффер, не pause Ads сразу).

Дополнительно желательно: Avg CPC ≤ ~€1,10; spend не «мёртвый» (есть клики в большинстве дней с погодой/слотами).

### Критерий провала

Считать раунд **провальным** для масштабирования Ads, если:

1. **0 Paid** и **0–1 Checkout loaded** при живых слотах и spend за раунд, **или**
2. Клики есть, Checkout loaded ≥2, **все** abandoned, и нет прогресса vs фаза 3 (тот же паттерн «дошли и не платят» без гипотезы что чинить), **или**
3. Показы/клики почти умерли при Eligible + слотах (спрос/сезон) — отдельный вердикт «зима», не «сломали Ads».

**Не провал сам по себе:** неравномерные дни 0–1 клик; Ads Conversions = 0 при Reject cookies; одна Incomplete session.

### Что делать после раунда

| Исход | Действие |
|---|---|
| **Успех (есть Paid)** | Держать €4 ещё 7–14 дней; CPA = spend ÷ paid; если CPA комфортный (&lt; ~€40–60 на депозитную бронь) — можно **€4 → €6–8**, не сразу €300/мес. Фиксировать search terms. |
| **Условный успех (loaded есть, Paid 0)** | Budget **не↑**. Приоритет: ясность депозита / доверие / Stripe drop-off. Ads оставить микро (€2–4) или Pause на 1–2 нед пока чините воронку. |
| **Провал (почти нет loaded + 0 Paid)** | **Pause** или €1–2/день до весны / пока outdoor-сезон; упор Maps, IG, events, hostels. Не винить только CPC. |
| **Провал спроса (0 кликов при норме настроек)** | Pause до весны; не жечь бюджет зимой. |
| В любом случае | Не включать Meta cold и не €250–300/мес без серии Paid. |

### Чекпоинт ~5 ноября

Принести:

1. Keywords CSV (лучше уровень Campaign) — **27 окт – 5 ноя**
2. Search terms CSV
3. Stripe: **loaded vs paid** (и суммы)
4. WA / слоты были?
5. Bid limit warning: есть / нет

---

## Как читать аукцион (для нас)

При Maximize clicks + CPC cap Google не ставит ставку выше cap. Если конкуренты/аукцион требуют выше — меньше показов/кликов, бюджет не добирается.

Теоретический потолок кликов:  
`дневной budget ÷ CPC` → при €2,30 и €0,60 ≈ 3–4 клика/день; при €0,90 ≈ 2–3/день **если** бюджет выбирается.  
Факт 7–17 окт: &lt;1 клика/день — упирались в аукцион/спрос, не в «кончились €2,30».

Малый объём = **cap + узкий EN outdoor + сезон**, не только ставка.

---

## Сезонность

Октябрь–февраль: outdoor/sunrise/beach слабее; больше студийного интента.  
Весна–лето: оффер сильнее.

На чекпоинтах отделять «Ads сломан» от «сезон срезал объём». Зимой нормально: маленький бюджет или Pause при пустом календаре / погоде — не €300/мес в пустой outdoor.

---

## Календарь проверок

| Когда | Что делать | Чего не делать |
|---|---|---|
| **Каждый день** | Слоты Sunrise/Sunset на 7–14 дней | Крутить ключи/ads каждый день |
| **~20–22 окт** | ✅ Сделано: после cap €0,90 warning временно ушёл | — |
| **25–26 окт** | ✅ Разбор фазы 3; старт фазы 4 (CPC €1,10, budget €4) | — |
| **До ~5 ноя** | Фаза 4: не трогать настройки; слоты | Jump to €10 / Meta |
| **~5 ноя** | Чекпоинт фазы 4 — см. критерии успеха/провала выше | Масштаб без Paid |

Масштаб **€250–300/мес** — только после серии Paid и понятного CPA, не после одной refunded оплаты и не после одних Checkout loaded.

---

## Что приносить на разбор (чеклист выгрузки)

1. **Search keywords** CSV — Impr, Clicks, CTR, Cost, Avg CPC, Conversions  
2. **Search terms** CSV  
3. Текстом: Stripe-брони, WA, были ли слоты  
4. Опционально: Clarity с `gclid` (длинные)

Не нужен: time series только Cost/CPC; Improve health.

Путь в UI: кампания → **Ads** (не Ad groups → Keywords). Search terms: Insights / вкладка Search terms у keywords.

---

## Чего никогда не включать без отдельного решения

- AI Max, broad match, Display, Search Partners  
- Auto-apply recommendations / Improve health ради score  
- Page view как primary conversion  
- Private / Sintra ad groups без слотов и оффера  
- Meta cold conversion до ~€300/мес Search и ясного CPA  

Не кликать свои объявления из поиска — только **Ad preview and diagnosis**.

---

## Хвосты

- Presence — проверить в Settings, если мастер не дал при создании  
- Billing  
- Sintra / Cascais instant slots → отдельная ad group позже  
- GBP, отзывы, hostels/Airbnb — сильнее рекламы на малом outdoor inventory  
- Трекинг без cookies: Ads Conversions занижены — сверка Stripe/CF обязательна  
- Meta — см. [`ads-strategy-v2.md`](./ads-strategy-v2.md)
