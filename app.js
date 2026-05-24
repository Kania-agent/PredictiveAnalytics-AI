/* PredictiveAnalytics-AI — App Logic */
document.addEventListener('DOMContentLoaded', () => {
    // Data
    const datasets = {
        revenue: {
            label: 'Revenue',
            unit: '$K',
            historical: [142, 156, 148, 162, 175, 168, 183, 192, 187, 201, 215, 208, 223, 231, 219, 242, 255, 248, 263, 272],
            predicted: [285, 293, 302, 315, 328],
            predictions: [
                { date: 'Jun 2026', value: '$285K', range: '$268K — $302K', confidence: 94, color: 'high' },
                { date: 'Jul 2026', value: '$293K', range: '$271K — $315K', confidence: 87, color: 'high' },
                { date: 'Aug 2026', value: '$302K', range: '$274K — $330K', confidence: 79, color: 'medium' },
                { date: 'Sep 2026', value: '$315K', range: '$282K — $348K', confidence: 71, color: 'medium' },
                { date: 'Oct 2026', value: '$328K', range: '$289K — $367K', confidence: 63, color: 'low' },
            ],
            kpis: [
                { label: 'Current Revenue', value: '$272K', change: '+12.3%', dir: 'up' },
                { label: 'Projected (30d)', value: '$285K', change: '+4.8%', dir: 'up' },
                { label: 'Avg Growth Rate', value: '4.2%', change: '+0.8%', dir: 'up' },
                { label: 'Forecast Confidence', value: '87%', change: '-2.1%', dir: 'down' },
            ]
        },
        users: {
            label: 'Active Users',
            unit: '',
            historical: [12400, 13100, 12800, 14200, 15600, 14900, 16300, 17100, 16800, 18200, 19500, 18900, 20100, 21300, 20600, 22400, 23800, 23100, 24600, 25900],
            predicted: [27200, 28500, 29800, 31200, 32600],
            predictions: [
                { date: 'Jun 2026', value: '27.2K', range: '25.8K — 28.6K', confidence: 92, color: 'high' },
                { date: 'Jul 2026', value: '28.5K', range: '26.1K — 30.9K', confidence: 84, color: 'high' },
                { date: 'Aug 2026', value: '29.8K', range: '26.8K — 32.8K', confidence: 76, color: 'medium' },
                { date: 'Sep 2026', value: '31.2K', range: '27.4K — 35.0K', confidence: 68, color: 'medium' },
                { date: 'Oct 2026', value: '32.6K', range: '28.0K — 37.2K', confidence: 60, color: 'low' },
            ],
            kpis: [
                { label: 'Current Users', value: '25.9K', change: '+18.7%', dir: 'up' },
                { label: 'Projected (30d)', value: '27.2K', change: '+5.0%', dir: 'up' },
                { label: 'Avg Growth Rate', value: '5.1%', change: '+1.2%', dir: 'up' },
                { label: 'Forecast Confidence', value: '84%', change: '-3.5%', dir: 'down' },
            ]
        },
        orders: {
            label: 'Order Volume',
            unit: '',
            historical: [890, 945, 912, 978, 1034, 998, 1067, 1123, 1089, 1156, 1212, 1178, 1245, 1301, 1267, 1334, 1389, 1356, 1423, 1478],
            predicted: [1534, 1589, 1645, 1712, 1778],
            predictions: [
                { date: 'Jun 2026', value: '1,534', range: '1,456 — 1,612', confidence: 91, color: 'high' },
                { date: 'Jul 2026', value: '1,589', range: '1,478 — 1,700', confidence: 83, color: 'high' },
                { date: 'Aug 2026', value: '1,645', range: '1,498 — 1,792', confidence: 75, color: 'medium' },
                { date: 'Sep 2026', value: '1,712', range: '1,524 — 1,900', confidence: 67, color: 'medium' },
                { date: 'Oct 2026', value: '1,778', range: '1,548 — 2,008', confidence: 59, color: 'low' },
            ],
            kpis: [
                { label: 'Current Orders', value: '1,478', change: '+15.2%', dir: 'up' },
                { label: 'Projected (30d)', value: '1,534', change: '+3.8%', dir: 'up' },
                { label: 'Avg Growth Rate', value: '3.8%', change: '+0.5%', dir: 'up' },
                { label: 'Forecast Confidence', value: '83%', change: '-4.2%', dir: 'down' },
            ]
        }
    };

    let currentMetric = 'revenue';

    function render() {
        const data = datasets[currentMetric];
        const allValues = [...data.historical, ...data.predicted];
        const maxVal = Math.max(...allValues) * 1.1;
        const minVal = 0;
        const range = maxVal - minVal;

        // KPIs
        document.getElementById('kpi-row').innerHTML = data.kpis.map(k => `
            <div class="kpi-card">
                <div class="kpi-label">${k.label}</div>
                <div class="kpi-value">${k.value}</div>
                <div class="kpi-change ${k.dir}">${k.dir === 'up' ? '↑' : '↓'} ${k.change}</div>
            </div>
        `).join('');

        // Y axis
        const ySteps = 6;
        document.getElementById('y-axis').innerHTML = Array.from({ length: ySteps }, (_, i) => {
            const val = maxVal - (i * range / (ySteps - 1));
            return `<span>${Math.round(val).toLocaleString()}</span>`;
        }).join('');

        // Grid lines
        document.getElementById('chart-grid').innerHTML = Array.from({ length: ySteps }, (_, i) => `
            <div class="chart-grid-line" style="top: ${(i / (ySteps - 1)) * 100}%"></div>
        `).join('');

        // Bars
        const totalBars = data.historical.length + data.predicted.length;
        const histPct = (data.historical.length / totalBars) * 100;

        let barsHtml = data.historical.map((v, i) => {
            const h = ((v - minVal) / range) * 100;
            return `<div class="chart-bar" style="height: ${h}%" data-val="${v.toLocaleString()}"></div>`;
        }).join('');

        barsHtml += data.predicted.map((v, i) => {
            const h = ((v - minVal) / range) * 100;
            return `<div class="chart-bar predicted" style="height: ${h}%" data-val="${v.toLocaleString()}"></div>`;
        }).join('');

        document.getElementById('chart-bars').innerHTML = barsHtml;

        // Chart divider
        document.getElementById('chart-divider').style.left = `${histPct}%`;

        // Confidence band
        document.getElementById('chart-confidence').style.left = `${histPct}%`;
        document.getElementById('chart-confidence').style.right = '0';

        // X axis
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const xLabels = [...Array(data.historical.length).fill('').map((_, i) => {
            const d = new Date(2024, 9 + Math.floor(i / 1.6));
            return months[d.getMonth()] + ' \'' + String(d.getFullYear()).slice(2);
        }), ...data.predicted.map((_, i) => {
            const d = new Date(2026, 5 + i);
            return months[d.getMonth()] + ' \'' + String(d.getFullYear()).slice(2);
        })];

        const xStep = Math.ceil(totalBars / 10);
        document.getElementById('x-axis').innerHTML = xLabels
            .filter((_, i) => i % xStep === 0 || i === totalBars - 1)
            .map(l => `<span>${l}</span>`)
            .join('');

        // Predictions
        document.getElementById('predictions-grid').innerHTML = data.predictions.map(p => `
            <div class="prediction-card">
                <div class="pred-header">
                    <span class="pred-date">${p.date}</span>
                    <span class="pred-confidence ${p.color}">${p.confidence}% confidence</span>
                </div>
                <div class="pred-value">${p.value}</div>
                <div class="pred-range">Range: ${p.range}</div>
                <div class="pred-bar">
                    <div class="pred-bar-fill" style="width: ${p.confidence}%; background: ${
                        p.color === 'high' ? 'var(--teal)' : p.color === 'medium' ? 'var(--amber)' : 'var(--pink)'
                    }"></div>
                </div>
            </div>
        `).join('');

        // Animate prediction bars
        setTimeout(() => {
            document.querySelectorAll('.pred-bar-fill').forEach(bar => {
                bar.style.width = bar.style.width;
            });
        }, 100);
    }

    // Metrics
    document.getElementById('metrics-grid').innerHTML = `
        <div class="metric-card">
            <div class="metric-value" style="color: var(--teal)">0.94</div>
            <div class="metric-label">R² Score</div>
            <div class="metric-bar"><div class="metric-bar-fill" style="width: 94%; background: var(--teal)"></div></div>
        </div>
        <div class="metric-card">
            <div class="metric-value" style="color: var(--accent)">3.2%</div>
            <div class="metric-label">MAPE</div>
            <div class="metric-bar"><div class="metric-bar-fill" style="width: 97%; background: var(--accent)"></div></div>
        </div>
        <div class="metric-card">
            <div class="metric-value" style="color: var(--amber)">12.8</div>
            <div class="metric-label">RMSE</div>
            <div class="metric-bar"><div class="metric-bar-fill" style="width: 85%; background: var(--amber)"></div></div>
        </div>
        <div class="metric-card">
            <div class="metric-value" style="color: var(--pink)">8.4</div>
            <div class="metric-label">MAE</div>
            <div class="metric-bar"><div class="metric-bar-fill" style="width: 88%; background: var(--pink)"></div></div>
        </div>
    `;

    // Config
    document.getElementById('config-list').innerHTML = [
        ['Algorithm', 'Prophet + LSTM Ensemble'],
        ['Training Data', '24 months historical'],
        ['Seasonality', 'Weekly + Monthly'],
        ['Confidence Level', '95% CI'],
        ['Last Retrained', '2026-05-20 03:00 UTC'],
        ['Feature Count', '14 engineered features'],
    ].map(([k, v]) => `<div class="config-item"><span class="config-key">${k}</span><span class="config-val">${v}</span></div>`).join('');

    render();

    document.getElementById('metric-select').addEventListener('change', (e) => {
        currentMetric = e.target.value;
        render();
    });

    document.getElementById('period-select').addEventListener('change', () => render());
});
