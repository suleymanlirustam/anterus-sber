# Дизайн-система текущего прототипа

Истина для текущего оформления — **config/ui-settings.json + CSS + runtime CRMStyle**. Файл настроек и все участвующие таблицы стилей скопированы **без изменений** в tokens/. Копии tokens/ui-customization.js и ui-project-settings.js фиксируют вычисления и текущие настройки; текущая формула цветов диаграмм дополнительно находится в src/app.js, а не в CSS.

## Все редактируемые токены

| Имя токена | Значение |
| --- | --- |
| pillWidth | 104 |
| pillHeight | 28 |
| pillRadius | 8 |
| pillFont | 11 |
| buttonRadius | 8 |
| buttonHeight | 40 |
| compactHeight | 34 |
| rowButtonWidth | 96 |
| panelRadius | 12 |
| gridGap | 16 |
| baseTextSize | 14 |
| pageTitleSize | 26 |
| sectionTitleSize | 16 |
| minorTitleSize | 15 |
| pageTitleLine | 120 |
| sectionTitleLine | 135 |
| minorTitleLine | 150 |
| titleMarginTop | 0 |
| titleMarginBottom | 0 |
| sectionMarginTop | 0 |
| sectionMarginBottom | 0 |
| headingPadX | 0 |
| headingPadY | 0 |
| buttonFontSize | 14 |
| compactFontSize | 12 |
| buttonLine | 150 |
| buttonPadX | 13 |
| buttonPadY | 9 |
| compactPadX | 10 |
| compactPadY | 5 |
| pillLine | 105 |
| pillPadX | 3 |
| pillPadY | 2 |
| green | #255346 |
| terra | #a65036 |
| paper | #f5f2ec |
| surface | #fffefb |
| ink | #171a18 |
| line | #ccd2cd |
| soft | #e7eceb |
| softText | #465750 |
| warm | #f6eed9 |
| warmText | #7a561d |
| alert | #f4e2dc |
| alertText | #8f432d |
| good | #e5f1eb |
| goodText | #225e42 |
| interfaceFont | onest |
| headingFont | inherit |
| buttonFont | inherit |
| pillFontFamily | inherit |
| headingWeight | 500 |
| buttonWeight | 400 |
| pillWeight | 400 |

Числовые размеры в конфигурации — px; line-токены — проценты. Основная палитра: green #255346, terra #a65036, paper #f5f2ec, surface #fffefb, ink #171a18, line #ccd2cd. Базовые success/warning/error заданы good/goodText, warm/warmText, alert/alertText из таблицы. Не заменять их автоматически стандартными цветами Tailwind.

## Состояния задач и графики

Текущие фоны статусов: new **#ffebb8**, work **#cef2e0**, waiting **#eecabf**, done **#cacecd**; точные overrides категорий — в JSON. Нормализованные подписи и aliases также находятся в JSON, отдельно от технических кодов.

Цвета диаграмм/мини-графиков вычисляются в mountDashboardBuilder:

