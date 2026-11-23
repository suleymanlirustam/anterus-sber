# Повторяющиеся компоненты

Это собственные компоненты на HTML/JS/CSS, а не готовые shadcn-компоненты. Таблица — карта для последующего переноса, без изменения текущего дизайна.

| Компонент | Функция / идентификатор | Где лежит | Варианты и состояния | Где используется |
| --- | --- | --- | --- | --- |
| Оболочка и меню | nav, head, render, setSystem | src/app.js | 6 ролевых меню; свёрнутое/мобильное; active/hover/focus/disabled; CRM/МИС | Все 33 |
| Дизайн-токены/подписи | CRMStyle, AnterusUI | src/ui-customization.js; src/ui-foundation.js/.css | Общие токены, категории, состояния, иконки, конфликты сохранения | Все |
| Кнопка | btn, goBtn | src/app.js | primary, secondary, quiet, compact, icon-button; disabled; aria-pressed | Все |
| Информационная плашка | kpi, dashboardKpi | src/app.js; src/ui-system.css | Число, подпись, alert, компактный график; без выбора вида | Дашборды; KPI других экранов |
| Мини-график | dashboardBars, addDashboardMiniChart | src/app.js | 7 дней, распределение сейчас, месяцы; ноль и пропуск различаются | Шесть дашбордов |
| Виджет-конструктор | mountDashboardBuilder | src/app.js | Список/график, drag шапки, collapse, скрытие; предпочтения по actor/role | Все дашборды |
| Компактная видимость | dashboardVisibilitySettings | src/app.js; src/ui-system.css | Только чекбоксы, ширина 300px, строка 28px | Все дашборды |
| Кольцевая диаграмма | departmentChart, dashboardDistributionCharts, ownerDepartmentRing | src/app.js | Ноль, процент с явным знаменателем, легенда и расшифровка | Дашборды |
| Полосы и диаграмма поступлений | widget-bars, chart | src/app.js; src/ui-system.css | Числовая шкала, отрицательный net, клик по интервалу | Дашборды, финансы |
| Панель | panel, departmentPanel | src/app.js | Заголовок, описание, действие, прокрутка; старое отдельное fold | Большинство экранов |
| Таблица | table, requestTable, widgetTable, legacyTable | src/app.js; src/screen-layout.js | Сортировка, колонки, строковые действия; несколько реализаций | Очереди, финансы, сверка, расшифровки |
| Воронка/колонка | board, syncLaneControls | src/app.js | 4 состояния, счётчик, сворачивание, раскрытие карточек | Задачи, обращения, медконтроль, найм, проекты |
| Карточка | taskCard, requestCard, projectCard, screenPreviewCard | src/app.js | Приоритет, срок, ответственный, раскрыто/свёрнуто, выбранная строка | Воронки |
| Модальное окно и возврат | showDialog, dialogTrail, returnToDialogSource | src/app.js | Обычное, request, task-simple, project, owner-summary; X/Escape/Назад | Карточки и расшифровки |
| Поля формы | field, select | src/app.js | text/date/datetime-local/time/file/textarea; required/maxlength; ошибки | Формы создания и изменения |
| Период/календарь | periods, choosePeriod, pageSettingsPanel | src/app.js; src/screen-layout.js | Одна дата или интервал, текущий/прошлый период; скрыто на дашбордах | Настройки рабочих разделов, финансы |
| Фильтры | filters, pageFilterValues | src/app.js | Поиск, состояния, приоритет, срок, исполнитель, канал, область | Рабочие списки |
| Статус и приоритет | pill, requestPriority, priorityIcon, CRMStyle | src/app.js; src/ui-customization.js | Общие подписи и цвета; semantic code отдельно от label | Все сущности |
| Ползунок этапа | taskStageControls, request-stage-slider | src/app.js | Шаговый range, запрет возврата в new, aria-valuetext | Задачи, обращения |
| Процент выполнения | progress, projectProgressMarkup | src/app.js; src/projects.js | Числитель/знаменатель, 0 при пустом проекте; progress | Проекты и сводки |
| Срок и просрочка | deadline, requestTiming | src/app.js; src/domain.js | Календарный срок задач; рабочий календарь обращений; предупреждение | Очереди, карточки, KPI |
| Переписка и черновики | replyTemplateControls, captureReplyDraft, taskMessages | src/app.js; src/reply-drafts.js | Текст, адресат, вопрос/канал, local draft; состояния доставки только демо | Обращения и задачи |
| Вложения | CRMAttachments, validateAttachments | src/attachments.js; src/domain.js | IndexedDB, недоступный файл, ограничения, скачать/скрыть | Обращения, задачи, происшествия |
| Уведомление/ошибка/пусто | toast, form error, empty | src/app.js; src/notifications.js | Toast около 5,5 сек; inline role=alert; пустые списки | Все |
| Защита ввода/конфликты | CRMFormGuard, queueCommit, snapshot/revision | src/form-guard.js; src/app.js; src/access.js | Подтверждение потери ввода; конфликт вкладок; merge | Формы и диалоги |
| Резервная копия | CRMDemoBackup | src/demo-backup.js; src/app.js | Экспорт/импорт демо, файлы, отдельная восстановленная копия | Профиль admin |
| Профиль/аватар | profile-trigger, profile-menu | src/app.js | Инициалы, демо-роль, выход, восстановление | Общая оболочка |

Строки с несколькими функциями намеренно не сведены в одну абстракцию: у текущих таблиц и карточек различаются поведение и правила. При переносе потребуется сопоставить их с компонентами Anterus OS. Производственные особенности Dialog/Table/Calendar shadcn/ui здесь не проверялись.
