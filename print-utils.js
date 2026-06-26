// ============================================================
// print-utils.js — утилиты для сбора данных и печати формы 530н
// ============================================================

(function() {
    'use strict';

    // ---- Вспомогательная функция ----
    function _minutesToTime(minutes) {
        if (minutes === undefined || minutes === null) return '';
        const h = Math.floor(minutes / 60) + 9;
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // ---- Основная функция сбора данных ----
    // Использует глобальные переменные (window.stages, window.actualSingles и т.д.),
    // а также элементы DOM для ввода данных.
    // Если данные уже сохранены в localStorage, использует их (для страницы печати).
    function collectPrintData() {
        // Проверяем, есть ли уже сохранённые данные (для страницы печати)
        const stored = localStorage.getItem('anesthesiaPrintData');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.warn('Не удалось распарсить данные из localStorage, собираем заново.');
            }
        }

        // ---- Сбор данных из DOM ----
        const patientName = document.querySelector('.patient-data .param strong')?.textContent || 'Петров Иван Сергеевич';
        const birthDate = document.querySelector('.patient-data .param:nth-child(2) strong')?.textContent || '15.04.1978 (46 лет)';
        const weightHeight = document.querySelector('.patient-data .param:nth-child(3) strong')?.textContent || '178 см / 82 кг';
        const bloodGroup = document.querySelector('.patient-data .param:nth-child(5) strong')?.textContent || 'A(II) Rh+';
        const diagnosis = document.querySelector('.patient-data .param .diagnosis-short')?.textContent || 'ИБС: Безболевая ишемия миокарда.';
        const allergy = document.querySelector('.patient-data .param.danger strong')?.textContent || 'Пенициллин — анафилаксия';

        const ventilator = document.getElementById('ventilator')?.value || 'не указан';
        const circuit = document.getElementById('circuit')?.value || 'не указан';

        const ventMode = document.getElementById('ventMode')?.value || '';
        const fio2 = document.getElementById('fio2')?.value || '';
        const vt = document.getElementById('vt')?.value || '';
        const mv = document.getElementById('mv')?.value || '';
        const rr = document.getElementById('rr')?.value || '';
        const peek = document.getElementById('peek')?.value || '';
        const peep = document.getElementById('peep')?.value || '';
        const ie = document.getElementById('ie')?.value || '';
        const prolongedSupport = document.getElementById('prolongedSupport')?.checked ? 'Да' : 'Нет';

        const bloodLoss = document.getElementById('bloodLoss')?.value || '0';
        const urineOutput = document.getElementById('urineOutput')?.value || '0';

        // ---- Сбор данных из глобальных переменных (предполагается, что они доступны через window) ----
        // Если переменные определены через var, они автоматически попадают в window.
        // Если через let/const внутри IIFE – их нужно явно экспортировать, например, window.stages = stages;
        const stages = window.stages || [];
        const anesthesiaStages = window.anesthesiaStages || {};
        const actualSingles = window.actualSingles || [];
        const actualInfusions = window.actualInfusions || [];
        const vitalData = window.vitalData || {};
        const labData = window.labData || [];

        // ---- Формирование текстовых представлений ----
        const sortedStages = [...stages].sort((a, b) => a.minutes - b.minutes);
        const stageTexts = sortedStages.map(s => `${_minutesToTime(s.minutes)} — ${s.text}`).join('\n');

        const sortedAStages = Object.keys(anesthesiaStages)
            .map(Number)
            .sort((a, b) => a - b)
            .map(min => `${_minutesToTime(min)}: ${anesthesiaStages[min].join(', ')}`)
            .join('\n');

        const singlesList = actualSingles.map(d => 
            `${d.name}: ${d.detail} (${d.infusionType || 'болюс'}, ${d.volume || '?'} мл) в ${_minutesToTime(d.minutes)}`
        ).join('\n');

        const infusionsList = actualInfusions.map(d => {
            const segs = d.segments.map(s => `${_minutesToTime(s.start)}–${_minutesToTime(s.end)} (${s.tooltip})`).join('; ');
            return `${d.name}: ${d.detail} (${d.infusionType || 'капельно'}, ${d.volume || '?'} мл) — ${segs}`;
        }).join('\n');

        // ---- Мониторинг (таблица) ----
        const vitalParams = ['Пульс (уд/мин)','АД (мм рт.ст.)','SpO₂ (%)','ЦВД (смH₂O)','Температура (°C)','CO₂ (мм рт.ст.)'];
        let vitalRows = '';
        const allTimes = new Set();
        vitalParams.forEach(p => {
            if (vitalData[p]) {
                Object.keys(vitalData[p]).forEach(t => allTimes.add(parseInt(t)));
            }
        });
        const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);
        if (sortedTimes.length > 0) {
            vitalRows = '<table border="1" cellpadding="4" style="border-collapse:collapse; width:100%; font-size:11pt;">';
            vitalRows += '<tr><th>Время</th>';
            vitalParams.forEach(p => vitalRows += `<th>${p}</th>`);
            vitalRows += '</tr>';
            sortedTimes.forEach(t => {
                vitalRows += `<tr><td>${_minutesToTime(t)}</td>`;
                vitalParams.forEach(p => {
                    const val = (vitalData[p] && vitalData[p][t]) ? vitalData[p][t] : '';
                    vitalRows += `<td>${val}</td>`;
                });
                vitalRows += '</tr>';
            });
            vitalRows += '</table>';
        } else {
            vitalRows = 'Нет записей показателей.';
        }

        // ---- Лабораторные данные ----
        let labRows = '';
        if (labData.length > 0) {
            labRows = '<table border="1" cellpadding="4" style="border-collapse:collapse; width:100%; font-size:11pt;">';
            labRows += '<tr><th>Дата/время</th><th>Hb</th><th>Ht</th><th>Эр.</th><th>Лейк.</th><th>Тромб.</th><th>K+</th><th>Na+</th><th>Cl-</th><th>Fe</th><th>Глюкоза</th><th>Осм.</th><th>АЧТВ</th><th>ПТИ</th></tr>';
            labData.forEach(entry => {
                labRows += `<tr><td>${entry.datetime}</td>
                    <td>${entry.Hb || ''}</td><td>${entry.Ht || ''}</td><td>${entry.Ery || ''}</td>
                    <td>${entry.Leu || ''}</td><td>${entry.Thr || ''}</td><td>${entry.K || ''}</td>
                    <td>${entry.Na || ''}</td><td>${entry.Cl || ''}</td><td>${entry.Fe || ''}</td>
                    <td>${entry.Glu || ''}</td><td>${entry.Osm || ''}</td><td>${entry.APTT || ''}</td><td>${entry.PT || ''}</td></tr>`;
            });
            labRows += '</table>';
        } else {
            labRows = 'Нет лабораторных данных.';
        }

        // ---- Подписи и длительность ----
        const anesthesiologist = document.getElementById('anesthesiologistName')?.textContent || 'Турчанинов А.Ю.';
        const receivingDoctor = document.getElementById('receivingDoctor')?.value || '_______________';
        const nurse = document.getElementById('nurseName')?.textContent || 'Иванова М.И.';
        const surgeryDuration = document.getElementById('surgeryDuration')?.textContent || '--:--';
        const anesthesiaDuration = document.getElementById('anesthesiaDuration')?.textContent || '--:--';

        // ---- Возвращаем объект ----
        return {
            patientName, birthDate, weightHeight, bloodGroup, diagnosis, allergy,
            ventilator, circuit, surgeryDuration, anesthesiaDuration,
            ventMode, fio2, vt, mv, rr, peek, peep, ie, prolongedSupport,
            bloodLoss, urineOutput,
            stageTexts, sortedAStages, singlesList, infusionsList, vitalRows, labRows,
            anesthesiologist, receivingDoctor, nurse
        };
    }

    // ---- Генерация полного HTML-документа для печати ----
    function generatePrintHtml(data) {
        if (!data) {
            return '<p style="color:red;">Ошибка: данные не найдены.</p>';
        }

        // Извлекаем все поля из объекта
        const {
            patientName, birthDate, weightHeight, bloodGroup, diagnosis, allergy,
            ventilator, circuit, surgeryDuration, anesthesiaDuration,
            ventMode, fio2, vt, mv, rr, peek, peep, ie, prolongedSupport,
            bloodLoss, urineOutput,
            stageTexts, sortedAStages, singlesList, infusionsList, vitalRows, labRows,
            anesthesiologist, receivingDoctor, nurse
        } = data;

        // Возвращаем полноценный HTML-документ со стилями и разметкой
        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Карта анестезии (форма 530н)</title>
            <style>
                body {
                    font-family: 'Times New Roman', serif;
                    margin: 20mm;
                    font-size: 12pt;
                    line-height: 1.4;
                }
                h1 {
                    font-size: 18pt;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .header-info, .patient-block, .section, .signature-block {
                    margin-bottom: 12px;
                }
                .header-info {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 1px solid #000;
                    padding-bottom: 6px;
                }
                .patient-block {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4px 20px;
                    border: 1px solid #999;
                    padding: 8px;
                }
                .section {
                    border-top: 1px solid #000;
                    padding-top: 8px;
                }
                .section-title {
                    font-weight: bold;
                    font-size: 14pt;
                    margin-bottom: 6px;
                }
                .field {
                    display: inline-block;
                    margin-right: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11pt;
                }
                th, td {
                    border: 1px solid #000;
                    padding: 4px 6px;
                    text-align: center;
                }
                th {
                    background: #f0f0f0;
                }
                .signature-block {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 30px;
                    flex-wrap: wrap;
                    gap: 20px;
                }
                .signature-line {
                    display: inline-block;
                    width: 200px;
                    border-bottom: 1px solid #000;
                    margin-left: 10px;
                }
                .no-print { display: none; }
                @media print {
                    .no-print { display: none; }
                }
                pre {
                    font-family: inherit;
                    margin: 0;
                    white-space: pre-wrap;
                }
            </style>
        </head>
        <body>
            <h1>КАРТА ПРОВЕДЕНИЯ АНЕСТЕЗИОЛОГИЧЕСКОГО ПОСОБИЯ (форма 530н)</h1>

            <div class="header-info">
                <div><strong>Пациент:</strong> ${patientName}</div>
                <div><strong>Дата рождения:</strong> ${birthDate}</div>
                <div><strong>Группа крови:</strong> ${bloodGroup}</div>
            </div>

            <div class="patient-block">
                <div><strong>Диагноз:</strong> ${diagnosis}</div>
                <div><strong>Аллергоанамнез:</strong> ${allergy}</div>
                <div><strong>Рост/Вес:</strong> ${weightHeight}</div>
                <div><strong>Наркозный аппарат:</strong> ${ventilator}</div>
                <div><strong>Дыхательный контур:</strong> ${circuit}</div>
                <div><strong>Длительность операции:</strong> ${surgeryDuration}</div>
                <div><strong>Длительность анестезии:</strong> ${anesthesiaDuration}</div>
            </div>

            <div class="section">
                <div class="section-title">Параметры ИВЛ</div>
                <div>
                    <span class="field"><strong>Режим:</strong> ${ventMode}</span>
                    <span class="field"><strong>FiO₂:</strong> ${fio2}</span>
                    <span class="field"><strong>ДО:</strong> ${vt} мл</span>
                    <span class="field"><strong>МОД:</strong> ${mv} л/мин</span>
                    <span class="field"><strong>Частота:</strong> ${rr} в мин</span>
                    <span class="field"><strong>Пик. давление:</strong> ${peek}</span>
                    <span class="field"><strong>ПДКВ:</strong> ${peep}</span>
                    <span class="field"><strong>I:E:</strong> ${ie}</span>
                    <span class="field"><strong>Продленная поддержка:</strong> ${prolongedSupport}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Гидробаланс</div>
                <div>
                    <span class="field"><strong>Кровопотеря:</strong> ${bloodLoss} мл</span>
                    <span class="field"><strong>Диурез:</strong> ${urineOutput} мл</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Этапы операции</div>
                <pre>${stageTexts}</pre>
            </div>

            <div class="section">
                <div class="section-title">Анестезиологические этапы (А, Вв, Т, Пв, Э, Д, Б)</div>
                <pre>${sortedAStages || 'Не заданы'}</pre>
            </div>

            <div class="section">
                <div class="section-title">Введённые препараты (разовые)</div>
                <pre>${singlesList || 'Нет'}</pre>
            </div>

            <div class="section">
                <div class="section-title">Инфузионная терапия</div>
                <pre>${infusionsList || 'Нет'}</pre>
            </div>

            <div class="section">
                <div class="section-title">Мониторинг жизненно-важных функций</div>
                ${vitalRows}
            </div>

            <div class="section">
                <div class="section-title">Лабораторный мониторинг</div>
                ${labRows}
            </div>

            <div class="signature-block">
                <div>
                    <strong>Врач-анестезиолог-реаниматолог:</strong><br>
                    <span>${anesthesiologist}</span>
                    <span class="signature-line"></span> (подпись)
                </div>
                <div>
                    <strong>Врач, принявший пациента:</strong><br>
                    <span>${receivingDoctor}</span>
                    <span class="signature-line"></span> (подпись)
                </div>
                <div>
                    <strong>Мед. сестра-анестезист:</strong><br>
                    <span>${nurse}</span>
                    <span class="signature-line"></span> (подпись)
                </div>
            </div>

            <div style="text-align:center; margin-top:20px; font-size:10pt; color:#888;">
                Сформировано автоматически ${new Date().toLocaleString()}
            </div>
        </body>
        </html>`;
    }

    // ---- Экспорт функций в глобальную область ----
    window.collectPrintData = collectPrintData;
    window.generatePrintHtml = generatePrintHtml;

})();