~~~css
--chart-new: color-mix(in srgb, <фон «Новое»> 40%, #eab52c);
--chart-work: color-mix(in srgb, <фон «В работе»> 40%, #1a9b70);
--chart-waiting: color-mix(in srgb, <фон «Согласование»> 40%, #d87357);
--chart-done: color-mix(in srgb, <фон «Завершено»> 40%, #879d94);
--chart-track: var(--soft);
~~~

То есть акцент составляет 60%, фон статуса 40%. При текущих фонах приблизительные округлённые sRGB: new #f2cb64, work #62be9d, waiting #e19681, done #a2b1ab. CSS-формула выше точнее округлённого hex. Легенда и график используют одну переменную; отдельные категории каналов имеют дополнительные производные цвета. Нулевой столбец отмечается минимальной чертой; неизвестное значение — пунктирным пропуском.

## Типографика и геометрия

- Семейство: **Onest Variable**, локальный файл. В конфигурации interfaceFont=onest, остальные семейства inherit. Fallback system-ui/sans-serif. Лицензия OFL включена в assets/.
- Body 14px, caption не менее 12px. PageTitleSize 26px, но общая CRM-шапка рассчитывает shell-title-size = round(pageTitleSize × 20/26), то есть **20px** при текущем наборе. Section 16px, minor 15px, KPI round(baseTextSize × 32/14) = **32px**. Насыщенность заголовков 500, кнопок/плашек 400.
- Базовый radius панели 12px, кнопки 8px, pill 8px, расстояние gridGap 16px. Многие дашборды переопределяют gap на 14px/12px; это фактические локальные значения, не новая универсальная шкала.
- Высота кнопки 40px, compact 34px, бейджа 28px; кнопки вида виджета 26px, width 28px (26px на узком экране), иконка 15px. Ручка/сворачивание в шапке 20px; эти исключения заданы в ui-system.css.
- Шестерёнка дашборда: width **300px**, max-width calc(100vw − 24px), строки чекбоксов **28px**, checkbox **14px**. Восьмистрочная панель в проверенном настольном состоянии около **291px** высотой.
- Поля/таблицы/карточки имеют собственные отступы и ограничения; все фактические значения сохранены в CSS, единой полной сетки spacing-токенов **не задано**.
- Тёмная тема **не нарисована**; color-scheme light. Нельзя считать тёмные классы shadcn/ui согласованными автоматически.

## Тени, фактические определения CSS

- `box-shadow:inset 3px 0 var(--green)`
- `box-shadow:0 4px 20px #0002`
- `box-shadow:10px 0 40px #0004`
- `box-shadow:inset 0 0 0 1px var(--green)`
- `box-shadow:0 8px 24px #173b3020`
- `box-shadow:12px 0 36px #173b3040`
- `box-shadow:none`
- `box-shadow:0 12px 36px #173b3029`
- `box-shadow:0 5px 20px #243b5520`
- `box-shadow:0 6px 22px #29415b26`
- `box-shadow:0 3px 12px #173e3526`
- `box-shadow:0 2px 8px #172a2020`
- `box-shadow:0 2px 4px rgba(32,55,48,.08),0 8px 18px rgba(32,55,48,.16)`

## Адаптивность

Основные рубежи: **1100px** — более тесные колонки/графики; **1000px** — плашки конструктора по две; **900px** — мобильное меню и многие одноколоночные рабочие блоки; **700px** — виджеты конструктора в одну колонку; **600px** — компактные формы, заголовки и действия. Есть дополнительные локальные условия по высоте 800px и отдельным компонентам. Это не одна брейкпоинт-система Tailwind.

Полный список реально найденных условий, без нормализации:

- `@media(min-width:1500px)`
- `@media(max-width:1180px)`
- `@media(max-width:900px)`
- `@media(max-width:640px)`
- `@media(prefers-reduced-motion:reduce)`
- `@media(min-width:641px) and (max-width:1180px)`
- `@media(min-width:1181px)`
- `@media(max-width:1100px)`
- `@media(max-width:700px)`
- `@media(min-width:901px)`
- `@media(max-width:600px)`
- `@media(max-width:650px)`
- `@media(max-width:760px)`
- `@media(max-width:1050px)`
- `@media(min-width:641px)`
- `@media(min-width:641px) and (max-width:1100px)`
- `@media(min-width:761px)`
- `@media(max-width:1200px)`
- `@media(max-width:950px)`
- `@media(min-width:1100px) and (min-height:700px)`
- `@media(max-width:500px)`
- `@media(max-width:400px)`
- `@media(min-width:1101px) and (max-height:800px)`
- `@media(max-width:1000px)`
- `@media(min-width:951px)`
- `@media print`

Снимки делались при ширине 1440 и 390. Само наличие @media не означает проверку всех промежуточных размеров и всех 100+ строк; соответствующие вопросы остаются открытыми.
